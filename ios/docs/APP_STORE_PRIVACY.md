# App Store Connect Privacy Configuration

Use this guide when submitting **Paperless Tools** (`tools.paperless.app`).

## Privacy Policy URL

Set in App Store Connect:

- **Privacy Policy:** `https://paperless.tools/privacy`

The in-app More tab links to the same URL.

## Data Collection (App Privacy questionnaire)

| Data type | Collected | Linked to user | Used for tracking | Purpose |
|-----------|-----------|----------------|-------------------|---------|
| Other User Content (submitted URLs) | Yes | No | No | App functionality |
| Product Interaction (click stats on shortened links) | Yes | No | No | App functionality |

All other document processing (PDF scan, redact, crop, sign, OCR) happens **on device**. No document content is uploaded.

## URL Shortener

- Endpoint: `POST https://paperless.tools/api/shorten`
- Stored data: original URL, short code, basic click counts
- Retention: **72 hours** (disclosed in-app via `URLShortenerStorageNotice`)
- Production API verified before release

## Privacy Nutrition Label alignment

`PrivacyInfo.xcprivacy` declares:

- `NSPrivacyTracking`: false
- UserDefaults API (CA92.1) for saved signatures and teleprompter settings
- Collected data types matching URL shortener functionality

## Encryption

`ITSAppUsesNonExemptEncryption` is `false` in Info.plist (standard HTTPS only).
