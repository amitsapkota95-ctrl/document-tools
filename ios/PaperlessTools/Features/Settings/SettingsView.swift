import SwiftUI

struct SettingsView: View {
    @State private var signatures: [SavedSignature] = StorageService.loadSignatures()

    var body: some View {
        NavigationStack {
            List {
                Section {
                    HStack(spacing: 14) {
                        Image("BrandIcon")
                            .resizable()
                            .scaledToFit()
                            .frame(width: 56, height: 56)
                            .clipShape(RoundedRectangle(cornerRadius: 13, style: .continuous))
                            .accessibilityHidden(true)

                        VStack(alignment: .leading, spacing: 6) {
                            Text("Paperless Tools")
                                .font(.sectionTitle)
                                .foregroundStyle(Color.ink)
                            Text("Your saved signatures and app info.")
                                .font(.captionText)
                                .foregroundStyle(Color.sandLight)
                        }
                    }
                    .padding(.vertical, 4)
                    .listRowBackground(Color.cream)
                }

                Section("Saved Signatures") {
                    if signatures.isEmpty {
                        Text("No saved signatures yet. Create one in Fill & Sign.")
                            .font(.captionText)
                            .foregroundStyle(Color.sandLight)
                            .listRowBackground(Color.cream)
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
                                        .foregroundStyle(Color.ink)
                                    Text(signature.createdAt.formatted(date: .abbreviated, time: .omitted))
                                        .font(.captionText)
                                        .foregroundStyle(Color.sandLight)
                                }
                            }
                            .listRowBackground(Color.cream)
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
                    Link(destination: URL(string: "https://paperless.tools/privacy")!) {
                        Label("Privacy Policy", systemImage: "hand.raised")
                    }
                    .listRowBackground(Color.cream)

                    Link(destination: URL(string: "https://paperless.tools")!) {
                        Label("Website", systemImage: "globe")
                    }
                    .listRowBackground(Color.cream)

                    HStack {
                        Text("Version")
                            .foregroundStyle(Color.ink)
                        Spacer()
                        Text("1.0.0")
                            .foregroundStyle(Color.sandLight)
                    }
                    .listRowBackground(Color.cream)
                }

            }
            .scrollContentBackground(.hidden)
            .paperlessScreenBackground()
            .navigationTitle("More")
            .onAppear {
                signatures = StorageService.loadSignatures()
            }
        }
    }
}
