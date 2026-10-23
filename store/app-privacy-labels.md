# HomeFit — App Privacy (App Store Connect)

App Store Connect → your app → **App Privacy** → Get Started.

## Answers

**Do you or your third-party partners collect data from this app?**
→ **No, we do not collect data from this app.**

That's the only answer needed. The resulting label on the App Store: **"Data Not Collected"**.

**Privacy Policy URL:** `https://deckkk491-creator.github.io/homefit/privacy-policy.html`

## Why "No" is correct

Apple defines "collect" as transmitting data off the device in a way that you or your third-party partners can access for longer than needed to service the request in real time. HomeFit:

- stores height, weight, push-up/pull-up counts, equipment, plan and workout log **only in local storage on the device**;
- calculates the plan **on-device** — no server, no external AI;
- has **no account, no analytics, no crash-reporting SDK, no ads**;
- (if exercise photos are loaded from the internet) only requests public images and sends no user data.

Data processed only on the device is not "collected" and does not need to be disclosed.

## Before you submit — check the build

Answer "No" only if all of these are true for the actual build:

- [ ] No analytics / crash-reporting SDKs (Firebase, Sentry, Amplitude, AppMetrica, Expo Insights, etc.). If any is added, the answers change (usually Diagnostics → Crash Data / Performance Data, plus Usage Data).
- [ ] No remote logging of user input.
- [ ] Exercise images are bundled in the app or fetched as plain image requests with no user data in the URL.
- [ ] No iCloud/CloudKit sync controlled by the developer. (Standard iPhone backups by Apple don't count.)

## Tracking

**Does this app track users?** → **No.** No IDFA, no App Tracking Transparency prompt needed.

## Privacy manifest (PrivacyInfo.xcprivacy)

Not part of the questionnaire, but checked on upload. If the app uses `UserDefaults`/AsyncStorage (it almost certainly does), the manifest must declare the Required Reason API:

- `NSPrivacyAccessedAPICategoryUserDefaults` → reason `CA92.1` (access info from the same app).
- `NSPrivacyTracking` → `false`, `NSPrivacyCollectedDataTypes` → empty.

Expo/React Native: set these under `ios.privacyManifests` in `app.json`.
