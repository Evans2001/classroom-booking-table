This is the admin dashboard for the classroom booking system.

## Getting Started

First, install dependencies and run the development server:

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Lecturer credential emails

When an admin approves a lecturer account request, the system creates a username and temporary password. If SMTP is configured, those credentials are emailed to the lecturer. If SMTP is not configured, the account is still created and the message is stored in the local `email_outbox` table.

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

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
