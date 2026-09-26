// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getDatabase } from "@/lib/server/database";
import { sendDueBookingReminders, startBookingReminderScheduler } from "@/lib/server/booking-reminders";
import { sendEmailNotification } from "@/lib/server/mailer";
import { sendPushNotification } from "@/lib/server/push";

vi.mock("@/lib/server/mailer", () => ({ sendEmailNotification: vi.fn() }));
vi.mock("@/lib/server/push", () => ({ sendPushNotification: vi.fn() }));
const now = new Date("2026-09-26T08:00:00.000Z");
const start = "2026-09-26T09:00:00.000Z";
function booking(id = "reminder-test", status = "APPROVED", startAt = start, email = "owner@example.com") {
  const db = getDatabase();
  const room = db.prepare("SELECT id FROM rooms LIMIT 1").get() as { id: string };
  db.prepare(`INSERT INTO booking_requests
    (id, requester_name, requester_email, department, room_id, module_name, purpose,
     start_at, end_at, attendees, status, submitted_at)
    VALUES (?, 'Lecturer One', ?, 'Engineering', ?, 'CS101', 'Lecture', ?, ?, 10, ?, ?)`)
    .run(id, email, room.id, startAt, new Date(Date.parse(startAt) + 3600000).toISOString(), status, now.toISOString());
}
beforeEach(() => {
  vi.mocked(sendEmailNotification).mockReset().mockResolvedValue({ sent: true });
  vi.mocked(sendPushNotification).mockReset().mockResolvedValue(true);
  getDatabase().exec("DELETE FROM booking_requests; DELETE FROM lecturer_push_tokens");
  getDatabase().prepare("INSERT INTO lecturer_push_tokens VALUES (?, ?, ?, 'android', ?, ?)")
    .run("owner-device", "owner@example.com", "owner-token", now.toISOString(), now.toISOString());
  getDatabase().prepare("INSERT INTO lecturer_push_tokens VALUES (?, ?, ?, 'android', ?, ?)")
    .run("other-device", "other@example.com", "other-token", now.toISOString(), now.toISOString());
});
afterEach(() => {
  if (globalThis.__bookingReminderTimer__) clearInterval(globalThis.__bookingReminderTimer__);
  globalThis.__bookingReminderTimer__ = undefined;
  vi.useRealTimers();
  globalThis.__roomBookingDatabase__?.close();
  globalThis.__roomBookingDatabase__ = undefined;
});
describe("lecture reminders", () => {
  it("sends at the one-hour boundary only to the booking owner, with campus time and room", async () => {
    booking();
    await sendDueBookingReminders(new Date(now.getTime() - 1));
    expect(sendEmailNotification).not.toHaveBeenCalled();
    await sendDueBookingReminders(now);
    expect(sendEmailNotification).toHaveBeenCalledWith(expect.objectContaining({
      recipient: "owner@example.com", text: expect.stringContaining("CS101 starts at 14:30"),
    }));
    expect(sendPushNotification).toHaveBeenCalledExactlyOnceWith(expect.objectContaining({
      token: "owner-token", body: expect.stringContaining("Asia/Colombo"),
    }));
    await sendDueBookingReminders(new Date(now.getTime() + 30000));
    expect(sendEmailNotification).toHaveBeenCalledTimes(1);
    expect(sendPushNotification).toHaveBeenCalledTimes(1);
  });
  it("excludes unapproved, cancelled, started and distant bookings", async () => {
    for (const status of ["PENDING", "REJECTED", "CANCELLED"]) booking(status, status);
    booking("started", "APPROVED", now.toISOString());
    booking("later", "APPROVED", "2026-09-26T09:00:01.000Z");
    await sendDueBookingReminders(now);
    expect(sendEmailNotification).not.toHaveBeenCalled();
    expect(sendPushNotification).not.toHaveBeenCalled();
  });
  it("retries a failed channel without repeating a successful channel", async () => {
    booking();
    vi.mocked(sendPushNotification).mockResolvedValueOnce(false);
    await sendDueBookingReminders(now);
    await sendDueBookingReminders(new Date(now.getTime() + 30000));
    expect(sendPushNotification).toHaveBeenCalledTimes(1);
    await sendDueBookingReminders(new Date(now.getTime() + 60000));
    expect(sendPushNotification).toHaveBeenCalledTimes(2);
    expect(sendEmailNotification).toHaveBeenCalledTimes(1);
  });
  it("follows rescheduling and stops retries after cancellation", async () => {
    booking();
    await sendDueBookingReminders(now);
    getDatabase().prepare("UPDATE booking_requests SET start_at = ? WHERE id = ?")
      .run("2026-09-26T10:00:00.000Z", "reminder-test");
    await sendDueBookingReminders(new Date("2026-09-26T08:30:00.000Z"));
    expect(sendEmailNotification).toHaveBeenCalledTimes(1);
    vi.mocked(sendPushNotification).mockResolvedValue(false);
    await sendDueBookingReminders(new Date("2026-09-26T09:00:00.000Z"));
    expect(sendEmailNotification).toHaveBeenCalledTimes(2);
    getDatabase().exec("UPDATE booking_requests SET status = 'CANCELLED'");
    await sendDueBookingReminders(new Date("2026-09-26T09:01:00.000Z"));
    expect(sendPushNotification).toHaveBeenCalledTimes(2);
  });
  it("coordinates overlapping scheduler runs", async () => {
    booking();
    await Promise.all([sendDueBookingReminders(now), sendDueBookingReminders(now)]);
    expect(sendEmailNotification).toHaveBeenCalledTimes(1);
    expect(sendPushNotification).toHaveBeenCalledTimes(1);
  });
  it("recovers an expired claim but respects an active claim", async () => {
    booking();
    vi.mocked(sendEmailNotification).mockResolvedValue({ sent: false });
    await sendDueBookingReminders(now);
    getDatabase().prepare("UPDATE booking_reminder_deliveries SET claim_id = 'interrupted', retry_at = ? WHERE channel = 'email'")
      .run(now.getTime() + 300000);
    await sendDueBookingReminders(new Date(now.getTime() + 60000));
    expect(sendEmailNotification).toHaveBeenCalledTimes(1);
    vi.mocked(sendEmailNotification).mockResolvedValue({ sent: true });
    await sendDueBookingReminders(new Date(now.getTime() + 300000));
    expect(sendEmailNotification).toHaveBeenCalledTimes(2);
  });
  it("catches up after downtime but never sends after the start", async () => {
    booking();
    await sendDueBookingReminders(new Date("2026-09-26T08:45:00.000Z"));
    expect(sendEmailNotification).toHaveBeenCalledTimes(1);
    booking("missed", "APPROVED", start);
    await sendDueBookingReminders(new Date(start));
    expect(sendEmailNotification).toHaveBeenCalledTimes(1);
  });
  it("starts once and polls without any web requests", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(now.getTime() - 30000));
    booking();
    startBookingReminderScheduler();
    startBookingReminderScheduler();
    await vi.advanceTimersByTimeAsync(30000);
    expect(sendEmailNotification).toHaveBeenCalledTimes(1);
    expect(vi.getTimerCount()).toBe(1);
  });
});
