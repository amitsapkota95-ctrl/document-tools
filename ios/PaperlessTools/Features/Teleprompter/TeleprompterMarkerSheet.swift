import SwiftUI

struct TeleprompterMarkerSheet: View {
    let markers: [TeleprompterScriptMarker]
    let onSelect: (TeleprompterScriptMarker) -> Void
    @Environment(\.dismiss) private var dismiss

    var body: some View {
        NavigationStack {
            List {
                if markers.isEmpty {
                    Text("Add `=== Section Name ===` lines to your script to create markers.")
                        .font(.captionText)
                        .foregroundStyle(Color.sandLight)
                } else {
                    ForEach(markers) { marker in
                        Button {
                            onSelect(marker)
                            dismiss()
                        } label: {
                            HStack {
                                Image(systemName: "play.fill")
                                    .foregroundStyle(Color.forest)
                                Text(marker.label)
                                    .foregroundStyle(Color.ink)
                            }
                        }
                    }
                }
            }
            .navigationTitle("Section Markers")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Close") { dismiss() }
                }
            }
        }
    }
}
