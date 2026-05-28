# Manual QA Checklist — Paperless Tools iOS v1.0

Run on a **physical device** with a **Release** build (Scheme → Edit Scheme → Run → Release, or TestFlight build).

Tester: _______________  
Device / iOS: _______________  
Build: _______________  
Date: _______________

---

## Build and install

- [ ] Archive succeeded in Xcode (Product → Archive)
- [ ] Validate App passed in Organizer (no errors)
- [ ] App installs and opens without crash

---

## Launch

- [ ] Branded launch screen (icon + “paperless.tools”) appears briefly
- [ ] Home tab loads; no prolonged white screen on **second** launch
- [ ] Dark Mode: UI looks cohesive (toggle in Settings app)

---

## Document Scanner

- [ ] Auto-scan: capture pages → Save as PDF → share sheet works
- [ ] Deny camera permission → message + Open Settings link appears
- [ ] Manual camera mode: Cancel / Done / shutter work

---

## QR

- [ ] QR scanner opens; valid QR decodes
- [ ] Deny camera → error message (not black screen)

---

## PDF tools (spot-check)

- [ ] Merge PDF: add 2 PDFs → combine → export
- [ ] Split PDF: select pages → export
- [ ] Redact PDF: draw box → apply-to-all disclaimer visible → export → open in Preview
- [ ] Fill & Sign: place signature → export

---

## URL shortener

- [ ] Online: shorten a URL → result copies/shares
- [ ] Offline (airplane mode): clear error message
- [ ] Storage notice (72h) visible before shortening

---

## Share extension

- [ ] Share PDF from Files app → extension appears → routes to correct tool
- [ ] Failed import shows alert (if testable)

---

## More tab

- [ ] Privacy Policy link opens https://paperless.tools/privacy
- [ ] Website link works
- [ ] Version shows 1.0.0

---

## Accessibility (spot-check)

- [ ] VoiceOver on Home: tool tiles readable
- [ ] VoiceOver on one PDF tool: primary buttons labeled

---

## Automated checks (CI / local)

These were run before tagging a release candidate:

| Check | Command | Pass |
|-------|---------|------|
| iOS Release build | `xcodebuild -scheme PaperlessTools -configuration Release build` | ☑ 2026-05-28 |
| Unit tests | `xcodebuild test -scheme PaperlessTools` | ☑ 2026-05-28 |
| Archive validate | `xcodebuild archive` + `-validateArchive` | ☑ 2026-05-28 |

---

## Result

- [ ] **Pass** — ready to submit
- [ ] **Fail** — blockers listed below

**Blockers:**

1. 
2. 
