import SwiftUI

struct SettingsView: View {
    @State private var signatures: [SavedSignature] = StorageService.loadSignatures()

    var body: some View {
        NavigationStack {
            List {
                Section {
                    VStack(alignment: .leading, spacing: 6) {
                        Text("Paperless Tools")
                            .font(.sectionTitle)
                        Text("Your saved signatures and app info.")
                            .font(.captionText)
                            .foregroundStyle(Color.sandLight)
                    }
                    .padding(.vertical, 4)
                }

                Section("Saved Signatures") {
                    if signatures.isEmpty {
                        Text("No saved signatures yet. Create one in Fill & Sign.")
                            .font(.captionText)
                            .foregroundStyle(Color.sandLight)
                    } else {
                        ForEach(signatures) { signature in
                            HStack(spacing: 12) {
                                if let image = signature.image {
                                    Image(uiImage: image)
                                        .resizable()
                                        .scaledToFit()
                                        .frame(width: 80, height: 40)
                                }
                                VStack(alignment: .leading) {
                                    Text(signature.name)
                                        .font(.cardTitle)
                                    Text(signature.createdAt.formatted(date: .abbreviated, time: .omitted))
                                        .font(.captionText)
                                        .foregroundStyle(Color.sandLight)
                                }
                            }
                            .swipeActions {
                                Button(role: .destructive) {
                                    StorageService.deleteSignature(id: signature.id)
                                    signatures = StorageService.loadSignatures()
                                } label: {
                                    Label("Delete", systemImage: "trash")
                                }
                            }
                        }
                    }
                }

                Section("About") {
                    Link(destination: URL(string: "https://paperless.tools")!) {
                        Label("Website", systemImage: "globe")
                    }
                    HStack {
                        Text("Version")
                        Spacer()
                        Text("1.0.0")
                            .foregroundStyle(Color.sandLight)
                    }
                }

            }
            .scrollContentBackground(.hidden)
            .background(Color.paper.ignoresSafeArea())
            .navigationTitle("More")
            .onAppear {
                signatures = StorageService.loadSignatures()
            }
        }
    }
}
