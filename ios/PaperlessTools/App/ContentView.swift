import SwiftUI

struct ContentView: View {
    @State private var selectedTab = 0

    var body: some View {
        TabView(selection: $selectedTab) {
            HomeView(selectedTab: $selectedTab)
                .tabItem {
                    Label("Home", systemImage: "house.fill")
                }
                .tag(0)

            ToolsView()
                .tabItem {
                    Label("Tools", systemImage: "square.grid.2x2.fill")
                }
                .tag(1)

            ScanTabView()
                .tabItem {
                    Label("Scan", systemImage: "viewfinder")
                }
                .tag(2)

            SettingsView()
                .tabItem {
                    Label("More", systemImage: "ellipsis.circle.fill")
                }
                .tag(3)
        }
        .paperlessScreenBackground()
    }
}

@ViewBuilder
func destinationView(for destination: ToolDestination) -> some View {
    Group {
        switch destination {
        case .qrTools:
            QRToolsView()
        case .urlShortener:
            URLShortenerView()
        case .documentScanner:
            DocumentScannerView()
        case .mergePdf:
            MergePDFView()
        case .splitPdf:
            SplitPDFView()
        case .compressPdf:
            CompressPDFView()
        case .pdfToImage:
            PDFToImageView()
        case .fillAndSign:
            FillAndSignView()
        case .imageToPdf:
            ImageToPDFView()
        case .redactPdf:
            RedactPDFView()
        case .cropPdf:
            CropPDFView()
        case .extractText:
            ExtractTextView()
        case .invoiceBuilder:
            InvoiceBuilderView()
        case .teleprompter:
            TeleprompterView()
        case .qrScanner:
            QRScannerView()
        }
    }
    .toolbar(.hidden, for: .tabBar)
}

func destination(for slug: ToolSlug) -> ToolDestination? {
    switch slug {
    case .qrTools: return .qrTools
    case .urlShortener: return .urlShortener
    case .documentScanner: return .documentScanner
    case .mergePdf: return .mergePdf
    case .splitPdf: return .splitPdf
    case .compressPdf: return .compressPdf
    case .pdfToImage: return .pdfToImage
    case .fillAndSign: return .fillAndSign
    case .imageToPdf: return .imageToPdf
    case .redactPdf: return .redactPdf
    case .cropPdf: return .cropPdf
    case .extractText: return .extractText
    case .invoiceBuilder: return .invoiceBuilder
    case .teleprompter: return .teleprompter
    }
}
