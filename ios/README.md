# paperless.tools — iOS App

Native SwiftUI iOS app for paperless.tools. All document processing runs on-device; only the URL shortener calls the existing Cloudflare API.

## Requirements

- macOS with **Xcode 16+**
- iOS **17.0+** deployment target
- Apple Developer account (for device testing, TestFlight, App Store)

## Open the Project

```bash
open ios/PaperlessTools/PaperlessTools.xcodeproj
```

## First-Time Setup

1. Select the **PaperlessTools** target → **Signing & Capabilities**
2. Set your **Team** (Apple Developer account)
3. Confirm bundle ID: `tools.paperless.app`
4. Enable App Group capability: `group.tools.paperless.app` (must match entitlements)
5. Repeat for **PaperlessToolsShareExtension** (`tools.paperless.app.share`)
6. Build and run on simulator or device (⌘R)

## MVP Features

| Tool | Framework | Offline |
|------|-----------|---------|
| QR Generator (9 types) | Core Image | Yes |
| QR Scanner | AVFoundation | Yes |
| URL Shortener | URLSession → `/api/shorten` | No |
| Document Scanner | VisionKit | Yes |
| Merge PDF | PDFKit | Yes |
| Fill & Sign | PDFKit + PencilKit | Yes |
| Image to PDF | PDFKit + PhotosUI | Yes |
| Share Extension | App Group handoff | Yes |

## Project Structure

```
ios/PaperlessTools/
├── App/                 # Entry point, tab navigation, shared import routing
├── Design/              # Brand colors, shared components
├── Features/            # One folder per tool
├── Models/              # Tool registry, QR types
├── Services/            # PDF, API, storage
├── Shared/              # App Group constants + import handoff
├── ShareExtension/      # Receive PDFs/images/URLs from other apps
└── Resources/           # Assets, app icon
```

## TestFlight

1. Archive: **Product → Archive**
2. **Distribute App → App Store Connect**
3. Upload to TestFlight for internal testing
4. Verify share extension is embedded (appex inside the app bundle)

## App Store Checklist

### App Store Connect setup

- [ ] Register bundle IDs in [Apple Developer → Identifiers](https://developer.apple.com/account/resources/identifiers/list):
  - `tools.paperless.app` (main app)
  - `tools.paperless.app.share` (share extension)
- [ ] Enable App Groups on both identifiers: `group.tools.paperless.app`
- [ ] Create app record in App Store Connect for `tools.paperless.app`

### Metadata (required before submission)

- [ ] **Screenshots** — 6.7" iPhone, 6.5" iPhone, and iPad (app supports iPad)
- [ ] **App description** — emphasize privacy-first, on-device processing
- [ ] **Privacy policy URL:** https://paperless.tools
- [ ] **Support URL:** https://paperless.tools
- [ ] **Export compliance:** `ITSAppUsesNonExemptEncryption = false` (already in Info.plist)

### Privacy nutrition label

Declare accurately in App Store Connect → App Privacy:

| Data type | Collected? | Linked to user? | Purpose |
|-----------|------------|-----------------|---------|
| All on-device tools | No | — | — |
| URL Shortener (URLs submitted to shorten) | Yes | No | App functionality |

**Do not** select "Data Not Collected" — the URL shortener sends the URL to `https://paperless.tools/api/shorten`.

On-device tools (PDF, scan, QR, etc.) process files locally and do not upload document content.

### Already configured in project

- [x] `PrivacyInfo.xcprivacy` (UserDefaults required-reason API)
- [x] Camera/Photos usage strings (Info.plist)
- [x] Share extension embedded in main app target
- [x] URL scheme `paperlesstools://import` for share handoff

## API Endpoints Used

- `POST https://paperless.tools/api/shorten` — URL shortener only

All other tools process files locally with no server upload.

## Pre-submission smoke test

- [ ] Share a PDF from Files → paperless.tools → opens import picker
- [ ] Share images from Photos → Image to PDF pre-filled
- [ ] iPad: export/share from any PDF tool without crash
- [ ] Deny camera → QR Scanner shows Settings prompt (not black screen)
- [ ] Grant camera in Settings → return to app → scanner works
- [ ] Compress a 30+ page PDF → UI stays responsive
