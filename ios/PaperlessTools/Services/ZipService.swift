import Foundation
import zlib

enum ZipServiceError: LocalizedError {
    case emptyArchive
    case writeFailed

    var errorDescription: String? {
        switch self {
        case .emptyArchive: return "No files to archive."
        case .writeFailed: return "Could not create the zip file."
        }
    }
}

enum ZipService {
    static func createArchive(filename: String, entries: [(name: String, data: Data)]) throws -> URL {
        guard !entries.isEmpty else { throw ZipServiceError.emptyArchive }

        var archive = Data()
        var centralDirectory = Data()
        var offset: UInt32 = 0

        for entry in entries {
            let nameData = Data(entry.name.utf8)
            let crc = crc32Checksum(entry.data)
            let localHeader = localFileHeader(
                crc: crc,
                compressedSize: UInt32(entry.data.count),
                uncompressedSize: UInt32(entry.data.count),
                nameLength: UInt16(nameData.count),
                offset: offset
            )

            archive.append(localHeader)
            archive.append(nameData)
            archive.append(entry.data)

            centralDirectory.append(
                centralDirectoryHeader(
                    crc: crc,
                    compressedSize: UInt32(entry.data.count),
                    uncompressedSize: UInt32(entry.data.count),
                    nameLength: UInt16(nameData.count),
                    localHeaderOffset: offset
                )
            )
            centralDirectory.append(nameData)

            offset += UInt32(localHeader.count + nameData.count + entry.data.count)
        }

        let centralDirectoryOffset = offset
        archive.append(centralDirectory)

        let endRecord = endOfCentralDirectory(
            entryCount: UInt16(entries.count),
            centralDirectorySize: UInt32(centralDirectory.count),
            centralDirectoryOffset: centralDirectoryOffset
        )
        archive.append(endRecord)

        let url = FileManager.default.temporaryDirectory
            .appendingPathComponent("\(FilenameHelper.sanitize(filename)).zip")
        do {
            try archive.write(to: url)
            return url
        } catch {
            throw ZipServiceError.writeFailed
        }
    }

    private static func crc32Checksum(_ data: Data) -> UInt32 {
        data.withUnsafeBytes { buffer in
            guard let base = buffer.baseAddress?.assumingMemoryBound(to: UInt8.self) else { return 0 }
            return UInt32(crc32(0, base, uInt(buffer.count)))
        }
    }

    private static func localFileHeader(
        crc: UInt32,
        compressedSize: UInt32,
        uncompressedSize: UInt32,
        nameLength: UInt16,
        offset: UInt32
    ) -> Data {
        var data = Data()
        data.appendUInt32(0x0403_4b50)
        data.appendUInt16(20)
        data.appendUInt16(0)
        data.appendUInt16(0)
        data.appendUInt16(0)
        data.appendUInt16(0)
        data.appendUInt32(crc)
        data.appendUInt32(compressedSize)
        data.appendUInt32(uncompressedSize)
        data.appendUInt16(nameLength)
        data.appendUInt16(0)
        _ = offset
        return data
    }

    private static func centralDirectoryHeader(
        crc: UInt32,
        compressedSize: UInt32,
        uncompressedSize: UInt32,
        nameLength: UInt16,
        localHeaderOffset: UInt32
    ) -> Data {
        var data = Data()
        data.appendUInt32(0x0201_4b50)
        data.appendUInt16(20)
        data.appendUInt16(20)
        data.appendUInt16(0)
        data.appendUInt16(0)
        data.appendUInt16(0)
        data.appendUInt16(0)
        data.appendUInt32(crc)
        data.appendUInt32(compressedSize)
        data.appendUInt32(uncompressedSize)
        data.appendUInt16(nameLength)
        data.appendUInt16(0)
        data.appendUInt16(0)
        data.appendUInt16(0)
        data.appendUInt16(0)
        data.appendUInt32(0)
        data.appendUInt32(localHeaderOffset)
        return data
    }

    private static func endOfCentralDirectory(
        entryCount: UInt16,
        centralDirectorySize: UInt32,
        centralDirectoryOffset: UInt32
    ) -> Data {
        var data = Data()
        data.appendUInt32(0x0605_4b50)
        data.appendUInt16(0)
        data.appendUInt16(0)
        data.appendUInt16(entryCount)
        data.appendUInt16(entryCount)
        data.appendUInt32(centralDirectorySize)
        data.appendUInt32(centralDirectoryOffset)
        data.appendUInt16(0)
        return data
    }
}

private extension Data {
    mutating func appendUInt16(_ value: UInt16) {
        var littleEndian = value.littleEndian
        append(Data(bytes: &littleEndian, count: MemoryLayout<UInt16>.size))
    }

    mutating func appendUInt32(_ value: UInt32) {
        var littleEndian = value.littleEndian
        append(Data(bytes: &littleEndian, count: MemoryLayout<UInt32>.size))
    }
}
