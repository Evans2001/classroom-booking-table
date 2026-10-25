# Lecturer mobile app

This Flutter app connects to the shared booking API hosted by the admin Next.js app.

## Local development

1. Start the admin app backend on your computer.
2. For a real phone, connect the phone and computer to the same Wi-Fi network.
3. Find the computer's LAN address, for example `192.168.1.5`.
4. Pass that address when running the app:

```bash
flutter run --dart-define=API_BASE_URL=http://192.168.1.5:3000
```

Development defaults are `http://10.0.2.2:3000` for an Android emulator and `http://localhost:3000` for desktop. The host firewall must permit the backend port.

## Production release

- Configure the deployed HTTPS API, for example `--dart-define=API_BASE_URL=https://booking.example.edu`. Release builds reject HTTP and do not have a localhost fallback.
- Campus booking times default to Sri Lanka time (UTC+05:30). If needed, set `--dart-define=CAMPUS_UTC_OFFSET_MINUTES=330` to the campus offset.
- Add `android/key.properties` with `storeFile`, `storePassword`, `keyAlias`, and `keyPassword`. The file and keystore are ignored by Git; release builds never use the debug signing key.
- Cleartext HTTP is enabled only for debug and profile builds.
- Before publishing, replace the placeholder Android application ID and download a matching `google-services.json` from Firebase.

Example release build:

```bash
flutter build appbundle --release --dart-define=API_BASE_URL=https://booking.example.edu
```

## Stay signed in

The login screen enables **Stay signed in** by default. A successful login saves
the session token and basic profile in encrypted device storage, never the
password. Reopening the app validates that session with the server before opening
the home screen. Sessions last up to 30 days; expiry or revocation requires login
again. Connection failures offer Retry without deleting the saved sign-in.

Uncheck the option to keep the next login in memory only. Signing out removes
the saved session. Android backups are disabled to avoid restoring encrypted
session data without its device encryption key.

## Lecturer IDs

The server assigns a unique three-digit lecturer ID (`001` through `999`) when an account request is submitted. It appears in the signup confirmation, lecturer profile, and admin user/request lists. Approval retains the same ID. Existing accounts and requests are migrated automatically, including timetable references to their previous IDs. Internal account keys and sessions remain intact.

Issued IDs are never reused, including after rejection or deletion. Once `999` is issued, new registrations return a capacity error. Use the assigned lecturer ID in timetable imports to distinguish lecturers with the same name.

## Optimized local phone build

For the connected ARM64 Samsung phone, use an AOT profile build while the backend is local:

```powershell
flutter build apk --profile --target-platform android-arm64 --split-per-abi --dart-define=API_BASE_URL=http://127.0.0.1:3000
adb reverse tcp:3000 tcp:3000
adb install -r build/app/outputs/flutter-apk/app-arm64-v8a-profile.apk
```

Profile mode supports local HTTP and performance testing; it is not a production-signed release. The tested profile APK is 27,257,587 bytes versus the previous universal debug APK at 164,695,684 bytes (83.4% smaller). This compares build modes and CPU architectures, not equivalent release artifacts. USB forwarding must be restored after reconnecting the phone.

The app reuses HTTP connections, aborts timed-out requests, and refreshes after returning to the foreground or receiving a push update. Room rows are built lazily as they become visible.

## Staying signed in

After a successful login, the app saves the session token and profile in platform secure storage, scoped to the configured API server. It restores the login when reopened, including after a phone restart or while offline. Passwords are never saved. Mobile logins request a persistent server session with no inactivity or calendar expiry; web sessions retain their existing 30-day expiry.

Only confirming **Sign out** clears the saved login. Connection failures and API errors preserve it. Signing out clears local storage before returning to the login screen and attempts server revocation when reachable. If the server is offline, its session cannot be revoked at that time. Server access checks still reject deleted accounts and revoked sessions (including other sessions revoked by a password change).

Deploy the updated admin API alongside the updated mobile app. Existing installs need one login in the updated app because previous versions did not save sessions. Clearing app data or uninstalling removes the saved login. Android backup is disabled to keep encrypted credentials tied to the device.
