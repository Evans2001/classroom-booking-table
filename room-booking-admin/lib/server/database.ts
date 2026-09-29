import type { AdminUser } from "@/lib/types/user";
import { mkdirSync } from "node:fs";
import path from "node:path";
import { randomBytes, randomUUID, scryptSync, timingSafeEqual } from "node:crypto";
import { DatabaseSync, type SQLInputValue } from "node:sqlite";

import type {
  CreateRoomInput,
  Room as AdminRoom,
  RoomFilters,
  UpdateRoomInput,
} from "@/lib/types/room";
import type {
  BookingRequest,
  RequestFilters,
  RequestStatus,
} from "@/lib/types/request";
import type {
  Issue as AdminIssue,
  IssueFilters,
  IssueStatus,
} from "@/lib/types/issue";
import {
  buildBookingDecisionEmail,
  buildBookingSubmittedEmail,
  buildIssueStatusEmail,
  buildIssueSubmittedEmail,
  buildLecturerAccountRejectedEmail,
  buildLecturerCredentialsEmail,
  sendEmailNotification,
  sendLecturerCredentialsEmail,
  type EmailNotification,
} from "@/lib/server/mailer";
import { sendPushNotification } from "@/lib/server/push";
import { assertFutureBookingWindow } from "@/lib/utils/booking-date-time";
import {
  campusLocalDateTimeToIso,
  formatCampusDate,
  formatCampusTime,
  getCampusWeekdayAndMinute,
} from "@/lib/utils/campus-date-time";

export { getMinBookingDateTimeInputValue } from "@/lib/utils/booking-date-time";

const CONFIGURED_DB_PATH = process.env.ROOM_BOOKING_DB_PATH?.trim();
const DB_PATH = CONFIGURED_DB_PATH === ":memory:"
  ? ":memory:"
  : CONFIGURED_DB_PATH
    ? path.resolve(CONFIGURED_DB_PATH)
    : path.join(process.cwd(), "data", "room-booking.sqlite");
const DB_DIRECTORY = path.dirname(DB_PATH);
const DEMO_LECTURER_NAME = "Demo Lecturer";
const DEMO_LECTURER_EMAIL = "lecturer@eng.ruh.ac.lk";
const DEMO_LECTURER_DEPARTMENT = "Computer Science";
const DEMO_ADMIN_NAME = "System Admin";

type LecturerRoomStatus = "AVAILABLE" | "LIMITED" | "UNAVAILABLE";
type LecturerIssueStatus = "OPEN" | "IN_PROGRESS" | "RESOLVED" | "CLOSED";
type LecturerIssueSeverity = "LOW" | "MEDIUM" | "HIGH";

interface LecturerRoom {
  id: string;
  roomNumber: string;
  name: string;
  capacity: number;
  type: "LECTURE_HALL" | "LAB" | "MEETING_ROOM";
  status: LecturerRoomStatus;
  facilities: string[];
  description: string;
}

interface LecturerBooking {
  id: string;
  requesterName: string;
  roomId: string;
  roomName: string;
  roomNumber: string;
  moduleName: string;
  startAt: string;
  endAt: string;
  startLocal: string;
  endLocal: string;
  purpose: string;
  attendees: number;
  status: RequestStatus;
  submittedAt: string;
  reviewerNote?: string;
}

interface LecturerIssueUpdate {
  status: LecturerIssueStatus;
  note: string;
  at: string;
}

interface LecturerIssue {
  id: string;
  roomId: string;
  roomName: string;
  title: string;
  description: string;
  severity: LecturerIssueSeverity;
  status: LecturerIssueStatus;
  imageUrl?: string;
  createdAt: string;
  updates: LecturerIssueUpdate[];
}

interface LecturerIdentity {
  name: string;
  email: string;
  department: string;
  idNumber: string;
  sessionToken?: string;
}

interface BookingAvailabilityInput {
  roomId: string;
  startAt: string;
  endAt: string;
  excludeBookingId?: string;
}

interface BookingInput {
  roomId: string;
  moduleName: string;
  startAt: string;
  endAt: string;
  purpose: string;
  attendees: number;
}

interface IssueInput {
  roomId: string;
  title: string;
  description: string;
  severity: LecturerIssueSeverity;
  imageUrl?: string;
}

const ROOM_TYPES = new Set<CreateRoomInput["type"]>([
  "LECTURE_HALL",
  "LAB",
  "MEETING_ROOM",
]);
const ROOM_STATUSES = new Set<CreateRoomInput["status"]>([
  "ACTIVE",
  "MAINTENANCE",
  "INACTIVE",
]);
const ADMIN_ISSUE_STATUSES = new Set<IssueStatus>([
  "OPEN",
  "IN_PROGRESS",
  "RESOLVED",
  "CLOSED",
]);
const LECTURER_ISSUE_SEVERITIES = new Set<LecturerIssueSeverity>([
  "LOW",
  "MEDIUM",
  "HIGH",
]);

export type LecturerAccountRequestStatus = "PENDING" | "APPROVED" | "REJECTED";

export interface LecturerAccountRequestInput {
  name: string;
  department: string;
  position: string;
  gmail: string;
  idNumber?: string;
}

export interface LecturerAccountRequest {
  id: string;
  name: string;
  department: string;
  position: string;
  gmail: string;
  idNumber: string;
  status: LecturerAccountRequestStatus;
  submittedAt: string;
  reviewedAt?: string;
  reviewer?: string;
  reviewerNote?: string;
  generatedUsername?: string;
}

export interface LecturerAccount {
  id: string;
  requestId?: string;
  name: string;
  department: string;
  position: string;
  gmail: string;
  idNumber: string;
  username: string;
  mustChangePassword: boolean;
  createdAt: string;
  updatedAt: string;
  sessionToken?: string;
}

export interface TimetableEntry {
  id: string;
  semester: string;
  department: string;
  batch: string;
  lecturerName: string;
  lecturerId: string;
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  moduleCode: string;
  roomNumber: string;
  roomName: string;
  uploadedAt: string;
}

export type TimetableEntryInput = Omit<TimetableEntry, "id" | "uploadedAt" | "roomName" | "lecturerName"> & { lecturerName?: string };

interface ImportedRow {
  requesterName: string;
  requesterEmail: string;
  department: string;
  roomId: string;
  purpose: string;
  date: string;
  startTime: string;
  endTime: string;
  attendees: number;
}

type RoomRow = {
  id: string;
  room_number: string;
  code: string;
  name: string;
  building: string;
  floor: number;
  capacity: number;
  type: AdminRoom["type"];
  has_projector: number;
  has_ac: number;
  status: AdminRoom["status"];
  created_at: string;
  updated_at: string;
};

type BookingRow = {
  id: string;
  requester_name: string;
  requester_email: string;
  department: string;
  room_id: string;
  module_name: string | null;
  purpose: string;
  start_at: string;
  end_at: string;
  attendees: number;
  status: RequestStatus;
  submitted_at: string;
  reviewed_at: string | null;
  reviewer: string | null;
  reviewer_note: string | null;
  source: string;
  room_code: string;
  room_name: string;
  building: string;
};

type IssueRow = {
  id: string;
  room_id: string;
  title: string;
  description: string;
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  status: LecturerIssueStatus;
  reported_by: string;
  reporter_email: string | null;
  reported_at: string;
  assigned_to: string | null;
  resolved_at: string | null;
  resolution_note: string | null;
  image_url: string | null;
  room_name: string;
};

type LecturerAccountRequestRow = {
  id: string;
  name: string;
  department: string;
  position: string;
  gmail: string;
  id_number: string;
  status: LecturerAccountRequestStatus;
  submitted_at: string;
  reviewed_at: string | null;
  reviewer: string | null;
  reviewer_note: string | null;
  generated_username: string | null;
};

type LecturerAccountRow = {
  id: string;
  request_id: string | null;
  name: string;
  department: string;
  position: string;
  gmail: string;
  id_number: string;
  username: string;
  password_hash: string;
  must_change_password: number;
  created_at: string;
  updated_at: string;
};

const seededRooms: Array<CreateRoomInput & { code: string; building: string; floor: number }> = [
  {
    code: "LH-101",
    name: "Main Lecture Hall",
    building: "Engineering Block",
    floor: 1,
    capacity: 160,
    type: "LECTURE_HALL",
    hasProjector: true,
    hasAc: true,
    status: "ACTIVE",
  },
  {
    code: "LAB-204",
    name: "Computer Lab A",
    building: "Science Complex",
    floor: 2,
    capacity: 45,
    type: "LAB",
    hasProjector: true,
    hasAc: false,
    status: "ACTIVE",
  },
  {
    code: "MR-305",
    name: "Board Meeting Room",
    building: "Admin Building",
    floor: 3,
    capacity: 20,
    type: "MEETING_ROOM",
    hasProjector: true,
    hasAc: true,
    status: "ACTIVE",
  },
  {
    code: "LH-202",
    name: "South Lecture Hall",
    building: "Engineering Block",
    floor: 2,
    capacity: 120,
    type: "LECTURE_HALL",
    hasProjector: true,
    hasAc: false,
    status: "MAINTENANCE",
  },
  {
    code: "LAB-111",
    name: "Chemistry Lab",
    building: "Science Complex",
    floor: 1,
    capacity: 36,
    type: "LAB",
    hasProjector: false,
    hasAc: false,
    status: "INACTIVE",
  },
];

const realFacultyRooms: Array<CreateRoomInput & { code: string; building: string; floor: number }> = [
  { code: "AUDITORIUM", name: "Auditorium", building: "Faculty of Engineering", floor: 0, capacity: 400, type: "LECTURE_HALL", hasProjector: true, hasAc: true, status: "ACTIVE" },
  ...["LT1", "LT2", "NHL1", "NHL2", "NHL3", "NHL4", "LR1", "LR2", "EEC", "ELR", "NCC", "OCC", "DO1", "DO2"].map((code) => ({
    code, name: code, building: "Faculty of Engineering", floor: 0, capacity: 100,
    type: "LECTURE_HALL" as const, hasProjector: true, hasAc: false, status: "ACTIVE" as const,
  })),
];

const seededRequests = [
  {
    id: "req-1",
    requesterName: "Namal Perera",
    requesterEmail: "namal.perera@university.edu",
    department: "Computer Science",
    roomNumber: "LH-101",
    moduleName: "Distributed Systems",
    purpose: "Guest lecture on distributed systems",
    startAt: "2026-03-04T09:00:00.000Z",
    endAt: "2026-03-04T11:00:00.000Z",
    attendees: 120,
    status: "PENDING" as const,
    submittedAt: "2026-02-26T09:10:00.000Z",
  },
  {
    id: "req-2",
    requesterName: "Samanthi Silva",
    requesterEmail: "samanthi.silva@university.edu",
    department: "Mathematics",
    roomNumber: "LH-101",
    moduleName: "Orientation",
    purpose: "Year 1 orientation",
    startAt: "2026-03-05T10:00:00.000Z",
    endAt: "2026-03-05T12:00:00.000Z",
    attendees: 140,
    status: "APPROVED" as const,
    submittedAt: "2026-02-24T11:00:00.000Z",
    reviewedAt: "2026-02-24T13:00:00.000Z",
    reviewer: DEMO_ADMIN_NAME,
    reviewerNote: "Approved",
  },
  {
    id: "req-3",
    requesterName: "Dilshan Fernando",
    requesterEmail: "dilshan.fernando@university.edu",
    department: "Mechanical Engineering",
    roomNumber: "LAB-204",
    moduleName: "Embedded Systems",
    purpose: "Embedded systems workshop",
    startAt: "2026-03-05T13:00:00.000Z",
    endAt: "2026-03-05T15:00:00.000Z",
    attendees: 40,
    status: "REJECTED" as const,
    submittedAt: "2026-02-22T08:00:00.000Z",
    reviewedAt: "2026-02-23T10:00:00.000Z",
    reviewer: DEMO_ADMIN_NAME,
    reviewerNote: "Requested equipment unavailable",
  },
  {
    id: "req-4",
    requesterName: "Shalini Jayasinghe",
    requesterEmail: "shalini.jayasinghe@university.edu",
    department: "Administration",
    roomNumber: "MR-305",
    moduleName: "Strategy Meeting",
    purpose: "Faculty strategy meeting",
    startAt: "2026-03-06T14:00:00.000Z",
    endAt: "2026-03-06T16:00:00.000Z",
    attendees: 18,
    status: "PENDING" as const,
    submittedAt: "2026-02-27T15:30:00.000Z",
  },
  {
    id: "bk-1",
    requesterName: DEMO_LECTURER_NAME,
    requesterEmail: DEMO_LECTURER_EMAIL,
    department: DEMO_LECTURER_DEPARTMENT,
    roomNumber: "LH-101",
    moduleName: "Software Engineering",
    purpose: "Department seminar",
    startAt: "2026-06-16T03:30:00.000Z",
    endAt: "2026-06-16T05:30:00.000Z",
    attendees: 80,
    status: "PENDING" as const,
    submittedAt: "2026-06-05T07:30:00.000Z",
  },
  {
    id: "bk-2",
    requesterName: DEMO_LECTURER_NAME,
    requesterEmail: DEMO_LECTURER_EMAIL,
    department: DEMO_LECTURER_DEPARTMENT,
    roomNumber: "MR-305",
    moduleName: "Database Systems",
    purpose: "Project discussion",
    startAt: "2026-06-18T08:00:00.000Z",
    endAt: "2026-06-18T09:00:00.000Z",
    attendees: 12,
    status: "APPROVED" as const,
    submittedAt: "2026-06-04T12:00:00.000Z",
    reviewedAt: "2026-06-04T14:00:00.000Z",
    reviewer: DEMO_ADMIN_NAME,
    reviewerNote: "Approved",
  },
  {
    id: "bk-3",
    requesterName: DEMO_LECTURER_NAME,
    requesterEmail: DEMO_LECTURER_EMAIL,
    department: DEMO_LECTURER_DEPARTMENT,
    roomNumber: "LAB-204",
    moduleName: "Web Application Development",
    purpose: "Lab revision session",
    startAt: "2026-06-20T03:00:00.000Z",
    endAt: "2026-06-20T04:00:00.000Z",
    attendees: 30,
    status: "REJECTED" as const,
    submittedAt: "2026-06-03T08:15:00.000Z",
    reviewedAt: "2026-06-03T09:15:00.000Z",
    reviewer: DEMO_ADMIN_NAME,
    reviewerNote: "Room unavailable due maintenance slot.",
  },
  {
    id: "bk-4",
    requesterName: DEMO_LECTURER_NAME,
    requesterEmail: DEMO_LECTURER_EMAIL,
    department: DEMO_LECTURER_DEPARTMENT,
    roomNumber: "LH-101",
    moduleName: "Computer Networks",
    purpose: "Guest lecture",
    startAt: "2026-06-24T04:00:00.000Z",
    endAt: "2026-06-24T06:00:00.000Z",
    attendees: 70,
    status: "APPROVED" as const,
    submittedAt: "2026-06-02T11:00:00.000Z",
    reviewedAt: "2026-06-02T12:00:00.000Z",
    reviewer: DEMO_ADMIN_NAME,
    reviewerNote: "Approved and reserved.",
  },
];

const seededIssues = [
  {
    id: "issue-1",
    roomNumber: "LH-101",
    title: "Projector color distortion",
    description: "Projector output has a strong green tint.",
    severity: "MEDIUM" as const,
    status: "OPEN" as const,
    reportedBy: "A. Lecturer",
    reportedAt: "2026-02-20T08:15:00.000Z",
    assignedTo: "Maintenance Team A",
    updates: [{ status: "OPEN" as const, note: "Issue reported by lecturer.", at: "2026-02-20T08:15:00.000Z" }],
  },
  {
    id: "issue-2",
    roomNumber: "LAB-204",
    title: "Air conditioning not cooling",
    description: "Room temperature is high during afternoon sessions.",
    severity: "HIGH" as const,
    status: "IN_PROGRESS" as const,
    reportedBy: "Lab Instructor",
    reportedAt: "2026-02-18T12:00:00.000Z",
    assignedTo: "Facilities Unit",
    updates: [
      { status: "OPEN" as const, note: "Issue reported by lecturer.", at: "2026-02-18T12:00:00.000Z" },
      { status: "IN_PROGRESS" as const, note: "Maintenance team assigned.", at: "2026-02-18T15:00:00.000Z" },
    ],
  },
  {
    id: "issue-3",
    roomNumber: "LH-202",
    title: "Broken chair set",
    description: "Several seats in row 3 are damaged.",
    severity: "LOW" as const,
    status: "RESOLVED" as const,
    reportedBy: "Student Affairs",
    reportedAt: "2026-02-10T10:45:00.000Z",
    resolvedAt: "2026-02-12T13:30:00.000Z",
    resolutionNote: "Seats replaced",
    updates: [
      { status: "OPEN" as const, note: "Issue reported by lecturer.", at: "2026-02-10T10:45:00.000Z" },
      { status: "RESOLVED" as const, note: "Seats replaced", at: "2026-02-12T13:30:00.000Z" },
    ],
  },
  {
    id: "issue-4",
    roomNumber: "LAB-111",
    title: "Chemical cabinet lock failure",
    description: "Safety cabinet cannot be secured.",
    severity: "CRITICAL" as const,
    status: "OPEN" as const,
    reportedBy: "Lab Technician",
    reportedAt: "2026-02-27T07:20:00.000Z",
    updates: [{ status: "OPEN" as const, note: "Issue reported by staff.", at: "2026-02-27T07:20:00.000Z" }],
  },
  {
    id: "is-1",
    roomNumber: "LAB-204",
    title: "Projector not turning on",
    description: "Power light blinks but no display.",
    severity: "HIGH" as const,
    status: "IN_PROGRESS" as const,
    reportedBy: DEMO_LECTURER_NAME,
    reportedAt: "2026-02-26T08:30:00.000Z",
    imageUrl: undefined,
    updates: [
      { status: "OPEN" as const, note: "Issue submitted from lecturer mobile app.", at: "2026-02-26T08:30:00.000Z" },
      { status: "IN_PROGRESS" as const, note: "Maintenance team assigned.", at: "2026-02-27T11:00:00.000Z" },
    ],
  },
  {
    id: "is-2",
    roomNumber: "LH-101",
    title: "Microphone echo issue",
    description: "Audio feedback starts when volume is above medium.",
    severity: "MEDIUM" as const,
    status: "OPEN" as const,
    reportedBy: DEMO_LECTURER_NAME,
    reportedAt: "2026-02-28T06:00:00.000Z",
    updates: [{ status: "OPEN" as const, note: "Issue reported by faculty.", at: "2026-02-28T06:00:00.000Z" }],
  },
  {
    id: "is-3",
    roomNumber: "MR-305",
    title: "Ceiling light flicker",
    description: "One light panel was flickering during meetings.",
    severity: "LOW" as const,
    status: "RESOLVED" as const,
    reportedBy: DEMO_LECTURER_NAME,
    reportedAt: "2026-01-30T05:45:00.000Z",
    resolvedAt: "2026-02-02T09:20:00.000Z",
    resolutionNote: "Electrical maintenance completed.",
    updates: [
      { status: "OPEN" as const, note: "Issue reported by lecturer.", at: "2026-01-30T05:45:00.000Z" },
      { status: "RESOLVED" as const, note: "Electrical maintenance completed.", at: "2026-02-02T09:20:00.000Z" },
    ],
  },
];

declare global {
  var __roomBookingDatabase__: DatabaseSync | undefined;
}

const initializedConnections = new WeakSet<DatabaseSync>();

export function getDatabase(): DatabaseSync {
  if (globalThis.__roomBookingDatabase__ && initializedConnections.has(globalThis.__roomBookingDatabase__)) return globalThis.__roomBookingDatabase__;
  if (!globalThis.__roomBookingDatabase__) {
    if (DB_PATH !== ":memory:") {
      mkdirSync(DB_DIRECTORY, { recursive: true });
    }
    const database = new DatabaseSync(DB_PATH);
    database.exec("PRAGMA busy_timeout = 5000; PRAGMA journal_mode = WAL;");
    database.exec(`
      PRAGMA foreign_keys = ON;

      CREATE TABLE IF NOT EXISTS rooms (
        id TEXT PRIMARY KEY,
        code TEXT NOT NULL UNIQUE,
        name TEXT NOT NULL,
        building TEXT NOT NULL,
        floor INTEGER NOT NULL,
        capacity INTEGER NOT NULL,
        type TEXT NOT NULL,
        has_projector INTEGER NOT NULL,
        has_ac INTEGER NOT NULL,
        status TEXT NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS booking_requests (
        id TEXT PRIMARY KEY,
        requester_name TEXT NOT NULL,
        requester_email TEXT NOT NULL,
        department TEXT NOT NULL,
        room_id TEXT NOT NULL,
        module_name TEXT,
        purpose TEXT NOT NULL,
        start_at TEXT NOT NULL,
        end_at TEXT NOT NULL,
        attendees INTEGER NOT NULL,
        status TEXT NOT NULL,
        submitted_at TEXT NOT NULL,
        reviewed_at TEXT,
        reviewer TEXT,
        reviewer_note TEXT,
        source TEXT NOT NULL DEFAULT 'general',
        FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS issues (
        id TEXT PRIMARY KEY,
        room_id TEXT NOT NULL,
        title TEXT NOT NULL,
        description TEXT NOT NULL,
        severity TEXT NOT NULL,
        status TEXT NOT NULL,
        reported_by TEXT NOT NULL,
        reporter_email TEXT,
        reported_at TEXT NOT NULL,
        assigned_to TEXT,
        resolved_at TEXT,
        resolution_note TEXT,
        image_url TEXT,
        FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS issue_updates (
        id TEXT PRIMARY KEY,
        issue_id TEXT NOT NULL,
        status TEXT NOT NULL,
        note TEXT NOT NULL,
        at TEXT NOT NULL,
        FOREIGN KEY (issue_id) REFERENCES issues(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS lecturer_account_requests (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        department TEXT NOT NULL,
        position TEXT NOT NULL,
        gmail TEXT NOT NULL,
        id_number TEXT NOT NULL,
        status TEXT NOT NULL,
        submitted_at TEXT NOT NULL,
        reviewed_at TEXT,
        reviewer TEXT,
        reviewer_note TEXT,
        generated_username TEXT
      );

      CREATE TABLE IF NOT EXISTS lecturer_accounts (
        id TEXT PRIMARY KEY,
        request_id TEXT,
        name TEXT NOT NULL,
        department TEXT NOT NULL,
        position TEXT NOT NULL,
        gmail TEXT NOT NULL UNIQUE,
        id_number TEXT NOT NULL UNIQUE,
        username TEXT NOT NULL UNIQUE,
        password_hash TEXT NOT NULL,
        must_change_password INTEGER NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        FOREIGN KEY (request_id) REFERENCES lecturer_account_requests(id) ON DELETE SET NULL
      );

      CREATE TABLE IF NOT EXISTS lecturer_sessions (
        token TEXT PRIMARY KEY,
        lecturer_account_id TEXT NOT NULL,
        created_at TEXT NOT NULL,
        expires_at TEXT NOT NULL,
        FOREIGN KEY (lecturer_account_id) REFERENCES lecturer_accounts(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS email_outbox (
        id TEXT PRIMARY KEY,
        recipient TEXT NOT NULL,
        subject TEXT NOT NULL,
        body TEXT NOT NULL,
        created_at TEXT NOT NULL,
        sent_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS lecturer_push_tokens (
        id TEXT PRIMARY KEY,
        lecturer_email TEXT NOT NULL,
        token TEXT NOT NULL UNIQUE,
        platform TEXT NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS timetable_entries (
        id TEXT PRIMARY KEY,
        semester TEXT NOT NULL,
        department TEXT NOT NULL,
        batch TEXT NOT NULL DEFAULT '',
        lecturer_name TEXT NOT NULL,
        lecturer_id TEXT NOT NULL DEFAULT '',
        day_of_week TEXT NOT NULL,
        start_time TEXT NOT NULL,
        end_time TEXT NOT NULL,
        module_code TEXT NOT NULL,
        room_code TEXT NOT NULL,
        uploaded_at TEXT NOT NULL
      );

      CREATE INDEX IF NOT EXISTS timetable_room_slot
        ON timetable_entries(room_code, day_of_week, start_time, end_time);
    `);
    try { database.exec("ALTER TABLE timetable_entries ADD COLUMN batch TEXT NOT NULL DEFAULT ''"); } catch { /* Existing column. */ }
    try { database.exec("ALTER TABLE timetable_entries ADD COLUMN lecturer_id TEXT NOT NULL DEFAULT ''"); } catch { /* Existing column. */ }
    try { database.exec("ALTER TABLE issues ADD COLUMN reporter_email TEXT"); } catch { /* Existing column. */ }
    if (process.env.NODE_ENV !== "production") {
      seedIfNeeded(database);
    }
    ensureRealFacultyRooms(database);
    ensureDevelopmentDemoAccount(database);
    backfillIssueReporterEmails(database);
    globalThis.__roomBookingDatabase__ = database;
  }

  ensureRoomIds(globalThis.__roomBookingDatabase__);
  ensureLecturerIds(globalThis.__roomBookingDatabase__);
  const db = globalThis.__roomBookingDatabase__;
  if (!db.prepare("SELECT value FROM app_settings WHERE key = 'timetable_lecturer_ids_v1'").get()) {
    db.exec(`UPDATE timetable_entries SET lecturer_id = (SELECT id_number FROM lecturer_accounts WHERE lower(name) = lower(timetable_entries.lecturer_name))
      WHERE lecturer_id = '' AND (SELECT COUNT(*) FROM lecturer_accounts WHERE lower(name) = lower(timetable_entries.lecturer_name)) = 1;
      INSERT OR IGNORE INTO app_settings (key, value) VALUES ('timetable_lecturer_ids_v1', 'true');`);
  }
  ensureSessionTable(db);
  db.exec(`
    CREATE INDEX IF NOT EXISTS booking_room_status_time ON booking_requests(room_id, status, start_at, end_at);
    CREATE INDEX IF NOT EXISTS booking_requester_submitted ON booking_requests(requester_email, submitted_at DESC);
    CREATE INDEX IF NOT EXISTS booking_start_at ON booking_requests(start_at);
    CREATE INDEX IF NOT EXISTS issue_reporter_date ON issues(reporter_email, reported_at DESC);
    CREATE INDEX IF NOT EXISTS issue_updates_issue_date ON issue_updates(issue_id, at);
    CREATE INDEX IF NOT EXISTS timetable_lecturer ON timetable_entries(lecturer_id);
    CREATE INDEX IF NOT EXISTS sessions_account ON lecturer_sessions(lecturer_account_id);
  `);
  initializedConnections.add(db);
  return db;
}

// A separate sequence survives room deletion and preserves existing booking keys.
function ensureRoomIds(database: DatabaseSync): void {
  if (database.prepare("SELECT name FROM sqlite_master WHERE type = 'trigger' AND name = 'assign_room_number'").get()) return;
  database.exec("BEGIN IMMEDIATE");
  try {
    if (database.prepare("SELECT name FROM sqlite_master WHERE type = 'trigger' AND name = 'assign_room_number'").get()) {
      database.exec("COMMIT");
      return;
    }
    database.exec(`
      ALTER TABLE rooms ADD COLUMN room_number TEXT;
      CREATE TABLE room_id_registry (
        number INTEGER PRIMARY KEY AUTOINCREMENT,
        room_key TEXT NOT NULL UNIQUE
      );
      INSERT INTO room_id_registry (room_key) SELECT id FROM rooms ORDER BY created_at, id;
      UPDATE rooms SET room_number = (
        SELECT printf('R-%03d', number) FROM room_id_registry WHERE room_key = rooms.id
      );
      CREATE UNIQUE INDEX rooms_room_number_unique ON rooms(room_number);
      CREATE TRIGGER assign_room_number AFTER INSERT ON rooms BEGIN
        INSERT INTO room_id_registry (room_key) VALUES (NEW.id);
        UPDATE rooms SET room_number = (
          SELECT printf('R-%03d', number) FROM room_id_registry WHERE room_key = NEW.id
        ) WHERE id = NEW.id;
      END;
    `);
    database.exec("COMMIT");
  } catch (error) {
    database.exec("ROLLBACK");
    throw error;
  }
}

// Issued IDs remain reserved even when an account or request is deleted.
function allocateLecturerId(database: DatabaseSync, owner: string): string {
  const row = database.prepare("SELECT COALESCE(MAX(number), 0) AS last FROM lecturer_id_registry").get() as { last: number };
  if (row.last >= 999) throw new Error("All lecturer IDs from 001 to 999 have been issued. Contact the administrator.");
  const next = row.last + 1;
  database.prepare("INSERT INTO lecturer_id_registry (number, owner) VALUES (?, ?)").run(next, owner);
  return String(next).padStart(3, "0");
}

function ensureLecturerIds(database: DatabaseSync): void {
  database.exec(`CREATE TABLE IF NOT EXISTS lecturer_id_registry (
    number INTEGER PRIMARY KEY CHECK (number BETWEEN 1 AND 999), owner TEXT NOT NULL UNIQUE
  )`);
  if (database.prepare("SELECT value FROM app_settings WHERE key = 'lecturer_ids_v1'").get()) return;
  database.exec("BEGIN IMMEDIATE");
  try {
    if (database.prepare("SELECT value FROM app_settings WHERE key = 'lecturer_ids_v1'").get()) {
      database.exec("COMMIT");
      return;
    }
    const accounts = database.prepare("SELECT id, request_id, id_number FROM lecturer_accounts ORDER BY created_at, id").all() as Array<{ id: string; request_id: string | null; id_number: string }>;
    const requests = database.prepare("SELECT id, id_number FROM lecturer_account_requests ORDER BY submitted_at, id").all() as Array<{ id: string; id_number: string }>;
    const linked = new Set(accounts.map((account) => account.request_id));
    const owners = [
      ...accounts.map((account) => ({ owner: account.request_id || account.id, old: account.id_number, account })),
      ...requests.filter((request) => !linked.has(request.id)).map((request) => ({ owner: request.id, old: request.id_number, account: undefined })),
    ];
    // Retain existing valid numeric IDs before allocating any new ones.
    for (const item of owners) {
      if (/^(?!000)[0-9]{3}$/.test(item.old)) {
        database.prepare("INSERT OR IGNORE INTO lecturer_id_registry (number, owner) VALUES (?, ?)").run(Number(item.old), item.owner);
      }
    }
    for (const item of owners) {
      const reserved = database.prepare("SELECT number FROM lecturer_id_registry WHERE owner = ?").get(item.owner) as { number: number } | undefined;
      const assigned = reserved ? String(reserved.number).padStart(3, "0") : allocateLecturerId(database, item.owner);
      if (item.account) {
        database.prepare("UPDATE lecturer_accounts SET id_number = ? WHERE id = ?").run(assigned, item.account.id);
        database.prepare("UPDATE timetable_entries SET lecturer_id = ? WHERE lecturer_id = ? COLLATE NOCASE").run(assigned, item.old);
      }
      database.prepare("UPDATE lecturer_account_requests SET id_number = ? WHERE id = ?").run(assigned, item.owner);
    }
    database.prepare("INSERT INTO app_settings (key, value) VALUES ('lecturer_ids_v1', 'true')").run();
    database.exec("COMMIT");
  } catch (error) {
    database.exec("ROLLBACK");
    throw error;
  }
}

function ensureRealFacultyRooms(database: DatabaseSync): void {
  const insert = database.prepare(`INSERT OR IGNORE INTO rooms
    (id, code, name, building, floor, capacity, type, has_projector, has_ac, status, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);
  const now = new Date().toISOString();
  for (const room of realFacultyRooms) {
    insert.run(`room-${room.code.toLowerCase()}`, room.code, room.name, room.building, room.floor,
      room.capacity, room.type, Number(room.hasProjector), Number(room.hasAc), room.status, now, now);
  }
}

function ensureSessionTable(database: DatabaseSync): void {
  database.exec(`
    CREATE TABLE IF NOT EXISTS lecturer_sessions (
      token TEXT PRIMARY KEY,
      lecturer_account_id TEXT NOT NULL,
      created_at TEXT NOT NULL,
      expires_at TEXT NOT NULL,
      FOREIGN KEY (lecturer_account_id) REFERENCES lecturer_accounts(id) ON DELETE CASCADE
    );
  `);
}

function backfillIssueReporterEmails(database: DatabaseSync): void {
  const legacyReporters = database
    .prepare("SELECT DISTINCT reported_by FROM issues WHERE reporter_email IS NULL")
    .all() as Array<{ reported_by: string }>;
  const accountsByName = database.prepare("SELECT gmail FROM lecturer_accounts WHERE name = ?");
  const updateReporter = database.prepare(
    "UPDATE issues SET reporter_email = ? WHERE reporter_email IS NULL AND reported_by = ?",
  );

  for (const reporter of legacyReporters) {
    if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(reporter.reported_by)) {
      updateReporter.run(normalizeEmail(reporter.reported_by), reporter.reported_by);
      continue;
    }
    const matches = accountsByName.all(reporter.reported_by) as Array<{ gmail: string }>;
    if (matches.length === 1) updateReporter.run(matches[0].gmail, reporter.reported_by);
  }
}

function normalizeEmail(value: string): string {
  return value.trim().toLowerCase();
}

function isSeededDemoLecturerAccount(account: LecturerAccountRow): boolean {
  return (
    account.id === "lecturer-demo" &&
    account.request_id === null &&
    normalizeEmail(account.gmail) === DEMO_LECTURER_EMAIL
  );
}

function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

function verifyPassword(password: string, storedHash: string): boolean {
  const [salt, hash] = storedHash.split(":");
  if (!salt || !hash) {
    return false;
  }
  const storedBuffer = Buffer.from(hash, "hex");
  const suppliedBuffer = scryptSync(password, salt, 64);
  return storedBuffer.length === suppliedBuffer.length && timingSafeEqual(storedBuffer, suppliedBuffer);
}

function generateTemporaryPassword(): string {
  return `Lecturer-${randomBytes(4).toString("hex")}`;
}

function createLecturerSession(database: DatabaseSync, accountId: string): string {
  const token = randomBytes(32).toString("hex");
  const now = new Date();
  const expiresAt = new Date(now.getTime() + 1000 * 60 * 60 * 24 * 30);
  database
    .prepare(
      "INSERT INTO lecturer_sessions (token, lecturer_account_id, created_at, expires_at) VALUES (?, ?, ?, ?)",
    )
    .run(token, accountId, now.toISOString(), expiresAt.toISOString());
  return token;
}

function generateUsername(name: string, idNumber: string): string {
  const namePart = name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ".")
    .replace(/^\.+|\.+$/g, "")
    .slice(0, 24) || "lecturer";
  const idPart = idNumber.trim().replace(/[^a-zA-Z0-9]+/g, "").slice(-4).toLowerCase();
  return `${namePart}${idPart ? `.${idPart}` : ""}`;
}

function uniqueUsername(database: DatabaseSync, name: string, idNumber: string): string {
  const base = generateUsername(name, idNumber);
  let candidate = base;
  let suffix = 2;
  while (database.prepare("SELECT id FROM lecturer_accounts WHERE username = ?").get(candidate)) {
    candidate = `${base}.${suffix}`;
    suffix += 1;
  }
  return candidate;
}

function insertEmail(database: DatabaseSync, recipient: string, subject: string, body: string): void {
  const now = new Date().toISOString();
  database
    .prepare("INSERT INTO email_outbox (id, recipient, subject, body, created_at, sent_at) VALUES (?, ?, ?, ?, ?, ?)")
    .run(`mail-${randomUUID()}`, recipient, subject, body, now, now);
}

function resolveLecturerIdentity(identity?: Partial<LecturerIdentity>): LecturerIdentity & { sessionToken: string } {
  const sessionToken = identity?.sessionToken?.trim();
  if (sessionToken) {
    const row = getDatabase()
      .prepare(
        `
          SELECT a.*
          FROM lecturer_sessions s
          JOIN lecturer_accounts a ON a.id = s.lecturer_account_id
          WHERE s.token = ? AND s.expires_at > ?
        `,
      )
      .get(sessionToken, new Date().toISOString()) as LecturerAccountRow | undefined;

    if (
      !row ||
      (process.env.NODE_ENV === "production" && isSeededDemoLecturerAccount(row))
    ) {
      throw new Error("Invalid lecturer session.");
    }

    return {
      name: row.name,
      email: row.gmail,
      department: row.department,
      idNumber: row.id_number,
      sessionToken,
    };
  }

  throw new Error("Lecturer login required.");
}

export function assertLecturerSession(identity?: Partial<LecturerIdentity>): void {
  resolveLecturerIdentity(identity);
}

async function sendAndArchiveNotification(
  database: DatabaseSync,
  recipient: string | undefined,
  email: EmailNotification,
): Promise<void> {
  if (!recipient) {
    return;
  }
  insertEmail(database, recipient, email.subject, email.text);
  try {
    await sendEmailNotification({
      recipient,
      subject: email.subject,
      text: email.text,
    });
  } catch (error) {
    console.error("Unable to send lecturer notification email", error);
  }
  const tokens = listLecturerPushTokensByEmail(recipient);
  for (const token of tokens) {
    await sendPushNotification({
      token,
      title: email.subject,
      body: email.text.split("\n").filter(Boolean).slice(1, 3).join(" "),
    });
  }
}

function findLecturerEmailByName(database: DatabaseSync, name: string): string | undefined {
  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(name)) {
    return normalizeEmail(name);
  }
  const rows = database
    .prepare("SELECT gmail FROM lecturer_accounts WHERE name = ?")
    .all(name) as Array<{ gmail: string }>;
  return rows.length === 1 ? rows[0].gmail : undefined;
}

function listLecturerPushTokensByEmail(email: string): string[] {
  const rows = getDatabase()
    .prepare("SELECT token FROM lecturer_push_tokens WHERE lecturer_email = ?")
    .all(normalizeEmail(email)) as { token: string }[];
  return rows.map((row) => row.token);
}

function ensureDevelopmentDemoAccount(database: DatabaseSync): void {
  database.exec("CREATE TABLE IF NOT EXISTS app_settings (key TEXT PRIMARY KEY, value TEXT NOT NULL)");
  if (database.prepare("SELECT value FROM app_settings WHERE key = 'demo_account_deleted'").get()) return;
  if (process.env.NODE_ENV === "production") {
    return;
  }
  const existing = database
    .prepare("SELECT id FROM lecturer_accounts WHERE gmail = ?")
    .get(DEMO_LECTURER_EMAIL) as { id: string } | undefined;
  if (existing) {
    return;
  }
  const now = new Date().toISOString();
  database
    .prepare(
      `
        INSERT INTO lecturer_accounts (
          id, request_id, name, department, position, gmail, id_number, username, password_hash,
          must_change_password, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
    )
    .run(
      "lecturer-demo",
      null,
      DEMO_LECTURER_NAME,
      DEMO_LECTURER_DEPARTMENT,
      "Lecturer",
      DEMO_LECTURER_EMAIL,
      "DEMO-001",
      DEMO_LECTURER_EMAIL,
      hashPassword("Lecturer@123"),
      0,
      now,
      now,
    );
}

function seedIfNeeded(database: DatabaseSync) {
  const roomCount = database.prepare("SELECT COUNT(*) as count FROM rooms").get() as { count: number };
  if (roomCount.count > 0) {
    return;
  }

  const insertRoom = database.prepare(`
    INSERT INTO rooms (
      id, code, name, building, floor, capacity, type, has_projector, has_ac, status, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const now = "2026-01-01T08:00:00.000Z";
  for (const room of seededRooms) {
    const id = `room-${seededRooms.indexOf(room) + 1}`;
    const createdAt = id === "room-4" ? "2026-01-04T08:00:00.000Z" : now;
    const updatedAt =
      id === "room-4"
        ? "2026-02-14T08:00:00.000Z"
        : id === "room-5"
          ? "2026-02-20T08:00:00.000Z"
          : createdAt;
    insertRoom.run(
      id,
      room.code,
      room.name,
      room.building,
      room.floor,
      room.capacity,
      room.type,
      room.hasProjector ? 1 : 0,
      room.hasAc ? 1 : 0,
      room.status,
      createdAt,
      updatedAt,
    );
  }

  const roomIdsByCode = new Map<string, string>();
  for (const row of database.prepare("SELECT id, code FROM rooms").all() as Array<{ id: string; code: string }>) {
    roomIdsByCode.set(row.code, row.id);
  }

  const insertRequest = database.prepare(`
    INSERT INTO booking_requests (
      id, requester_name, requester_email, department, room_id, module_name, purpose, start_at, end_at, attendees,
      status, submitted_at, reviewed_at, reviewer, reviewer_note, source
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  for (const item of seededRequests) {
    const roomId = roomIdsByCode.get(item.roomNumber);
    if (!roomId) {
      throw new Error(`Seed room ${item.roomNumber} was not found.`);
    }
    insertRequest.run(
      item.id,
      item.requesterName,
      item.requesterEmail,
      item.department,
      roomId,
      item.moduleName,
      item.purpose,
      item.startAt,
      item.endAt,
      item.attendees,
      item.status,
      item.submittedAt,
      item.reviewedAt ?? null,
      item.reviewer ?? null,
      item.reviewerNote ?? null,
      item.requesterEmail === DEMO_LECTURER_EMAIL ? "lecturer" : "admin",
    );
  }

  const insertIssue = database.prepare(`
    INSERT INTO issues (
      id, room_id, title, description, severity, status, reported_by, reported_at, assigned_to, resolved_at, resolution_note, image_url
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const insertUpdate = database.prepare(`
    INSERT INTO issue_updates (id, issue_id, status, note, at) VALUES (?, ?, ?, ?, ?)
  `);
  for (const issue of seededIssues) {
    const roomId = roomIdsByCode.get(issue.roomNumber);
    if (!roomId) {
      throw new Error(`Seed room ${issue.roomNumber} was not found.`);
    }
    insertIssue.run(
      issue.id,
      roomId,
      issue.title,
      issue.description,
      issue.severity,
      issue.status,
      issue.reportedBy,
      issue.reportedAt,
      issue.assignedTo ?? null,
      issue.resolvedAt ?? null,
      issue.resolutionNote ?? null,
      issue.imageUrl ?? null,
    );
    for (const update of issue.updates) {
      insertUpdate.run(randomUUID(), issue.id, update.status, update.note, update.at);
    }
  }
}

function mapRoomRow(row: RoomRow): AdminRoom {
  return {
    id: row.id,
    roomNumber: row.room_number,
    name: row.name,
    capacity: row.capacity,
    type: row.type,
    hasProjector: Boolean(row.has_projector),
    hasAc: Boolean(row.has_ac),
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function formatLocalDate(date: Date): string {
  return formatCampusDate(date);
}

function formatLocalTime(date: Date): string {
  return formatCampusTime(date);
}

function mapBookingRowToAdminRequest(row: BookingRow): BookingRequest {
  const startAt = new Date(row.start_at);
  const endAt = new Date(row.end_at);
  return {
    id: row.id,
    requesterName: row.requester_name,
    requesterEmail: row.requester_email,
    department: row.department,
    roomId: row.room_id,
    roomName: row.room_name,
    purpose: row.purpose,
    date: formatLocalDate(startAt),
    startTime: formatLocalTime(startAt),
    endTime: formatLocalTime(endAt),
    attendees: row.attendees,
    status: row.status,
    submittedAt: row.submitted_at,
    reviewedAt: row.reviewed_at ?? undefined,
    reviewer: row.reviewer ?? undefined,
    reviewerNote: row.reviewer_note ?? undefined,
  };
}

function adminRoomToLecturerRoom(room: AdminRoom): LecturerRoom {
  const facilities = [
    room.hasProjector ? "Projector" : null,
    room.hasAc ? "AC" : null,
    room.type === "LAB" ? "Desktop PCs" : null,
    room.type === "MEETING_ROOM" ? "Video Conferencing" : null,
    "WiFi",
  ].filter(Boolean) as string[];

  let status: LecturerRoomStatus = "AVAILABLE";
  if (room.status === "MAINTENANCE" || room.status === "INACTIVE") {
    status = "UNAVAILABLE";
  } else if (!room.hasProjector || !room.hasAc) {
    status = "LIMITED";
  }

  return {
    id: room.id,
    roomNumber: room.roomNumber,
    name: room.name,
    capacity: room.capacity,
    type: room.type,
    status,
    facilities,
    description:
      room.type === "LAB"
        ? "Configured for practical sessions and supervised lab work."
        : room.type === "MEETING_ROOM"
          ? "Best suited for meetings, small group discussions, and interviews."
          : "Lecture-ready room suitable for classes, seminars, and guest sessions.",
  };
}

function mapBookingRowToLecturerBooking(row: BookingRow): LecturerBooking {
  return {
    id: row.id,
    requesterName: row.requester_name,
    roomId: row.room_id,
    roomName: row.room_name,
    roomNumber: row.room_code,
    moduleName: row.module_name ?? "General Booking",
    startAt: row.start_at,
    endAt: row.end_at,
    startLocal: `${formatLocalDate(new Date(row.start_at))}T${formatLocalTime(new Date(row.start_at))}`,
    endLocal: `${formatLocalDate(new Date(row.end_at))}T${formatLocalTime(new Date(row.end_at))}`,
    purpose: row.purpose,
    attendees: row.attendees,
    status: row.status,
    submittedAt: row.submitted_at,
    reviewerNote: row.reviewer_note ?? undefined,
  };
}

function toLecturerSeverity(value: IssueRow["severity"]): LecturerIssueSeverity {
  if (value === "CRITICAL") {
    return "HIGH";
  }
  return value;
}

function mapIssueRowToAdminIssue(row: IssueRow): AdminIssue {
  return {
    id: row.id,
    roomId: row.room_id,
    roomName: row.room_name,
    title: row.title,
    description: row.description,
    severity: row.severity,
    status: row.status,
    reportedBy: row.reported_by,
    reportedAt: row.reported_at,
    assignedTo: row.assigned_to ?? undefined,
    resolvedAt: row.resolved_at ?? undefined,
    resolutionNote: row.resolution_note ?? undefined,
  };
}

function mapIssueRowToLecturerIssue(row: IssueRow, updates: LecturerIssueUpdate[]): LecturerIssue {
  return {
    id: row.id,
    roomId: row.room_id,
    roomName: row.room_name,
    title: row.title,
    description: row.description,
    severity: toLecturerSeverity(row.severity),
    status: row.status,
    imageUrl: row.image_url ?? undefined,
    createdAt: row.reported_at,
    updates,
  };
}

function mapLecturerAccountRequestRow(row: LecturerAccountRequestRow): LecturerAccountRequest {
  return {
    id: row.id,
    name: row.name,
    department: row.department,
    position: row.position,
    gmail: row.gmail,
    idNumber: row.id_number,
    status: row.status,
    submittedAt: row.submitted_at,
    reviewedAt: row.reviewed_at ?? undefined,
    reviewer: row.reviewer ?? undefined,
    reviewerNote: row.reviewer_note ?? undefined,
    generatedUsername: row.generated_username ?? undefined,
  };
}

function mapLecturerAccountRow(row: LecturerAccountRow): LecturerAccount {
  return {
    id: row.id,
    requestId: row.request_id ?? undefined,
    name: row.name,
    department: row.department,
    position: row.position,
    gmail: row.gmail,
    idNumber: row.id_number,
    username: row.username,
    mustChangePassword: Boolean(row.must_change_password),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function listBookingRows(whereClause = "", params: SQLInputValue[] = []): BookingRow[] {
  const database = getDatabase();
  const query = `
    SELECT
      b.*,
      r.room_number as room_code,
      r.name as room_name
    FROM booking_requests b
    JOIN rooms r ON r.id = b.room_id
    ${whereClause}
  `;
  return database.prepare(query).all(...params) as BookingRow[];
}

function getIssueUpdates(issueId: string): LecturerIssueUpdate[] {
  const database = getDatabase();
  return (
    database
      .prepare("SELECT status, note, at FROM issue_updates WHERE issue_id = ? ORDER BY at DESC")
      .all(issueId) as unknown as LecturerIssueUpdate[]
  );
}

function overlapExists(
  roomId: string,
  startAt: string,
  endAt: string,
  excludeId?: string,
  statuses: RequestStatus[] = ["APPROVED", "PENDING"],
): boolean {
  const database = getDatabase();
  const rows = database
    .prepare(
      `
        SELECT id, start_at, end_at, status
        FROM booking_requests
        WHERE room_id = ?
          AND status IN (${statuses.map(() => "?").join(", ")})
      `,
    )
    .all(roomId, ...statuses) as Array<{ id: string; start_at: string; end_at: string; status: RequestStatus }>;

  const nextStart = new Date(startAt).getTime();
  const nextEnd = new Date(endAt).getTime();
  return rows.some((row) => {
    if (excludeId && row.id === excludeId) {
      return false;
    }
    const rowStart = new Date(row.start_at).getTime();
    const rowEnd = new Date(row.end_at).getTime();
    return nextStart < rowEnd && rowStart < nextEnd;
  });
}

function assertValidBookingInput(input: BookingInput) {
  if (!input.roomId?.trim() || !input.moduleName?.trim() || !input.purpose?.trim()) {
    throw new Error("Room, module name, and purpose are required.");
  }
  if (!Number.isInteger(input.attendees) || input.attendees < 1) {
    throw new Error("Attendees must be a positive whole number.");
  }
  if (input.moduleName.trim().length > 100 || input.purpose.trim().length > 500) {
    throw new Error("Booking details exceed the maximum supported length.");
  }
  assertFutureBookingWindow(input.startAt, input.endAt);
}

function normalizeAdminRoomInput(input: Partial<CreateRoomInput>): CreateRoomInput {
  const name = typeof input.name === "string" ? input.name.trim() : "";
  if (!name) throw new Error("Room name is required.");
  if (name.length > 120) throw new Error("Room name exceeds the maximum supported length.");
  if (!Number.isInteger(input.capacity) || Number(input.capacity) < 1) throw new Error("Capacity must be a positive whole number.");
  if (!ROOM_TYPES.has(input.type as CreateRoomInput["type"])) throw new Error("Choose a valid room type.");
  if (!ROOM_STATUSES.has(input.status as CreateRoomInput["status"])) throw new Error("Choose a valid room status.");
  if (typeof input.hasProjector !== "boolean" || typeof input.hasAc !== "boolean") throw new Error("Room facilities must be true or false.");
  return { name, capacity: input.capacity as number, type: input.type as CreateRoomInput["type"],
    status: input.status as CreateRoomInput["status"], hasProjector: input.hasProjector, hasAc: input.hasAc };
}

export function listAdminRooms(filters?: RoomFilters): AdminRoom[] {
  const database = getDatabase();
  const rooms = database
    .prepare("SELECT * FROM rooms ORDER BY name ASC")
    .all() as RoomRow[];

  return rooms
    .map(mapRoomRow)
    .filter((room) => {
      if (filters?.status && filters.status !== "ALL" && room.status !== filters.status) {
        return false;
      }
      if (filters?.type && filters.type !== "ALL" && room.type !== filters.type) {
        return false;
      }
      if (filters?.search) {
        const query = filters.search.toLowerCase();
        return [room.name, room.roomNumber].some((value) => value.toLowerCase().includes(query));
      }
      return true;
    });
}

export function getAdminRoomById(id: string): AdminRoom | undefined {
  const row = getDatabase().prepare("SELECT * FROM rooms WHERE id = ?").get(id) as RoomRow | undefined;
  return row ? mapRoomRow(row) : undefined;
}

export function createAdminRoom(input: CreateRoomInput): AdminRoom {
  const database = getDatabase();
  const normalized = normalizeAdminRoomInput(input);
  database.exec("BEGIN IMMEDIATE");
  try {
    const id = `room-${randomUUID()}`;
    const now = new Date().toISOString();
    // Legacy storage columns are retained for existing databases only.
    database.prepare(`INSERT INTO rooms
      (id, code, name, building, floor, capacity, type, has_projector, has_ac, status, created_at, updated_at)
      VALUES (?, ?, ?, '', 0, ?, ?, ?, ?, ?, ?, ?)`)
      .run(id, id, normalized.name, normalized.capacity, normalized.type,
        Number(normalized.hasProjector), Number(normalized.hasAc), normalized.status, now, now);
    const created = database.prepare("SELECT * FROM rooms WHERE id = ?").get(id) as RoomRow;
    database.exec("COMMIT");
    return mapRoomRow(created);
  } catch (error) {
    database.exec("ROLLBACK");
    throw error;
  }
}

export function updateAdminRoom(id: string, patch: UpdateRoomInput): AdminRoom {
  const current = getAdminRoomById(id);
  if (!current) throw new Error("Room not found");
  const normalized = normalizeAdminRoomInput({ ...current, ...patch });
  const updated = { ...current, ...normalized, updatedAt: new Date().toISOString() };
  getDatabase().prepare(`UPDATE rooms SET name = ?, capacity = ?, type = ?, has_projector = ?,
    has_ac = ?, status = ?, updated_at = ? WHERE id = ?`)
    .run(updated.name, updated.capacity, updated.type, Number(updated.hasProjector),
      Number(updated.hasAc), updated.status, updated.updatedAt, id);
  return updated;
}

export function deleteAdminRoom(id: string): void {
  const result = getDatabase()
    .prepare("UPDATE rooms SET status = 'INACTIVE', updated_at = ? WHERE id = ?")
    .run(new Date().toISOString(), id);
  if (result.changes === 0) {
    throw new Error("Room not found");
  }
}

export function listAdminRequests(filters?: RequestFilters): BookingRequest[] {
  return listBookingRows("ORDER BY b.submitted_at DESC")
    .map(mapBookingRowToAdminRequest)
    .filter((request) => {
      if (filters?.status && filters.status !== "ALL" && request.status !== filters.status) {
        return false;
      }
      if (filters?.search) {
        const query = filters.search.toLowerCase();
        return [request.requesterName, request.department, request.purpose].some((value) =>
          value.toLowerCase().includes(query),
        );
      }
      return true;
    });
}

export function listAdminCalendarBookings(month: string): BookingRequest[] {
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(month) || Number(month.slice(0, 4)) < 2000 || Number(month.slice(0, 4)) > 2100) throw new Error("Choose a valid calendar month between 2000 and 2100.");
  const [year, number] = month.split("-").map(Number);
  const nextMonth = number === 12 ? `${year + 1}-01` : `${year}-${String(number + 1).padStart(2, "0")}`;
  const start = campusLocalDateTimeToIso(`${month}-01`, "00:00");
  const end = campusLocalDateTimeToIso(`${nextMonth}-01`, "00:00");
  return listBookingRows("WHERE b.start_at >= ? AND b.start_at < ? ORDER BY b.start_at, b.id", [start, end]).map(mapBookingRowToAdminRequest);
}

export function getAdminRequestById(id: string): BookingRequest | undefined {
  const row = listBookingRows("WHERE b.id = ?", [id])[0];
  return row ? mapBookingRowToAdminRequest(row) : undefined;
}

export async function decideAdminRequest(
  id: string,
  decision: "APPROVED" | "REJECTED",
  note?: string,
): Promise<BookingRequest> {
  if ((note?.trim().length ?? 0) > 500) {
    throw new Error("Review notes cannot exceed 500 characters.");
  }
  if (decision !== "APPROVED" && decision !== "REJECTED") {
    throw new Error("Choose approve or reject.");
  }
  const current = getAdminRequestById(id);
  if (!current) {
    throw new Error("Request not found");
  }
  if (current.status !== "PENDING") {
    throw new Error("Only pending requests can be reviewed");
  }
  if (decision === "REJECTED" && !note?.trim()) {
    throw new Error("Rejection note is required");
  }
  const database = getDatabase();
  const bookingRow = listBookingRows("WHERE b.id = ?", [id])[0];
  if (decision === "APPROVED" && overlapExists(bookingRow.room_id, bookingRow.start_at, bookingRow.end_at, id, ["APPROVED"])) {
    throw new Error("Time conflict with an existing approved booking");
  }
  const reviewedAt = new Date().toISOString();
  database
    .prepare(
      `
        UPDATE booking_requests
        SET status = ?, reviewer = ?, reviewer_note = ?, reviewed_at = ?
        WHERE id = ?
      `,
    )
    .run(decision, DEMO_ADMIN_NAME, note?.trim() || "Reviewed", reviewedAt, id);

  const updated = getAdminRequestById(id);
  if (!updated) {
    throw new Error("Request not found");
  }
  await sendAndArchiveNotification(
    database,
    updated.requesterEmail,
    buildBookingDecisionEmail({
      lecturerName: updated.requesterName,
      roomName: updated.roomName ?? updated.roomId,
      date: updated.date,
      startTime: updated.startTime,
      endTime: updated.endTime,
      purpose: updated.purpose,
      decision,
      note: note?.trim() || undefined,
    }),
  );
  return updated;
}

function minutes(value: string): number {
  const match = value.trim().match(/^([01]?\d|2[0-3]):([0-5]\d)$/);
  if (!match) return Number.NaN;
  return Number(match[1]) * 60 + Number(match[2]);
}

function timetableOverlapExists(roomNumber: string, startAt: string, endAt: string): boolean {
  const start = new Date(startAt);
  const end = new Date(endAt);
  const startCampus = getCampusWeekdayAndMinute(start);
  const endCampus = getCampusWeekdayAndMinute(end);
  if (startCampus.weekday !== endCampus.weekday) return true;
  const rows = getDatabase().prepare(
    "SELECT start_time, end_time FROM timetable_entries WHERE (lower(room_code) = lower(?) OR room_code IN (SELECT code FROM rooms WHERE lower(room_number) = lower(?))) AND day_of_week = ?",
  ).all(roomNumber, roomNumber, startCampus.weekday) as Array<{ start_time: string; end_time: string }>;
  return rows.some((row) => startCampus.minute < minutes(row.end_time) && minutes(row.start_time) < endCampus.minute);
}

export function listTimetableEntries(filters?: { department?: string; lecturer?: string }): TimetableEntry[] {
  const rows = getDatabase().prepare(`SELECT t.*,
    COALESCE(r.room_number, legacy.room_number, t.room_code) AS resolved_room_number,
    COALESCE(r.name, legacy.name, 'Unavailable room') AS resolved_room_name,
    COALESCE(l.name, t.lecturer_name) AS resolved_lecturer_name
    FROM timetable_entries t
    LEFT JOIN rooms r ON r.room_number = t.room_code
    LEFT JOIN rooms legacy ON r.id IS NULL AND lower(legacy.code) = lower(t.room_code)
    LEFT JOIN lecturer_accounts l ON l.id_number = t.lecturer_id
    ORDER BY day_of_week, start_time`).all() as Array<Record<string, string>>;
  return rows.map((row) => ({
    id: row.id, semester: row.semester, department: row.department, batch: row.batch || row.semester,
    lecturerName: row.resolved_lecturer_name, lecturerId: row.lecturer_id || "", dayOfWeek: row.day_of_week,
    startTime: row.start_time, endTime: row.end_time, moduleCode: row.module_code,
    roomNumber: row.resolved_room_number, roomName: row.resolved_room_name, uploadedAt: row.uploaded_at,
  })).filter((entry) => (!filters?.department || entry.department === filters.department)
    && (!filters?.lecturer || entry.lecturerId === filters.lecturer));
}

export function deleteTimetableEntries(scope: { department: string; batch: string; semester: string }): number {
  if (!scope.department || !scope.batch || !scope.semester) {
    throw new Error("Department, batch, and semester are required.");
  }
  const result = getDatabase().prepare(
    "DELETE FROM timetable_entries WHERE department = ? AND semester = ? AND (batch = ? OR batch = '')",
  ).run(scope.department, scope.semester, scope.batch);
  return Number(result.changes);
}

function assertTimetableRoom(roomNumber: string): void {
  if (!getDatabase().prepare("SELECT id FROM rooms WHERE room_number = ?").get(roomNumber)) {
    throw new Error(`Unknown room ID ${roomNumber}. Choose an existing R-### room ID.`);
  }
}

function timetableLecturerName(lecturerId: string): string {
  const lecturer = getDatabase().prepare("SELECT name FROM lecturer_accounts WHERE id_number = ?").get(lecturerId) as { name: string } | undefined;
  if (!/^(?!000)[0-9]{3}$/.test(lecturerId || "") || !lecturer) {
    throw new Error(`Unknown lecturer ID ${lecturerId || "(missing)"}. Use an assigned lecturer ID from Users.`);
  }
  return lecturer.name;
}

export function updateTimetableEntry(id: string, input: TimetableEntryInput): TimetableEntry {
  const existing = listTimetableEntries().find((entry) => entry.id === id);
  if (!existing) throw new Error("Scheduled lecture not found.");
  if (!input.department || !input.batch || !input.semester || !input.dayOfWeek || !input.moduleCode || !input.roomNumber
    || Number.isNaN(minutes(input.startTime)) || Number.isNaN(minutes(input.endTime))
    || minutes(input.endTime) <= minutes(input.startTime)) {
    throw new Error("Enter valid lecture details and ensure the end time is after the start time.");
  }
  assertTimetableRoom(input.roomNumber);
  const lecturerName = timetableLecturerName(input.lecturerId);
  const conflict = listTimetableEntries().find((entry) => entry.id !== id
    && entry.roomNumber.toLowerCase() === input.roomNumber.toLowerCase()
    && entry.dayOfWeek === input.dayOfWeek
    && minutes(input.startTime) < minutes(entry.endTime)
    && minutes(entry.startTime) < minutes(input.endTime));
  if (conflict) {
    throw new Error(`${input.roomNumber} already has ${conflict.moduleCode} on ${input.dayOfWeek} at ${conflict.startTime}.`);
  }
  getDatabase().prepare(`UPDATE timetable_entries SET
    semester = ?, department = ?, batch = ?, lecturer_name = ?, lecturer_id = ?, day_of_week = ?,
    start_time = ?, end_time = ?, module_code = ?, room_code = ? WHERE id = ?`).run(
    input.semester, input.department, input.batch, lecturerName, input.lecturerId,
    input.dayOfWeek, input.startTime, input.endTime, input.moduleCode, input.roomNumber, id,
  );
  return listTimetableEntries().find((entry) => entry.id === id)!;
}

export function deleteTimetableEntry(id: string): void {
  const result = getDatabase().prepare("DELETE FROM timetable_entries WHERE id = ?").run(id);
  if (!result.changes) throw new Error("Scheduled lecture not found.");
}

export function importTimetableEntries(entries: TimetableEntryInput[]): TimetableEntry[] {
  const database = getDatabase();
  const insert = database.prepare(`INSERT INTO timetable_entries
    (id, semester, department, batch, lecturer_name, lecturer_id, day_of_week, start_time, end_time, module_code, room_code, uploaded_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);
  const uploadedAt = new Date().toISOString();
  database.exec("BEGIN");
  try {
    const scope = entries[0];
    if (!scope?.department || !scope.batch || !scope.semester) {
      throw new Error("Department, batch, and semester are required.");
    }
    if (entries.some((entry) => entry.department !== scope.department
      || entry.batch !== scope.batch || entry.semester !== scope.semester)) {
      throw new Error("Every row in one upload must use the same department, batch, and semester.");
    }
    database.prepare(
      "DELETE FROM timetable_entries WHERE department = ? AND semester = ? AND (batch = ? OR batch = '')",
    ).run(scope.department, scope.semester, scope.batch);

    for (const entry of entries) {
      if (!entry.department || !entry.batch || !entry.dayOfWeek || !entry.moduleCode || !entry.roomNumber
        || Number.isNaN(minutes(entry.startTime)) || Number.isNaN(minutes(entry.endTime))
        || minutes(entry.endTime) <= minutes(entry.startTime)) throw new Error("Invalid timetable entry");
      assertTimetableRoom(entry.roomNumber);
      const lecturerName = timetableLecturerName(entry.lecturerId);
      const conflict = listTimetableEntries().find((existing) => existing.roomNumber.toLowerCase() === entry.roomNumber.toLowerCase()
        && existing.dayOfWeek === entry.dayOfWeek && minutes(entry.startTime) < minutes(existing.endTime)
        && minutes(existing.startTime) < minutes(entry.endTime));
      if (conflict) throw new Error(`${entry.roomNumber} already has ${conflict.moduleCode} on ${entry.dayOfWeek} at ${conflict.startTime}`);
      insert.run(`tt-${randomUUID()}`, entry.semester, entry.department, entry.batch, lecturerName, entry.lecturerId, entry.dayOfWeek,
        entry.startTime, entry.endTime, entry.moduleCode, entry.roomNumber, uploadedAt);
    }
    database.exec("COMMIT");
  } catch (error) { database.exec("ROLLBACK"); throw error; }
  return listTimetableEntries().filter((entry) => entry.uploadedAt === uploadedAt);
}

export function listLecturerTimetable(identity?: Partial<LecturerIdentity>): TimetableEntry[] {
  const lecturer = resolveLecturerIdentity(identity);
  return listTimetableEntries().filter((entry) =>
    entry.lecturerId === lecturer.idNumber);
}

export function createImportedAdminRequests(rows: ImportedRow[]): BookingRequest[] {
  const database = getDatabase();
  const insert = database.prepare(`
    INSERT INTO booking_requests (
      id, requester_name, requester_email, department, room_id, module_name, purpose, start_at, end_at, attendees,
      status, submitted_at, source
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const now = new Date().toISOString();
  const created: BookingRequest[] = [];
  for (const row of rows) {
    const id = `req-import-${randomUUID()}`;
    insert.run(
      id,
      row.requesterName,
      row.requesterEmail,
      row.department,
      row.roomId,
      null,
      row.purpose,
      campusLocalDateTimeToIso(row.date, row.startTime),
      campusLocalDateTimeToIso(row.date, row.endTime),
      row.attendees,
      "PENDING",
      now,
      "import",
    );
    const request = getAdminRequestById(id);
    if (request) {
      created.push(request);
    }
  }
  return created;
}

export function countAdminRequestsByStatus(status: RequestStatus): number {
  const row = getDatabase()
    .prepare("SELECT COUNT(*) as count FROM booking_requests WHERE status = ?")
    .get(status) as { count: number };
  return row.count;
}

export function listAdminIssues(filters?: IssueFilters): AdminIssue[] {
  const rows = getDatabase()
    .prepare(
      `
        SELECT i.*, r.name as room_name
        FROM issues i
        JOIN rooms r ON r.id = i.room_id
        ORDER BY i.reported_at DESC
      `,
    )
    .all() as IssueRow[];

  return rows
    .map(mapIssueRowToAdminIssue)
    .filter((issue) => {
      if (filters?.status && filters.status !== "ALL" && issue.status !== filters.status) {
        return false;
      }
      if (filters?.severity && filters.severity !== "ALL" && issue.severity !== filters.severity) {
        return false;
      }
      if (filters?.search) {
        const query = filters.search.toLowerCase();
        return [issue.title, issue.description, issue.roomId].some((value) => value.toLowerCase().includes(query));
      }
      return true;
    });
}

export function getAdminIssueById(id: string): AdminIssue | undefined {
  const row = getDatabase()
    .prepare(
      `
        SELECT i.*, r.name as room_name
        FROM issues i
        JOIN rooms r ON r.id = i.room_id
        WHERE i.id = ?
      `,
    )
    .get(id) as IssueRow | undefined;
  return row ? mapIssueRowToAdminIssue(row) : undefined;
}

export async function updateAdminIssueStatus(id: string, status: IssueStatus, note?: string): Promise<AdminIssue> {
  if ((note?.trim().length ?? 0) > 1_000) {
    throw new Error("Issue notes cannot exceed 1000 characters.");
  }
  if (!ADMIN_ISSUE_STATUSES.has(status)) {
    throw new Error("Choose a valid issue status.");
  }
  const current = getAdminIssueById(id);
  if (!current) {
    throw new Error("Issue not found");
  }
  const database = getDatabase();
  const resolvedAt = status === "RESOLVED" || status === "CLOSED" ? new Date().toISOString() : current.resolvedAt ?? null;
  const resolutionNote = note?.trim() || current.resolutionNote || null;
  database
    .prepare(
      `
        UPDATE issues
        SET status = ?, resolved_at = ?, resolution_note = ?
        WHERE id = ?
      `,
    )
    .run(status, resolvedAt, resolutionNote, id);
  database
    .prepare("INSERT INTO issue_updates (id, issue_id, status, note, at) VALUES (?, ?, ?, ?, ?)")
    .run(
      randomUUID(),
      id,
      status,
      note?.trim() || `Status updated to ${status.replace("_", " ").toLowerCase()}.`,
      new Date().toISOString(),
    );
  const updated = getAdminIssueById(id);
  if (!updated) {
    throw new Error("Issue not found");
  }
  const owner = database
    .prepare("SELECT reporter_email FROM issues WHERE id = ?")
    .get(id) as { reporter_email: string | null } | undefined;
  await sendAndArchiveNotification(
    database,
    owner?.reporter_email ?? findLecturerEmailByName(database, updated.reportedBy),
    buildIssueStatusEmail({
      lecturerName: updated.reportedBy,
      roomName: updated.roomName ?? updated.roomId,
      title: updated.title,
      status,
      note: note?.trim() || undefined,
    }),
  );
  return updated;
}

export function countAdminIssuesByStatus(status: IssueStatus): number {
  const row = getDatabase()
    .prepare("SELECT COUNT(*) as count FROM issues WHERE status = ?")
    .get(status) as { count: number };
  return row.count;
}

function validateLecturerAccountRequestInput(input: LecturerAccountRequestInput): LecturerAccountRequestInput {
  const normalized = {
    name: input.name?.trim(),
    department: input.department?.trim(),
    position: input.position?.trim(),
    gmail: normalizeEmail(input.gmail ?? ""),

  };
  if (!normalized.name || !normalized.department || !normalized.position || !normalized.gmail) {
    throw new Error("Please fill all required lecturer details.");
  }
  if (
    normalized.name.length > 120 ||
    normalized.department.length > 120 ||
    normalized.position.length > 80 ||
    normalized.gmail.length > 254
  ) {
    throw new Error("Lecturer account details exceed the maximum supported length.");
  }
  if (!/^[^\s@]+@gmail\.com$/i.test(normalized.gmail)) {
    throw new Error("Please enter a valid Gmail address.");
  }
  return normalized;
}

export function createLecturerAccountRequest(input: LecturerAccountRequestInput): LecturerAccountRequest {
  const database = getDatabase();
  const normalized = validateLecturerAccountRequestInput(input);
  database.exec("BEGIN IMMEDIATE");
  try {
    if (database.prepare("SELECT id FROM lecturer_accounts WHERE gmail = ?").get(normalized.gmail)) {
      throw new Error("A lecturer account already exists for this Gmail.");
    }
    if (database.prepare("SELECT id FROM lecturer_account_requests WHERE status = 'PENDING' AND gmail = ?").get(normalized.gmail)) {
      throw new Error("An account request is already waiting for admin review.");
    }
    const id = `acct-req-${randomUUID()}`;
    const idNumber = allocateLecturerId(database, id);
    database.prepare(`INSERT INTO lecturer_account_requests
      (id, name, department, position, gmail, id_number, status, submitted_at)
      VALUES (?, ?, ?, ?, ?, ?, 'PENDING', ?)`)
      .run(id, normalized.name, normalized.department, normalized.position, normalized.gmail, idNumber, new Date().toISOString());
    const created = database.prepare("SELECT * FROM lecturer_account_requests WHERE id = ?").get(id) as LecturerAccountRequestRow;
    database.exec("COMMIT");
    return mapLecturerAccountRequestRow(created);
  } catch (error) {
    database.exec("ROLLBACK");
    throw error;
  }
}

export function listLecturerAccountRequests(status?: LecturerAccountRequestStatus | "ALL"): LecturerAccountRequest[] {
  const rows =
    status && status !== "ALL"
      ? (getDatabase()
          .prepare("SELECT * FROM lecturer_account_requests WHERE status = ? ORDER BY submitted_at DESC")
          .all(status) as LecturerAccountRequestRow[])
      : (getDatabase()
          .prepare("SELECT * FROM lecturer_account_requests ORDER BY submitted_at DESC")
          .all() as LecturerAccountRequestRow[]);
  return rows.map(mapLecturerAccountRequestRow);
}

export async function decideLecturerAccountRequest(
  id: string,
  decision: "APPROVED" | "REJECTED",
  note?: string,
): Promise<LecturerAccountRequest> {
  if ((note?.trim().length ?? 0) > 500) {
    throw new Error("Review notes cannot exceed 500 characters.");
  }
  const database = getDatabase();
  const current = database
    .prepare("SELECT * FROM lecturer_account_requests WHERE id = ?")
    .get(id) as LecturerAccountRequestRow | undefined;
  if (!current) {
    throw new Error("Account request not found");
  }
  if (current.status !== "PENDING") {
    throw new Error("Only pending account requests can be reviewed");
  }
  if (decision === "REJECTED" && !note?.trim()) {
    throw new Error("Rejection note is required");
  }

  const reviewedAt = new Date().toISOString();
  let username: string | null = null;
  let reviewNote = note?.trim() || "Reviewed";
  if (decision === "APPROVED") {
    const duplicate = database
      .prepare("SELECT id FROM lecturer_accounts WHERE gmail = ? OR id_number = ?")
      .get(current.gmail, current.id_number) as { id: string } | undefined;
    if (duplicate) {
      throw new Error("A lecturer account already exists for this Gmail or ID number.");
    }
    username = uniqueUsername(database, current.name, current.id_number);
    const temporaryPassword = generateTemporaryPassword();
    const credentialsEmail = buildLecturerCredentialsEmail({
      recipient: current.gmail,
      lecturerName: current.name,
      username,
      temporaryPassword,
    });
    const mailResult = await sendLecturerCredentialsEmail({
      recipient: current.gmail,
      lecturerName: current.name,
      username,
      temporaryPassword,
    });
    if (process.env.NODE_ENV === "production" && !mailResult.sent) {
      throw new Error(
        "Unable to deliver lecturer credentials. Check the production SMTP configuration and try again.",
      );
    }
    database
      .prepare(
        `
          INSERT INTO lecturer_accounts (
            id, request_id, name, department, position, gmail, id_number, username, password_hash,
            must_change_password, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `,
      )
      .run(
        `lecturer-${randomUUID()}`,
        current.id,
        current.name,
        current.department,
        current.position,
        current.gmail,
        current.id_number,
        username,
        hashPassword(temporaryPassword),
        1,
        reviewedAt,
        reviewedAt,
      );
    insertEmail(
      database,
      current.gmail,
      credentialsEmail.subject,
      process.env.NODE_ENV === "production"
        ? "Lecturer credentials were delivered by email. The temporary password is not retained."
        : credentialsEmail.text,
    );
    reviewNote =
      note?.trim() ||
      (mailResult.sent
        ? "Account created and credentials sent to lecturer Gmail."
        : `Account created and credentials saved to email outbox. ${mailResult.skippedReason}`);
  } else {
    await sendAndArchiveNotification(
      database,
      current.gmail,
      buildLecturerAccountRejectedEmail({
        lecturerName: current.name,
        note: note?.trim() || undefined,
      }),
    );
  }

  database
    .prepare(
      `
        UPDATE lecturer_account_requests
        SET status = ?, reviewed_at = ?, reviewer = ?, reviewer_note = ?, generated_username = ?
        WHERE id = ?
      `,
    )
    .run(decision, reviewedAt, DEMO_ADMIN_NAME, reviewNote, username, id);
  const updated = database
    .prepare("SELECT * FROM lecturer_account_requests WHERE id = ?")
    .get(id) as LecturerAccountRequestRow;
  return mapLecturerAccountRequestRow(updated);
}

function lecturerAccountForCredentials(
  database: DatabaseSync,
  identifier: string,
  password: string,
): LecturerAccountRow {
  if (
    !identifier.trim() ||
    identifier.length > 254 ||
    !password ||
    password.length > 128
  ) {
    throw new Error("Invalid lecturer credentials.");
  }
  const normalized = normalizeEmail(identifier);
  const row = database
    .prepare("SELECT * FROM lecturer_accounts WHERE gmail = ? OR username = ?")
    .get(normalized, identifier.trim()) as LecturerAccountRow | undefined;
  if (
    !row ||
    (process.env.NODE_ENV === "production" && isSeededDemoLecturerAccount(row)) ||
    !verifyPassword(password, row.password_hash)
  ) {
    throw new Error("Invalid lecturer credentials.");
  }
  return row;
}

export function authenticateLecturerAccount(identifier: string, password: string): LecturerAccount {
  const database = getDatabase();
  const row = lecturerAccountForCredentials(database, identifier, password);
  return {
    ...mapLecturerAccountRow(row),
    sessionToken: createLecturerSession(database, row.id),
  };
}

export function revokeLecturerSession(sessionToken: string): void {
  const token = sessionToken?.trim();
  if (!token) throw new Error("Lecturer login required.");
  resolveLecturerIdentity({ sessionToken: token });
  getDatabase().prepare("DELETE FROM lecturer_sessions WHERE token = ?").run(token);
}

export function changeLecturerPassword(
  currentPassword: string,
  nextPassword: string,
  identity?: Partial<LecturerIdentity>,
): LecturerAccount {
  if (nextPassword.length < 8 || nextPassword.length > 128) {
    throw new Error("New password must contain between 8 and 128 characters.");
  }
  const database = getDatabase();
  const lecturer = resolveLecturerIdentity(identity);
  const account = lecturerAccountForCredentials(database, lecturer.email, currentPassword);
  const now = new Date().toISOString();
  database
    .prepare(
      "UPDATE lecturer_accounts SET password_hash = ?, must_change_password = 0, updated_at = ? WHERE id = ?",
    )
    .run(hashPassword(nextPassword), now, account.id);
  database
    .prepare("DELETE FROM lecturer_sessions WHERE lecturer_account_id = ? AND token <> ?")
    .run(account.id, lecturer.sessionToken);
  const row = database
    .prepare("SELECT * FROM lecturer_accounts WHERE id = ?")
    .get(account.id) as LecturerAccountRow;
  return mapLecturerAccountRow(row);
}

export function registerLecturerPushToken(input: {
  token: string;
  platform?: string;
  sessionToken: string;
}): void {
  const lecturerEmail = resolveLecturerIdentity({ sessionToken: input.sessionToken }).email;
  const token = input.token?.trim();
  const platform = input.platform?.trim() || "android";
  if (!token) throw new Error("Push token is required.");
  if (token.length > 4_096 || platform.length > 40) throw new Error("Push token details are invalid.");
  const database = getDatabase();
  const account = database
    .prepare("SELECT id FROM lecturer_accounts WHERE gmail = ?")
    .get(lecturerEmail) as { id: string } | undefined;
  if (!account) {
    throw new Error("Lecturer account not found.");
  }
  const existing = database
    .prepare("SELECT id FROM lecturer_push_tokens WHERE token = ?")
    .get(token) as { id: string } | undefined;
  const now = new Date().toISOString();
  if (existing) {
    database
      .prepare(
        "UPDATE lecturer_push_tokens SET lecturer_email = ?, platform = ?, updated_at = ? WHERE token = ?",
      )
      .run(lecturerEmail, platform, now, token);
    return;
  }
  database
    .prepare(
      "INSERT INTO lecturer_push_tokens (id, lecturer_email, token, platform, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)",
    )
    .run(`push-${randomUUID()}`, lecturerEmail, token, platform, now, now);
}

export function unregisterLecturerPushToken(input: {
  token: string;
  sessionToken: string;
}): void {
  const lecturerEmail = resolveLecturerIdentity({ sessionToken: input.sessionToken }).email;
  const token = input.token?.trim();
  if (!token || token.length > 4_096) {
    throw new Error("Push token is invalid.");
  }
  getDatabase()
    .prepare("DELETE FROM lecturer_push_tokens WHERE token = ? AND lecturer_email = ?")
    .run(token, lecturerEmail);
}

export function listLecturerRooms(identity?: Partial<LecturerIdentity>): LecturerRoom[] {
  resolveLecturerIdentity(identity);
  return listAdminRooms().map(adminRoomToLecturerRoom);
}

export function listAvailableLecturerRooms(
  startAt: string,
  endAt: string,
  identity?: Partial<LecturerIdentity>,
): LecturerRoom[] {
  return listLecturerRooms(identity).filter((room) => {
    const availability = checkLecturerRoomAvailability({ roomId: room.id, startAt, endAt });
    return availability.available && !availability.requiresApproval;
  });
}

export function getLecturerRoomById(
  id: string,
  identity?: Partial<LecturerIdentity>,
): LecturerRoom | undefined {
  resolveLecturerIdentity(identity);
  const room = getAdminRoomById(id);
  return room ? adminRoomToLecturerRoom(room) : undefined;
}

export function listLecturerBookings(identity?: Partial<LecturerIdentity>): LecturerBooking[] {
  const lecturer = resolveLecturerIdentity(identity);
  return listBookingRows(
    "WHERE b.requester_email = ? ORDER BY b.submitted_at DESC",
    [lecturer.email],
  ).map(mapBookingRowToLecturerBooking);
}

export function getLecturerBookingById(id: string, identity?: Partial<LecturerIdentity>): LecturerBooking | undefined {
  const lecturer = resolveLecturerIdentity(identity);
  const row = listBookingRows("WHERE b.id = ? AND b.requester_email = ?", [id, lecturer.email])[0];
  return row ? mapBookingRowToLecturerBooking(row) : undefined;
}

export function checkLecturerRoomAvailability(input: BookingAvailabilityInput): { available: boolean; requiresApproval?: boolean; message: string } {
  const room = getAdminRoomById(input.roomId);
  if (!room) {
    return { available: false, message: "Selected room not found." };
  }
  if (room.status !== "ACTIVE") {
    return { available: false, message: "Room is currently unavailable." };
  }
  try {
    assertValidBookingInput({
      roomId: input.roomId,
      moduleName: "Availability Check",
      startAt: input.startAt,
      endAt: input.endAt,
      purpose: "Availability Check",
      attendees: 1,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Choose valid start and end date/time.";
    return { available: false, message };
  }
  if (overlapExists(input.roomId, input.startAt, input.endAt, input.excludeBookingId)
      || timetableOverlapExists(room.roomNumber, input.startAt, input.endAt)) {
    return { available: true, requiresApproval: true, message: "This time overlaps an existing booking or semester lecture. You may submit it for admin approval." };
  }
  return { available: true, message: "Room is available for this period." };
}

export async function createLecturerBooking(input: BookingInput, identity?: Partial<LecturerIdentity>): Promise<LecturerBooking> {
  const lecturer = resolveLecturerIdentity(identity);
  assertValidBookingInput(input);
  const availability = checkLecturerRoomAvailability(input);
  if (!availability.available) {
    throw new Error(availability.message);
  }
  const room = getAdminRoomById(input.roomId);
  if (!room) {
    throw new Error("Selected room not found");
  }
  if (input.attendees > room.capacity) {
    throw new Error(`Attendance exceeds the ${room.capacity}-seat room capacity.`);
  }
  const id = `bk-${randomUUID()}`;
  const submittedAt = new Date().toISOString();
  getDatabase()
    .prepare(
      `
        INSERT INTO booking_requests (
          id, requester_name, requester_email, department, room_id, module_name, purpose, start_at, end_at, attendees,
          status, submitted_at, reviewer_note, source
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
    )
    .run(
      id,
      lecturer.name,
      lecturer.email,
      lecturer.department,
      input.roomId,
      input.moduleName.trim(),
      input.purpose.trim(),
      new Date(input.startAt).toISOString(),
      new Date(input.endAt).toISOString(),
      input.attendees,
      availability.requiresApproval ? "PENDING" : "APPROVED",
      submittedAt,
      availability.requiresApproval ? "Conflict detected; admin review required." : "Automatically approved because the room is available.",
      "lecturer",
    );
  const booking = getLecturerBookingById(id, lecturer);
  if (!booking) {
    throw new Error("Booking not found");
  }
  await sendAndArchiveNotification(
    getDatabase(),
    lecturer.email,
    buildBookingSubmittedEmail({
      lecturerName: booking.requesterName,
      roomName: booking.roomName,
      date: formatLocalDate(new Date(booking.startAt)),
      startTime: formatLocalTime(new Date(booking.startAt)),
      endTime: formatLocalTime(new Date(booking.endAt)),
      purpose: booking.purpose,
    }),
  );
  return booking;
}

export function updateLecturerBooking(id: string, input: BookingInput, identity?: Partial<LecturerIdentity>): LecturerBooking {
  const lecturer = resolveLecturerIdentity(identity);
  const current = getLecturerBookingById(id, lecturer);
  if (!current) {
    throw new Error("Booking not found");
  }
  if (current.status === "CANCELLED" || new Date(current.startAt) <= new Date()) {
    throw new Error("Started or cancelled bookings cannot be edited.");
  }
  assertValidBookingInput(input);
  const availability = checkLecturerRoomAvailability({ ...input, excludeBookingId: id });
  if (!availability.available) {
    throw new Error(availability.message);
  }
  const room = getAdminRoomById(input.roomId);
  if (!room) {
    throw new Error("Selected room not found");
  }
  if (input.attendees > room.capacity) {
    throw new Error(`Attendance exceeds the ${room.capacity}-seat room capacity.`);
  }
  getDatabase()
    .prepare(
      `
        UPDATE booking_requests
        SET room_id = ?, module_name = ?, purpose = ?, start_at = ?, end_at = ?, attendees = ?, status = ?, submitted_at = ?, reviewer_note = ?, reviewer = NULL, reviewed_at = NULL
        WHERE id = ? AND requester_email = ?
      `,
    )
    .run(
      input.roomId,
      input.moduleName.trim(),
      input.purpose.trim(),
      new Date(input.startAt).toISOString(),
      new Date(input.endAt).toISOString(),
      input.attendees,
      availability.requiresApproval ? "PENDING" : "APPROVED",
      new Date().toISOString(),
      availability.requiresApproval
        ? "Conflict detected; admin review required."
        : "Automatically approved because the room is available.",
      id,
      lecturer.email,
    );
  const booking = getLecturerBookingById(id, lecturer);
  if (!booking) {
    throw new Error("Booking not found");
  }
  return booking;
}

export function deleteLecturerBooking(id: string, identity?: Partial<LecturerIdentity>): void {
  const lecturer = resolveLecturerIdentity(identity);
  const result = getDatabase()
    .prepare(
      `UPDATE booking_requests
       SET status = 'CANCELLED', reviewer_note = 'Cancelled by lecturer.', reviewed_at = ?
       WHERE id = ? AND requester_email = ? AND end_at > ?`,
    )
    .run(new Date().toISOString(), id, lecturer.email, new Date().toISOString());
  if (result.changes === 0) {
    throw new Error("Booking not found or it can no longer be cancelled.");
  }
}

export function listLecturerIssues(identity?: Partial<LecturerIdentity>): LecturerIssue[] {
  const lecturer = resolveLecturerIdentity(identity);
  const rows = getDatabase()
    .prepare(
      `
        SELECT i.*, r.name as room_name
        FROM issues i
        JOIN rooms r ON r.id = i.room_id
        WHERE i.reporter_email = ?
        ORDER BY i.reported_at DESC
      `,
    )
    .all(lecturer.email) as IssueRow[];
  return rows.map((row) => mapIssueRowToLecturerIssue(row, getIssueUpdates(row.id)));
}

export function getLecturerIssueById(id: string, identity?: Partial<LecturerIdentity>): LecturerIssue | undefined {
  const lecturer = resolveLecturerIdentity(identity);
  const row = getDatabase()
    .prepare(
      `
        SELECT i.*, r.name as room_name
        FROM issues i
        JOIN rooms r ON r.id = i.room_id
        WHERE i.id = ? AND i.reporter_email = ?
      `,
    )
    .get(id, lecturer.email) as IssueRow | undefined;
  return row ? mapIssueRowToLecturerIssue(row, getIssueUpdates(id)) : undefined;
}

export async function createLecturerIssue(input: IssueInput, identity?: Partial<LecturerIdentity>): Promise<LecturerIssue> {
  const lecturer = resolveLecturerIdentity(identity);
  const title = typeof input.title === "string" ? input.title.trim() : "";
  const description = typeof input.description === "string" ? input.description.trim() : "";
  if (!title || !description) throw new Error("Issue title and description are required.");
  if (title.length > 120 || description.length > 2_000) {
    throw new Error("Issue details exceed the maximum supported length.");
  }
  if (!LECTURER_ISSUE_SEVERITIES.has(input.severity)) {
    throw new Error("Choose a valid issue severity.");
  }
  const room = getAdminRoomById(input.roomId);
  if (!room) {
    throw new Error("Room not found");
  }
  const id = `is-${randomUUID()}`;
  const createdAt = new Date().toISOString();
  getDatabase()
    .prepare(
      `
        INSERT INTO issues (
          id, room_id, title, description, severity, status, reported_by, reporter_email, reported_at, image_url
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
    )
    .run(id, input.roomId, title, description, input.severity, "OPEN", lecturer.name, lecturer.email, createdAt, input.imageUrl ?? null);
  getDatabase()
    .prepare("INSERT INTO issue_updates (id, issue_id, status, note, at) VALUES (?, ?, ?, ?, ?)")
    .run(randomUUID(), id, "OPEN", "Issue submitted from lecturer mobile app.", createdAt);
  const issue = getLecturerIssueById(id, lecturer);
  if (!issue) {
    throw new Error("Issue not found");
  }
  await sendAndArchiveNotification(
    getDatabase(),
    lecturer.email,
    buildIssueSubmittedEmail({
      lecturerName: lecturer.name,
      roomName: issue.roomName,
      title: issue.title,
    }),
  );
  return issue;
}

export function listAdminUsers(): AdminUser[] {
  return getDatabase().prepare(`
    SELECT id, name, gmail, department, position, id_number AS idNumber,
      username, created_at AS createdAt
    FROM lecturer_accounts ORDER BY created_at DESC, name ASC
  `).all() as unknown as AdminUser[];
}

export function deleteAdminUser(id: string): boolean {
  const database = getDatabase();
  database.exec("BEGIN IMMEDIATE");
  try {
    const account = database.prepare("SELECT gmail FROM lecturer_accounts WHERE id = ?").get(id) as { gmail: string } | undefined;
    if (!account) {
      database.exec("ROLLBACK");
      return false;
    }
    database.prepare("DELETE FROM lecturer_sessions WHERE lecturer_account_id = ?").run(id);
    database.prepare("DELETE FROM lecturer_push_tokens WHERE lecturer_email = ?").run(account.gmail);
    database.prepare("DELETE FROM lecturer_accounts WHERE id = ?").run(id);
    // Keep the development seed from recreating a deleted account on restart.
    if (account.gmail === DEMO_LECTURER_EMAIL) {
      database.exec("CREATE TABLE IF NOT EXISTS app_settings (key TEXT PRIMARY KEY, value TEXT NOT NULL)");
      database.prepare("INSERT OR REPLACE INTO app_settings (key, value) VALUES ('demo_account_deleted', 'true')").run();
    }
    database.exec("COMMIT");
    return true;
  } catch (error) {
    database.exec("ROLLBACK");
    throw error;
  }
}
