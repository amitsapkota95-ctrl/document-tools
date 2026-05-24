import Foundation

struct ShortenResponse: Codable {
    let shortUrl: String
    let code: String
    let statsUrl: String
}

struct ShortenErrorResponse: Codable {
    let error: String
}

enum APIServiceError: LocalizedError {
    case invalidURL
    case serverError(String)
    case decodingFailed

    var errorDescription: String? {
        switch self {
        case .invalidURL:
            return "Please enter a valid http or https URL."
        case .serverError(let message):
            return message
        case .decodingFailed:
            return "Could not read the server response."
        }
    }
}

enum APIService {
    static let baseURL = "https://paperless.tools"

    static func shortenURL(_ urlString: String) async throws -> ShortenResponse {
        let trimmed = urlString.trimmingCharacters(in: .whitespacesAndNewlines)
        guard let url = URL(string: "\(baseURL)/api/shorten") else {
            throw APIServiceError.invalidURL
        }

        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.httpBody = try JSONEncoder().encode(["url": trimmed])

        let (data, response) = try await URLSession.shared.data(for: request)
        guard let httpResponse = response as? HTTPURLResponse else {
            throw APIServiceError.decodingFailed
        }

        if httpResponse.statusCode >= 400 {
            if let errorResponse = try? JSONDecoder().decode(ShortenErrorResponse.self, from: data) {
                throw APIServiceError.serverError(errorResponse.error)
            }
            throw APIServiceError.serverError("Could not shorten URL.")
        }

        guard let result = try? JSONDecoder().decode(ShortenResponse.self, from: data) else {
            throw APIServiceError.decodingFailed
        }
        return result
    }
}
