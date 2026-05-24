import SwiftUI

struct ScanTabView: View {
    @State private var showQRScanner = false
    @State private var showDocumentScanner = false

    var body: some View {
        NavigationStack {
            VStack(spacing: 20) {
                Spacer()

                Image(systemName: "viewfinder")
                    .font(.system(size: 56))
                    .foregroundStyle(Color.forest)

                Text("Scan")
                    .font(.heroTitle)
                    .foregroundStyle(Color.ink)

                Text("Scan QR codes or capture documents with your camera.")
                    .font(.bodyText)
                    .foregroundStyle(Color.sandLight)
                    .multilineTextAlignment(.center)
                    .padding(.horizontal, 32)

                VStack(spacing: 12) {
                    PrimaryButton(title: "Scan QR Code", icon: "qrcode.viewfinder") {
                        showQRScanner = true
                    }
                    PrimaryButton(title: "Scan Document", icon: "doc.viewfinder") {
                        showDocumentScanner = true
                    }
                }
                .padding(.horizontal, 24)
                .padding(.top, 8)

                PrivacyBadge()
                    .padding(.top, 8)

                Spacer()
            }
            .frame(maxWidth: .infinity, maxHeight: .infinity)
            .background(Color.paper.ignoresSafeArea())
            .navigationTitle("Scan")
            .navigationDestination(isPresented: $showQRScanner) {
                QRScannerView()
            }
            .navigationDestination(isPresented: $showDocumentScanner) {
                DocumentScannerView()
            }
        }
    }
}
