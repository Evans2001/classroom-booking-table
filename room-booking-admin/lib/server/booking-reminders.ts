import { randomUUID } from "node:crypto";
import { getDatabase } from "@/lib/server/database";
import { sendEmailNotification } from "@/lib/server/mailer";
import { sendPushNotification } from "@/lib/server/push";
import { CAMPUS_TIME_ZONE, formatCampusDate, formatCampusTime } from "@/lib/utils/campus-date-time";

const HOUR_MS = 60 * 60 * 1000;
const RETRY_MS = 60 * 1000;
const LEASE_MS = 5 * 60 * 1000;

interface DueBooking {
  id: string;
  requester_email: string;
  requester_name: string;
  module_name: string | null;
  start_at: string;
  room_name: string;
  room_code: string;
}

/** Persistent per-destination receipts survive restarts and coordinate server instances. */
export async function sendDueBookingReminders(now = new Date()): Promise<void> {
  const elapsedFrom = Date.now();
  const currentTime = () => now.getTime() + Date.now() - elapsedFrom;
  const db = getDatabase();
  db.exec(`CREATE TABLE IF NOT EXISTS booking_reminder_deliveries (
    booking_id TEXT NOT NULL REFERENCES booking_requests(id) ON DELETE CASCADE,
    start_at TEXT NOT NULL,
    channel TEXT NOT NULL,
    destination TEXT NOT NULL,
    retry_at INTEGER NOT NULL DEFAULT 0,
    claim_id TEXT,
    sent_at TEXT,
    PRIMARY KEY (booking_id, start_at, channel, destination)
  )`);
  const bookings = db.prepare(`
    SELECT b.id, b.requester_email, b.requester_name, b.module_name, b.start_at,
           r.name AS room_name, r.room_number AS room_code
    FROM booking_requests b JOIN rooms r ON r.id = b.room_id
    WHERE b.status = 'APPROVED'
      AND julianday(b.start_at) > julianday(?)
      AND julianday(b.start_at) <= julianday(?)
    ORDER BY b.start_at
  `).all(now.toISOString(), new Date(now.getTime() + HOUR_MS).toISOString()) as unknown as DueBooking[];

  for (const booking of bookings) {
    const recipient = booking.requester_email.trim().toLowerCase();
    if (!recipient) continue;
    const tokens = db.prepare("SELECT token FROM lecturer_push_tokens WHERE lower(lecturer_email) = ?")
      .all(recipient) as { token: string }[];
    const destinations = [
      { channel: "email", destination: recipient },
      ...tokens.map(({ token }) => ({ channel: "push", destination: token })),
    ];
    const start = new Date(booking.start_at);
    const subject = "Upcoming lecture reminder";
    const details = `${booking.module_name || "Your lecture"} starts at ${formatCampusTime(start)} on ${formatCampusDate(start)} (${CAMPUS_TIME_ZONE}) in ${booking.room_name} (${booking.room_code}).`;
    for (const { channel, destination } of destinations) {
      // Recheck after each asynchronous delivery in case the booking was edited or cancelled.
      const active = db.prepare("SELECT id FROM booking_requests WHERE id = ? AND start_at = ? AND status = 'APPROVED' AND requester_email = ?")
        .get(booking.id, booking.start_at, booking.requester_email);
      if (!active || start.getTime() <= currentTime()) break;
      const key = [booking.id, booking.start_at, channel, destination];
      db.prepare(`INSERT OR IGNORE INTO booking_reminder_deliveries
        (booking_id, start_at, channel, destination) VALUES (?, ?, ?, ?)`).run(...key);
      const claim = randomUUID();
      const claimed = db.prepare(`UPDATE booking_reminder_deliveries SET claim_id = ?, retry_at = ?
        WHERE booking_id = ? AND start_at = ? AND channel = ? AND destination = ?
          AND sent_at IS NULL AND retry_at <= ?`)
        .run(claim, now.getTime() + LEASE_MS, ...key, now.getTime());
      if (!claimed.changes) continue;
      let sent = false;
      try {
        sent = channel === "push"
          ? await sendPushNotification({ token: destination, title: subject, body: details })
          : (await sendEmailNotification({ recipient: destination, subject,
              text: `Hello ${booking.requester_name},\n\n${details}` })).sent;
      } catch (error) {
        console.error("Unable to deliver booking reminder", booking.id, channel, error);
      }
      db.prepare(`UPDATE booking_reminder_deliveries SET sent_at = ?, retry_at = ?, claim_id = NULL
        WHERE booking_id = ? AND start_at = ? AND channel = ? AND destination = ? AND claim_id = ?`)
        .run(sent ? now.toISOString() : null, now.getTime() + RETRY_MS, ...key, claim);
    }
  }
}

declare global {
  var __bookingReminderTimer__: ReturnType<typeof setInterval> | undefined;
}

export function startBookingReminderScheduler(): void {
  if (globalThis.__bookingReminderTimer__) return;
  let running = false;
  const tick = async () => {
    if (running) return;
    running = true;
    try {
      await sendDueBookingReminders();
    } catch (error) {
      console.error("Booking reminder scheduler failed", error);
    } finally {
      running = false;
    }
  };
  globalThis.__bookingReminderTimer__ = setInterval(() => { void tick(); }, 30_000);
  globalThis.__bookingReminderTimer__.unref();
  void tick();
}
