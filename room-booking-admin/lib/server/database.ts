import { mkdirSync } from "node:fs";
import path from "node:path";
import { randomBytes, randomUUID, scryptSync, timingSafeEqual } from "node:crypto";
import { DatabaseSync } from "node:sqlite";

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

const DB_DIRECTORY = path.join(process.cwd(), "data");
const DB_PATH = path.join(DB_DIRECTORY, "room-booking.sqlite");
const DEMO_LECTURER_NAME = "Demo Lecturer";
const DEMO_LECTURER_EMAIL = "lecturer@eng.ruh.ac.lk";
const DEMO_LECTURER_DEPARTMENT = "Computer Science";
const DEMO_ADMIN_NAME = "System Admin";
const BOOKING_MIN_DAYS_AHEAD = 7;

type LecturerRoomStatus = "AVAILABLE" | "LIMITED" | "UNAVAILABLE";
type LecturerIssueStatus = "OPEN" | "IN_PROGRESS" | "RESOLVED" | "CLOSED";
type LecturerIssueSeverity = "LOW" | "MEDIUM" | "HIGH";

interface LecturerRoom {
  id: string;
  code: string;
  name: string;
  building: string;
  floor: number;
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
  building: string;
  roomCode: string;
  moduleName: string;
  startAt: string;
  endAt: string;
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

export type LecturerAccountRequestStatus = "PENDING" | "APPROVED" | "REJECTED";

export interface LecturerAccountRequestInput {
  name: string;
  department: string;
  position: string;
  gmail: string;
  idNumber: string;
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
}

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

const seededRooms: CreateRoomInput[] = [
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

const seededRequests = [
  {
    id: "req-1",
    requesterName: "Namal Perera",
    requesterEmail: "namal.perera@university.edu",
    department: "Computer Science",
    roomCode: "LH-101",
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
    roomCode: "LH-101",
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
    roomCode: "LAB-204",
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
    roomCode: "MR-305",
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
    roomCode: "LH-101",
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
    roomCode: "MR-305",
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
    roomCode: "LAB-204",
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
    roomCode: "LH-101",
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
    roomCode: "LH-101",
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
    roomCode: "LAB-204",
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
    roomCode: "LH-202",
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
    roomCode: "LAB-111",
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
    roomCode: "LAB-204",
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
    roomCode: "LH-101",
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
    roomCode: "MR-305",
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

function getDatabase(): DatabaseSync {
  if (!globalThis.__roomBookingDatabase__) {
    mkdirSync(DB_DIRECTORY, { recursive: true });
    const database = new DatabaseSync(DB_PATH);
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

      CREATE TABLE IF NOT EXISTS email_outbox (
        id TEXT PRIMARY KEY,
        recipient TEXT NOT NULL,
        subject TEXT NOT NULL,
        body TEXT NOT NULL,
        created_at TEXT NOT NULL,
        sent_at TEXT NOT NULL
      );
    `);
    seedIfNeeded(database);
    ensureDefaultAccounts(database);
    globalThis.__roomBookingDatabase__ = database;
  }

  return globalThis.__roomBookingDatabase__;
}

function normalizeEmail(value: string): string {
  return value.trim().toLowerCase();
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

function ensureDefaultAccounts(database: DatabaseSync) {
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
    insertRequest.run(
      item.id,
      item.requesterName,
      item.requesterEmail,
      item.department,
      roomIdsByCode.get(item.roomCode),
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
    const roomId = roomIdsByCode.get(issue.roomCode);
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
    code: row.code,
    name: row.name,
    building: row.building,
    floor: row.floor,
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
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatLocalTime(date: Date): string {
  const hours = `${date.getHours()}`.padStart(2, "0");
  const minutes = `${date.getMinutes()}`.padStart(2, "0");
  return `${hours}:${minutes}`;
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
    code: room.code,
    name: room.name,
    building: room.building,
    floor: room.floor,
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
    building: row.building,
    roomCode: row.room_code,
    moduleName: row.module_name ?? "General Booking",
    startAt: row.start_at,
    endAt: row.end_at,
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

function listBookingRows(whereClause = "", params: unknown[] = []): BookingRow[] {
  const database = getDatabase();
  const query = `
    SELECT
      b.*,
      r.code as room_code,
      r.name as room_name,
      r.building as building
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
      .all(issueId) as LecturerIssueUpdate[]
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
  const startAt = new Date(input.startAt);
  const endAt = new Date(input.endAt);
  if (Number.isNaN(startAt.getTime()) || Number.isNaN(endAt.getTime())) {
    throw new Error("Choose valid start and end date/time.");
  }
  if (endAt <= startAt) {
    throw new Error("End date/time must be after start date/time.");
  }

  const minAllowed = new Date();
  minAllowed.setHours(0, 0, 0, 0);
  minAllowed.setDate(minAllowed.getDate() + BOOKING_MIN_DAYS_AHEAD);
  if (startAt < minAllowed) {
    throw new Error(`Bookings must be made at least ${BOOKING_MIN_DAYS_AHEAD} days in advance.`);
  }
}

export function getMinBookingDateTimeInputValue(): string {
  const min = new Date();
  min.setHours(0, 0, 0, 0);
  min.setDate(min.getDate() + BOOKING_MIN_DAYS_AHEAD);
  const year = min.getFullYear();
  const month = `${min.getMonth() + 1}`.padStart(2, "0");
  const day = `${min.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}T00:00`;
}

export function listAdminRooms(filters?: RoomFilters): AdminRoom[] {
  const rooms = getDatabase()
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
        return [room.name, room.code, room.building].some((value) => value.toLowerCase().includes(query));
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
  const room: AdminRoom = {
    id: `room-${randomUUID()}`,
    ...input,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  database
    .prepare(
      `
        INSERT INTO rooms (
          id, code, name, building, floor, capacity, type, has_projector, has_ac, status, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
    )
    .run(
      room.id,
      room.code,
      room.name,
      room.building,
      room.floor,
      room.capacity,
      room.type,
      room.hasProjector ? 1 : 0,
      room.hasAc ? 1 : 0,
      room.status,
      room.createdAt,
      room.updatedAt,
    );
  return room;
}

export function updateAdminRoom(id: string, patch: UpdateRoomInput): AdminRoom {
  const current = getAdminRoomById(id);
  if (!current) {
    throw new Error("Room not found");
  }
  const updated: AdminRoom = {
    ...current,
    ...patch,
    updatedAt: new Date().toISOString(),
  };
  getDatabase()
    .prepare(
      `
        UPDATE rooms
        SET code = ?, name = ?, building = ?, floor = ?, capacity = ?, type = ?, has_projector = ?, has_ac = ?, status = ?, updated_at = ?
        WHERE id = ?
      `,
    )
    .run(
      updated.code,
      updated.name,
      updated.building,
      updated.floor,
      updated.capacity,
      updated.type,
      updated.hasProjector ? 1 : 0,
      updated.hasAc ? 1 : 0,
      updated.status,
      updated.updatedAt,
      id,
    );
  return updated;
}

export function deleteAdminRoom(id: string): void {
  const result = getDatabase().prepare("DELETE FROM rooms WHERE id = ?").run(id);
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

export function getAdminRequestById(id: string): BookingRequest | undefined {
  const row = listBookingRows("WHERE b.id = ?", [id])[0];
  return row ? mapBookingRowToAdminRequest(row) : undefined;
}

export function decideAdminRequest(
  id: string,
  decision: "APPROVED" | "REJECTED",
  note?: string,
): BookingRequest {
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
  return updated;
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
      `${row.date}T${row.startTime}:00.000Z`,
      `${row.date}T${row.endTime}:00.000Z`,
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

export function updateAdminIssueStatus(id: string, status: IssueStatus, note?: string): AdminIssue {
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
    idNumber: input.idNumber?.trim(),
  };
  if (!normalized.name || !normalized.department || !normalized.position || !normalized.gmail || !normalized.idNumber) {
    throw new Error("Please fill all required lecturer details.");
  }
  if (!/^[^\s@]+@gmail\.com$/i.test(normalized.gmail)) {
    throw new Error("Please enter a valid Gmail address.");
  }
  return normalized;
}

export function createLecturerAccountRequest(input: LecturerAccountRequestInput): LecturerAccountRequest {
  const database = getDatabase();
  const normalized = validateLecturerAccountRequestInput(input);
  const existingAccount = database
    .prepare("SELECT id FROM lecturer_accounts WHERE gmail = ? OR id_number = ?")
    .get(normalized.gmail, normalized.idNumber) as { id: string } | undefined;
  if (existingAccount) {
    throw new Error("A lecturer account already exists for this Gmail or ID number.");
  }
  const existingPending = database
    .prepare(
      "SELECT id FROM lecturer_account_requests WHERE status = 'PENDING' AND (gmail = ? OR id_number = ?)",
    )
    .get(normalized.gmail, normalized.idNumber) as { id: string } | undefined;
  if (existingPending) {
    throw new Error("An account request is already waiting for admin review.");
  }

  const id = `acct-req-${randomUUID()}`;
  const submittedAt = new Date().toISOString();
  database
    .prepare(
      `
        INSERT INTO lecturer_account_requests (
          id, name, department, position, gmail, id_number, status, submitted_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `,
    )
    .run(
      id,
      normalized.name,
      normalized.department,
      normalized.position,
      normalized.gmail,
      normalized.idNumber,
      "PENDING",
      submittedAt,
    );
  const created = database
    .prepare("SELECT * FROM lecturer_account_requests WHERE id = ?")
    .get(id) as LecturerAccountRequestRow;
  return mapLecturerAccountRequestRow(created);
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

export function decideLecturerAccountRequest(
  id: string,
  decision: "APPROVED" | "REJECTED",
  note?: string,
): LecturerAccountRequest {
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
      "Your classroom booking lecturer account",
      `Hello ${current.name},\n\nYour lecturer account has been created.\n\nUsername: ${username}\nTemporary password: ${temporaryPassword}\n\nPlease sign in and change your password immediately.`,
    );
    reviewNote = note?.trim() || "Account created and credentials sent to lecturer Gmail.";
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

export function authenticateLecturerAccount(identifier: string, password: string): LecturerAccount {
  const normalized = normalizeEmail(identifier);
  const row = getDatabase()
    .prepare("SELECT * FROM lecturer_accounts WHERE gmail = ? OR username = ?")
    .get(normalized, identifier.trim()) as LecturerAccountRow | undefined;
  if (!row || !verifyPassword(password, row.password_hash)) {
    throw new Error("Invalid lecturer credentials.");
  }
  return mapLecturerAccountRow(row);
}

export function changeLecturerPassword(identifier: string, currentPassword: string, nextPassword: string): LecturerAccount {
  if (nextPassword.length < 8) {
    throw new Error("New password must be at least 8 characters.");
  }
  const account = authenticateLecturerAccount(identifier, currentPassword);
  const now = new Date().toISOString();
  getDatabase()
    .prepare(
      "UPDATE lecturer_accounts SET password_hash = ?, must_change_password = 0, updated_at = ? WHERE id = ?",
    )
    .run(hashPassword(nextPassword), now, account.id);
  const row = getDatabase()
    .prepare("SELECT * FROM lecturer_accounts WHERE id = ?")
    .get(account.id) as LecturerAccountRow;
  return mapLecturerAccountRow(row);
}

export function listLecturerRooms(): LecturerRoom[] {
  return listAdminRooms().map(adminRoomToLecturerRoom);
}

export function getLecturerRoomById(id: string): LecturerRoom | undefined {
  const room = getAdminRoomById(id);
  return room ? adminRoomToLecturerRoom(room) : undefined;
}

export function listLecturerBookings(): LecturerBooking[] {
  return listBookingRows(
    "WHERE b.requester_email = ? ORDER BY b.submitted_at DESC",
    [DEMO_LECTURER_EMAIL],
  ).map(mapBookingRowToLecturerBooking);
}

export function getLecturerBookingById(id: string): LecturerBooking | undefined {
  const row = listBookingRows("WHERE b.id = ? AND b.requester_email = ?", [id, DEMO_LECTURER_EMAIL])[0];
  return row ? mapBookingRowToLecturerBooking(row) : undefined;
}

export function checkLecturerRoomAvailability(input: BookingAvailabilityInput): { available: boolean; message: string } {
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
  if (overlapExists(input.roomId, input.startAt, input.endAt, input.excludeBookingId)) {
    return { available: false, message: "Room is not available for the selected period." };
  }
  return { available: true, message: "Room is available for this period." };
}

export function createLecturerBooking(input: BookingInput): LecturerBooking {
  assertValidBookingInput(input);
  const availability = checkLecturerRoomAvailability(input);
  if (!availability.available) {
    throw new Error(availability.message);
  }
  const room = getAdminRoomById(input.roomId);
  if (!room) {
    throw new Error("Selected room not found");
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
      DEMO_LECTURER_NAME,
      DEMO_LECTURER_EMAIL,
      DEMO_LECTURER_DEPARTMENT,
      input.roomId,
      input.moduleName,
      input.purpose,
      new Date(input.startAt).toISOString(),
      new Date(input.endAt).toISOString(),
      input.attendees,
      "PENDING",
      submittedAt,
      null,
      "lecturer",
    );
  const booking = getLecturerBookingById(id);
  if (!booking) {
    throw new Error("Booking not found");
  }
  return booking;
}

export function updateLecturerBooking(id: string, input: BookingInput): LecturerBooking {
  const current = getLecturerBookingById(id);
  if (!current) {
    throw new Error("Booking not found");
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
  getDatabase()
    .prepare(
      `
        UPDATE booking_requests
        SET room_id = ?, module_name = ?, purpose = ?, start_at = ?, end_at = ?, attendees = ?, status = ?, submitted_at = ?, reviewer_note = NULL, reviewer = NULL, reviewed_at = NULL
        WHERE id = ? AND requester_email = ?
      `,
    )
    .run(
      input.roomId,
      input.moduleName,
      input.purpose,
      new Date(input.startAt).toISOString(),
      new Date(input.endAt).toISOString(),
      input.attendees,
      "PENDING",
      new Date().toISOString(),
      id,
      DEMO_LECTURER_EMAIL,
    );
  const booking = getLecturerBookingById(id);
  if (!booking) {
    throw new Error("Booking not found");
  }
  return booking;
}

export function deleteLecturerBooking(id: string): void {
  const result = getDatabase()
    .prepare("DELETE FROM booking_requests WHERE id = ? AND requester_email = ?")
    .run(id, DEMO_LECTURER_EMAIL);
  if (result.changes === 0) {
    throw new Error("Booking not found");
  }
}

export function listLecturerIssues(): LecturerIssue[] {
  const rows = getDatabase()
    .prepare(
      `
        SELECT i.*, r.name as room_name
        FROM issues i
        JOIN rooms r ON r.id = i.room_id
        WHERE i.reported_by = ?
        ORDER BY i.reported_at DESC
      `,
    )
    .all(DEMO_LECTURER_NAME) as IssueRow[];
  return rows.map((row) => mapIssueRowToLecturerIssue(row, getIssueUpdates(row.id)));
}

export function getLecturerIssueById(id: string): LecturerIssue | undefined {
  const row = getDatabase()
    .prepare(
      `
        SELECT i.*, r.name as room_name
        FROM issues i
        JOIN rooms r ON r.id = i.room_id
        WHERE i.id = ? AND i.reported_by = ?
      `,
    )
    .get(id, DEMO_LECTURER_NAME) as IssueRow | undefined;
  return row ? mapIssueRowToLecturerIssue(row, getIssueUpdates(id)) : undefined;
}

export function createLecturerIssue(input: IssueInput): LecturerIssue {
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
          id, room_id, title, description, severity, status, reported_by, reported_at, image_url
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
    )
    .run(id, input.roomId, input.title, input.description, input.severity, "OPEN", DEMO_LECTURER_NAME, createdAt, input.imageUrl ?? null);
  getDatabase()
    .prepare("INSERT INTO issue_updates (id, issue_id, status, note, at) VALUES (?, ?, ?, ?, ?)")
    .run(randomUUID(), id, "OPEN", "Issue submitted from lecturer mobile app.", createdAt);
  const issue = getLecturerIssueById(id);
  if (!issue) {
    throw new Error("Issue not found");
  }
  return issue;
}
