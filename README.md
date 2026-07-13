# classroom-booking-table
contributors
1) Evans
2) Sanjula
3) Malith
4) sachintha

## Shared database setup

The project now uses a shared SQLite database hosted by the `room-booking-admin` Next.js app.

1. Start the admin app first so its API and SQLite database are available.
2. Start the lecturer web app with `NEXT_PUBLIC_ROOM_BOOKING_API_BASE_URL=http://localhost:3000`.
3. The Flutter lecturer app also points to the admin API:
   - Android emulator uses `http://10.0.2.2:3000`
   - Desktop uses `http://localhost:3000`

Database file:

- `room-booking-admin/data/room-booking.sqlite`
