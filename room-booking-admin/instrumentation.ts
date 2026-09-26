export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs" && process.env.NEXT_PHASE !== "phase-production-build") {
    const { startBookingReminderScheduler } = await import("./lib/server/booking-reminders");
    startBookingReminderScheduler();
  }
}
