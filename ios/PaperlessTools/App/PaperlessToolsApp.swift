import SwiftUI

@main
struct PaperlessToolsApp: App {
    @StateObject private var sharedImportCoordinator = SharedImportCoordinator()

    init() {
        PaperlessAppearance.configure()
    }

    var body: some Scene {
        WindowGroup {
            ContentView()
                .environmentObject(sharedImportCoordinator)
                .tint(.forest)
                .onOpenURL { url in
                    sharedImportCoordinator.handleIncomingURL(url)
                }
                .fullScreenCover(item: $sharedImportCoordinator.pendingRoute) { route in
                    SharedImportDestinationView(route: route) {
                        sharedImportCoordinator.clearPendingImport()
                    }
                }
        }
    }
}
