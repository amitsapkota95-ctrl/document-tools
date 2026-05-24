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
4. Repeat for **PaperlessToolsShareExtension** (`tools.paperless.app.share`)
5. Build and run on simulator or device (⌘R)

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

## Project Structure

```
ios/PaperlessTools/
├── App/                 # Entry point, tab navigation
├── Design/              # Brand colors, shared components
├── Features/            # One folder per tool
├── Models/              # Tool registry, QR types
├── Services/            # PDF, API, storage
├── ShareExtension/      # Receive PDFs/images from other apps
└── Resources/           # Assets, app icon
```

## TestFlight

1. Archive: **Product → Archive**
2. **Distribute App → App Store Connect**
3. Upload to TestFlight for internal testing
4. Privacy nutrition label: **Data Not Collected** (on-device tools); URL shortener sends only the URL to shorten

## App Store Checklist

- [ ] Screenshots (6.7", 6.5", iPad if supporting)
- [ ] App description emphasizing privacy-first, on-device processing
- [ ] Privacy policy URL: https://paperless.tools
- [ ] Export compliance: `ITSAppUsesNonExemptEncryption = false` (already in Info.plist)
- [ ] Camera/Photos usage strings (already in Info.plist)

## API Endpoints Used

- `POST https://paperless.tools/api/shorten` — URL shortener only

All other tools process files locally with no server upload.
