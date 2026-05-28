import SwiftUI

@main
struct PaperlessToolsApp: App {
    @StateObject private var sharedImportCoordinator = SharedImportCoordinator()

    init() {
        PaperlessAppearance.configure()
        Task.detached(priority: .utility) {
            TemporaryFileCleanup.purgeStaleExports()
        }
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
                .alert(
                    "Import Failed",
                    isPresented: Binding(
                        get: { sharedImportCoordinator.importErrorMessage != nil },
                        set: { isPresented in
                            if !isPresented {
                                sharedImportCoordinator.clearImportError()
                            }
                        }
                    )
                ) {
                    Button("OK", role: .cancel) {
                        sharedImportCoordinator.clearImportError()
                    }
                } message: {
                    Text(sharedImportCoordinator.importErrorMessage ?? "Couldn't open the shared file.")
                }
        }
    }
}
