# App Store Connect — Privacy Questionnaire Checklist

Complete these steps in [App Store Connect](https://appstoreconnect.apple.com) for **Paperless Tools** (`tools.paperless.app`).

Privacy policy URL (must be live before submit): **https://paperless.tools/privacy**

---

## 1. App Privacy (Nutrition Labels)

Open your app → **App Privacy** → **Get Started** or **Edit**.

### Data collection

Answer **Yes**, the app collects data from this app.

Add the following data types:

| Data type | Collected | Linked to user | Tracking | Purpose |
|-----------|-----------|----------------|----------|---------|
| **Other User Content** (URLs submitted to shortener) | Yes | No | No | App Functionality |
| **Product Interaction** (short-link click counts) | Yes | No | No | App Functionality |

### Data not collected

Do **not** declare collection for:

- Document/PDF content (processed on device)
- Photos or camera captures used for scan/OCR (on device)
- Contacts, location, browsing history, identifiers for advertising

### Tracking

- **Does this app track users?** → **No**
- Matches `NSPrivacyTracking = false` in [`PrivacyInfo.xcprivacy`](../PaperlessTools/PrivacyInfo.xcprivacy)

---

## 2. App Information

| Field | Value |
|-------|-------|
| Privacy Policy URL | `https://paperless.tools/privacy` |
| Bundle ID | `tools.paperless.app` |
| Version | 1.0.0 |
| Build | 2 (or current `CURRENT_PROJECT_VERSION`) |

---

## 3. Encryption (Export Compliance)

When uploading the build, answer:

- **Uses encryption?** Yes (HTTPS only)
- **Exempt?** Yes — standard encryption only
- Matches `ITSAppUsesNonExemptEncryption = false` in Info.plist

---

## 4. Age Rating

Complete the questionnaire honestly. The app has no restricted content; typical utility rating applies.

---

## 5. Before Submit for Review

- [ ] Privacy policy URL loads in Safari on device
- [ ] In-app More tab → Privacy Policy opens the same URL
- [ ] URL shortener works on production API
- [ ] Manual QA checklist completed ([MANUAL_QA_CHECKLIST.md](./MANUAL_QA_CHECKLIST.md))
- [ ] Release archive validated in Xcode Organizer

---

## Sign-off

| Step | Done | Date | Notes |
|------|------|------|-------|
| App Privacy labels saved | ☐ | | |
| Privacy Policy URL set | ☐ | | |
| Export compliance answered | ☐ | | |
| Build uploaded | ☐ | | |
| Submitted for review | ☐ | | |
