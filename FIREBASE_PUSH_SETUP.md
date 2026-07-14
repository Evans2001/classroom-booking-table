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
