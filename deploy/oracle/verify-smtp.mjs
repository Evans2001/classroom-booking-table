import nodemailer from '/opt/room-booking/room-booking-admin/node_modules/nodemailer/lib/nodemailer.js';

const transport = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT || 587),
  secure: process.env.SMTP_SECURE === 'true',
  auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  connectionTimeout: 15000,
  greetingTimeout: 15000,
  socketTimeout: 15000,
});
try {
  await transport.verify();
  console.log('SMTP authentication verified. No email sent.');
} catch {
  console.error('SMTP verification failed. Check sender credentials and connectivity.');
  process.exitCode = 1;
} finally {
  transport.close();
}
