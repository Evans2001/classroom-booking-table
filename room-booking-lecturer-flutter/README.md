# room_booking_lecturer

This Flutter app now connects to the shared booking backend used by the admin web app.

## Real phone setup

1. Start the admin app backend on your computer.
2. Make sure your phone and computer are on the same Wi‑Fi network.
3. Find your computer's LAN IP address, for example `192.168.1.5`.
4. Run or build the Flutter app with a backend URL that points to that IP.

Example run command:

```bash
flutter run --dart-define=API_BASE_URL=http://192.168.1.5:3000
```

Example APK build command:

```bash
flutter build apk --dart-define=API_BASE_URL=http://192.168.1.5:3000
```

## Default behavior

- Android emulator default: `http://10.0.2.2:3000`
- Desktop default: `http://localhost:3000`
- Real phone: use `--dart-define=API_BASE_URL=http://YOUR_COMPUTER_IP:3000`

## Important

- The admin Next.js app must be running, because it hosts the shared API and SQLite database.
- Your firewall must allow incoming connections to port `3000` on your computer.
