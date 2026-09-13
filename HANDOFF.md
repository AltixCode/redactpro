# AGENT WORK TRACKING & HANDOFF STATE

## Current Status: CORE_VERIFIED_IOS — store assets and Android pass outstanding

## Last Updated: 2026-09-13T15:12:00+03:00

## What was wrong

The app shipped with its entire value proposition faked:

* `vision/ocrScanner.ts` returned four hard-coded PII boxes at fixed relative
  positions, identical for every input image.
* `engine/rasterizer.ts` accepted `regions` and **discarded them**, running an
  empty manipulation pass and returning a re-encoded copy of the original. Every
  "redacted" export contained the concealed content in full, while the UI showed
  a GDPR-safe badge over it.
* The app also could not launch at all on iOS 26/27 (see AGENTS.md §13.6.2).

## What is now true

* Detection runs the platform's local text recogniser. iOS uses Vision; Android
  uses ML Kit's bundled Latin model. `@react-native-ml-kit/text-recognition` was
  rejected: its ML Kit pods ship no arm64 iOS-simulator slice and force
  `EXCLUDED_ARCHS[sdk=iphonesimulator*] = arm64`, making the app unbuildable for
  any simulator on Apple Silicon, and it pulled five script packs for an app that
  needs Latin only. Implemented as the local Expo module `modules/text-scanner`.
* Redaction boxes are burned into the raster before the JPEG flatten.
* The censor screen draws boxes over the image so the user can verify coverage
  before sharing.

## Verification performed (iOS Simulator, iPhone 18 Pro, iOS 27, Release build)

Fixture: `scripts/make-fixture.swift` generates a statement carrying a
Luhn-valid test card (4242…), the canonical GB82 IBAN, an email, and a
reserved-range phone number.

| Gate | Result |
| --- | --- |
| `npx tsc --noEmit` | PASS |
| Release build + install | PASS |
| Launch to first frame | PASS (scene lifecycle plugin) |
| `.maestro/redact-flow.yaml` end to end | PASS |
| All four entity types detected and classified | PASS |
| Non-PII lines preserved | PASS |
| Export dimensions equal source (2000×2800) | PASS |
| No GPS/camera EXIF in export | PASS |
| **Independent OCR of exported file recovers no secret** | **PASS** |

The last row is the one that matters and is reproducible:
`swift scripts/verify-redaction.swift <exported.jpg>` → `RESULT: PASS`.

## Defects found and fixed during verification

1. `TextScannerModule.swift` resolved every repeated word to the **first**
   occurrence's box, so in `4242 4242 4242 4242` only the leading group was
   covered and the rest of the card number stayed readable.
2. `captureRef` width/height are in points and are multiplied by screen density,
   so exports came out 3× oversized (2000×2800 → 6000×8400). Same bug was
   present in PackPixel's composer and fixed there too.
3. Module-level `/g` regexes in `entityDetector.ts` carried `lastIndex` between
   calls and silently skipped every other match.
4. EXIF orientation was not normalised on import, so the picker, the recogniser
   and the exporter disagreed on the pixel grid.

## Outstanding

* Android emulator pass: NOT RUN.
* Store listing, screenshots, icon, keywords: NOT DONE.
* IAP `redactpro_pro_lifetime` exists in App Store Connect, priced $8.99,
  state `MISSING_METADATA` pending the App Review paywall screenshot.
* Purchase/restore against a StoreKit configuration: NOT RUN.
* Play Console listing: service account now has access; listing not yet written.
