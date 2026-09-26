# Firebase Push Notification Setup

## Android app

1. Go to the Firebase console and create a project.
2. Add an Android app with this package name:

```text
com.example.room_booking_lecturer
```

3. Download `google-services.json`.
4. Put it here:

```text
room-booking-lecturer-flutter/android/app/google-services.json
```

## Admin backend

1. In Firebase console, open Project settings > Service accounts.
2. Generate a new private key.
3. Add these values to `room-booking-admin/.env.local`:

```env
FIREBASE_PROJECT_ID=your_firebase_project_id
FIREBASE_CLIENT_EMAIL=your_service_account_email
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_PRIVATE_KEY\n-----END PRIVATE KEY-----\n"
```

Restart the admin server after editing `.env.local`.

## Test flow

1. Run the admin app.
2. Run the Flutter APK/app and log in as a lecturer.
3. The app sends its Firebase token to `/api/lecturer/push-token`.
4. In admin, approve/reject a booking or update an issue status.
5. The lecturer device should receive an Android notification.

## One-hour lecture reminders

The admin server automatically checks approved room bookings every 30 seconds and
sends the booking's lecturer a reminder when the lecture is one hour away. It uses
the booking's requester email for email delivery and that lecturer's registered
Firebase device tokens for mobile push. Messages include the module, room, date,
and campus-local start time. Pending, rejected, cancelled, and started bookings
are excluded. Updated start times receive a new reminder at the new time.

Keep the admin Node.js server running (`npm run dev`, or `npm run build` followed
by `npm start`) with persistent SQLite storage. This background timer requires an
always-running server; it is not a serverless cron job. After downtime, unsent
reminders are retried for lectures that have not yet started, so they may arrive
less than an hour before the lecture. Delivery timing also depends on the provider
and device connectivity.

Configure Firebase as above and enable notifications on the lecturer's device.
Email delivery also requires the existing SMTP configuration. Failed or
unconfigured deliveries retry once per minute until the lecture starts. Each
successful email/device delivery is recorded separately in SQLite to avoid
resending it on subsequent checks or normal restarts. As with external message
providers, a crash after delivery but before saving the receipt can cause a retry.
