import nodemailer from "nodemailer";

export interface LecturerCredentialsEmailInput {
  recipient: string;
  lecturerName: string;
  username: string;
  temporaryPassword: string;
}

export interface MailSendResult {
  sent: boolean;
  skippedReason?: string;
}

export interface EmailNotification {
  subject: string;
  text: string;
}

export interface BasicNotificationEmailInput {
  recipient: string;
  subject: string;
  text: string;
}

export interface LecturerAccountRejectedEmailInput {
  lecturerName: string;
  note?: string;
}

export interface BookingNotificationEmailInput {
  lecturerName: string;
  roomName: string;
  date: string;
  startTime: string;
  endTime: string;
  purpose: string;
  note?: string;
}

export interface BookingDecisionEmailInput extends BookingNotificationEmailInput {
  decision: "APPROVED" | "REJECTED";
}

export interface IssueNotificationEmailInput {
  lecturerName: string;
  roomName: string;
  title: string;
  status?: string;
  note?: string;
}

function getRequiredMailConfig() {
  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) {
    return undefined;
  }

  return {
    host,
    port: Number(process.env.SMTP_PORT ?? 587),
    secure: process.env.SMTP_SECURE === "true",
    user,
    pass,
    from: process.env.SMTP_FROM ?? user,
  };
}

export function buildLecturerCredentialsEmail(input: LecturerCredentialsEmailInput) {
  return {
    subject: "Your classroom booking lecturer account",
    text: [
      `Hello ${input.lecturerName},`,
      "",
      "Your lecturer account has been created.",
      "",
      `Username: ${input.username}`,
      `Temporary password: ${input.temporaryPassword}`,
      "",
      "Please sign in and change your password immediately.",
    ].join("\n"),
  };
}

export function buildLecturerAccountRejectedEmail(input: LecturerAccountRejectedEmailInput): EmailNotification {
  return {
    subject: "Your classroom booking account request was rejected",
    text: [
      `Hello ${input.lecturerName},`,
      "",
      "Your lecturer account request was reviewed and rejected.",
      input.note ? "" : undefined,
      input.note ? `Admin note: ${input.note}` : undefined,
      "",
      "Please contact the administration office if you need more information.",
    ].filter(Boolean).join("\n"),
  };
}

export function buildBookingSubmittedEmail(input: BookingNotificationEmailInput): EmailNotification {
  return {
    subject: "Your room booking request was submitted",
    text: [
      `Hello ${input.lecturerName},`,
      "",
      "Your room booking request has been submitted and is waiting for admin review.",
      "",
      `Room: ${input.roomName}`,
      `Date: ${input.date}`,
      `Time: ${input.startTime} - ${input.endTime}`,
      `Purpose: ${input.purpose}`,
    ].join("\n"),
  };
}

export function buildBookingDecisionEmail(input: BookingDecisionEmailInput): EmailNotification {
  const approved = input.decision === "APPROVED";
  return {
    subject: approved ? "Your room booking request was approved" : "Your room booking request was rejected",
    text: [
      `Hello ${input.lecturerName},`,
      "",
      approved
        ? "Your room booking request has been approved."
        : "Your room booking request has been rejected.",
      "",
      `Room: ${input.roomName}`,
      `Date: ${input.date}`,
      `Time: ${input.startTime} - ${input.endTime}`,
      `Purpose: ${input.purpose}`,
      input.note ? "" : undefined,
      input.note ? `Admin note: ${input.note}` : undefined,
    ].filter(Boolean).join("\n"),
  };
}

export function buildIssueSubmittedEmail(input: IssueNotificationEmailInput): EmailNotification {
  return {
    subject: "Your room issue report was received",
    text: [
      `Hello ${input.lecturerName},`,
      "",
      "Your room issue report has been received.",
      "",
      `Room: ${input.roomName}`,
      `Issue: ${input.title}`,
    ].join("\n"),
  };
}

export function buildIssueStatusEmail(input: IssueNotificationEmailInput): EmailNotification {
  return {
    subject: `Room issue status updated: ${input.title}`,
    text: [
      `Hello ${input.lecturerName},`,
      "",
      "The status of your room issue report has been updated.",
      "",
      `Room: ${input.roomName}`,
      `Issue: ${input.title}`,
      input.status ? `Status: ${input.status.replace("_", " ").toLowerCase()}` : undefined,
      input.note ? "" : undefined,
      input.note ? `Admin note: ${input.note}` : undefined,
    ].filter(Boolean).join("\n"),
  };
}

export async function sendEmailNotification(input: BasicNotificationEmailInput): Promise<MailSendResult> {
  const config = getRequiredMailConfig();

  if (!config) {
    return {
      sent: false,
      skippedReason: "SMTP is not configured.",
    };
  }

  const transporter = nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure,
    auth: {
      user: config.user,
      pass: config.pass,
    },
  });

  await transporter.sendMail({
    from: config.from,
    to: input.recipient,
    subject: input.subject,
    text: input.text,
  });

  return { sent: true };
}

export async function sendLecturerCredentialsEmail(input: LecturerCredentialsEmailInput): Promise<MailSendResult> {
  const email = buildLecturerCredentialsEmail(input);

  return sendEmailNotification({
    recipient: input.recipient,
    subject: email.subject,
    text: email.text,
  });
}
