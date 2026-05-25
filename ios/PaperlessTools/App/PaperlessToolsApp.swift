import SwiftUI

@main
struct PaperlessToolsApp: App {
    @StateObject private var sharedImportCoordinator = SharedImportCoordinator()

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
