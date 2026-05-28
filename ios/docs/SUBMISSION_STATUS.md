# App Store Submission Status

Last updated: 2026-05-28

## Automated verification (local)

| Check | Result |
|-------|--------|
| iOS Release build | Passed |
| Unit tests (`PaperlessToolsTests`) | Passed |
| Release archive | Passed (`/tmp/PaperlessTools-Release.xcarchive`) |
| Archive validation | Passed |
| Next.js `/privacy` static page | Passed |

## Remaining manual steps

1. **Deploy web app** so `https://paperless.tools/privacy` is live (page added in `src/app/privacy/page.tsx`).
2. **Complete App Store Connect** using [APP_STORE_CONNECT_CHECKLIST.md](./APP_STORE_CONNECT_CHECKLIST.md).
3. **Device QA** using [MANUAL_QA_CHECKLIST.md](./MANUAL_QA_CHECKLIST.md).
4. **Upload build** from Xcode Organizer (see below).

## Upload to App Store Connect

1. Open Xcode → Window → Organizer
2. Select archive **PaperlessTools** (Release)
3. Click **Distribute App** → **App Store Connect** → **Upload**
4. Follow prompts (automatic signing, include bitcode/symbols as offered)
5. Wait for processing in App Store Connect → TestFlight / App Store tab
6. Attach build to version 1.0.0 and submit for review

Alternatively, export for manual upload:

```bash
# From ios/PaperlessTools — adjust ExportOptions.plist team/bundle as needed
xcodebuild -exportArchive \
  -archivePath /tmp/PaperlessTools-Release.xcarchive \
  -exportPath /tmp/PaperlessTools-export \
  -exportOptionsPlist ExportOptions.plist
```

Then upload the exported `.ipa` via Transporter or `xcrun altool --upload-app`.
