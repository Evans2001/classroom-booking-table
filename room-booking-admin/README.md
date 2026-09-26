This is the admin dashboard for the classroom booking system.

## Getting Started

First, install dependencies and run the development server:

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Lecturer credential emails

When an admin approves a lecturer account request, the system creates a username and temporary password. In local development, an undelivered message is stored in `email_outbox` for testing. Production requires successful SMTP delivery before creating the account and stores only a redacted delivery record, never the temporary password.

Create `room-booking-admin/.env.local` with these values:

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your.admin.gmail@gmail.com
SMTP_PASS=your-gmail-app-password
SMTP_FROM=Classroom Booking Admin <your.admin.gmail@gmail.com>
```

For Gmail, use an app password, not your normal Gmail password. Enable 2-step verification on the Gmail account, then create an app password and use it as `SMTP_PASS`.

Restart the dev server after changing `.env.local`.

## Admin authentication

Local development uses the demo admin credentials shown on the login page. Production deliberately disables those defaults. Configure all three values before deploying:

```env
ADMIN_EMAIL=admin@example.edu
ADMIN_PASSWORD=replace-with-a-long-unique-password
ADMIN_SESSION_SECRET=replace-with-at-least-32-random-characters
```

Admin sessions are signed by the server and stored in an `HttpOnly`, `SameSite=Strict` cookie. Keep `ADMIN_SESSION_SECRET` private and stable; changing it signs out all admins. You can generate a suitable secret with `openssl rand -hex 32`.

The campus timezone defaults to `Asia/Colombo`. Set both values to the same IANA timezone when deploying elsewhere; the public value keeps browser-rendered times aligned with server validation:

```env
CAMPUS_TIME_ZONE=Asia/Colombo
NEXT_PUBLIC_CAMPUS_TIME_ZONE=Asia/Colombo
```

## Production data

The app uses SQLite. Run one application instance with a persistent disk and back up the database regularly. Serverless or horizontally scaled deployments need a shared database migration before production use.

By default the database is `data/room-booking.sqlite`. A persistent absolute path can be configured with:

```env
ROOM_BOOKING_DB_PATH=/var/lib/room-booking/room-booking.sqlite
```

Do not commit `.env.local`, database files, SMTP secrets, signing keys, or production credentials.
