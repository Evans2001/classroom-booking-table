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

export async function sendLecturerCredentialsEmail(input: LecturerCredentialsEmailInput): Promise<MailSendResult> {
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
  const email = buildLecturerCredentialsEmail(input);

  await transporter.sendMail({
    from: config.from,
    to: input.recipient,
    subject: email.subject,
    text: email.text,
  });

  return { sent: true };
}
