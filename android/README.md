# paperless.tools — Android App

Native Jetpack Compose Android app for [paperless.tools](https://paperless.tools). All document processing runs on-device; only the URL shortener calls the existing Cloudflare API.

## Requirements

- **Android Studio Ladybug (2024.2+)** or newer
- **JDK 17**
- Android **8.0+** (API 26) minimum; targets API 35
- Android SDK with build-tools 35

## Open the Project

```bash
open -a "Android Studio" android/PaperlessTools
```

Or from Android Studio: **File → Open** → select `android/PaperlessTools`.

## First-Time Setup

1. Let Gradle sync complete (downloads dependencies on first open)
2. Select a device or emulator (Pixel 6+ recommended)
3. Run the **app** configuration (▶)

## Features

Mirrors the iOS `PaperlessTools` app with 15 tools across 4 tabs:

| Tab | Contents |
|-----|----------|
| **Home** | Hero, featured tools, full grid |
| **Tools** | Categorized tool list (PDF / Utilities / Content) |
| **Scan** | Document scanner + QR scanner entry points |
| **Settings** | Signature vault, version, privacy badge |

### Tool parity with iOS

| Tool | Android implementation | Offline |
|------|------------------------|---------|
| Document Scanner | Photo picker → PDF (CameraX scan UI next) | Yes |
| Merge / Split / Compress PDF | PDFBox Android | Yes |
| Fill & Sign | Canvas signature pad + vault | Yes |
| Image to PDF / PDF to Image | PdfDocument + PDFBox | Yes |
| Extract Text | PDFBox text stripper | Yes |
| Redact / Crop PDF | Scaffolded (interactive UI next) | Yes |
| QR Generator (9 types) | ZXing + shared payload encoding | Yes |
| QR Scanner | CameraX + ML Kit Barcode | Yes |
| URL Shortener | Retrofit → `/api/shorten` | No |
| Compare Text | Port of iOS LCS diff | Yes |
| Invoice Builder | Scaffolded | Yes |
| Teleprompter | Scaffolded | Yes |

## Project Structure

```
android/PaperlessTools/
├── app/src/main/kotlin/tools/paperless/app/
│   ├── MainActivity.kt          # Entry point
│   ├── models/                  # Tool registry, QR types
│   ├── services/                # PDF, API, OCR, storage
│   └── ui/
│       ├── theme/               # Forest/cream design system
│       ├── components/          # Shared Compose components
│       ├── navigation/          # Tab + tool routing
│       ├── screens/             # Home, Tools, Scan, Settings
│       └── features/            # One screen per tool
└── build.gradle.kts
```

## Build from CLI

```bash
cd android/PaperlessTools
./gradlew assembleDebug
```

APK output: `app/build/outputs/apk/debug/app-debug.apk`

## API Endpoints Used

- `POST https://paperless.tools/api/shorten` — URL shortener only

All other tools process files locally with no server upload.

## Share Target

The main activity accepts `ACTION_SEND` for PDFs and images from other apps (Android equivalent of the iOS share extension).

## Branch

Developed on the `Android-native` branch, parallel to `platform/ios-native`.
