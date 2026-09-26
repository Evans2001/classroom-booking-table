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
