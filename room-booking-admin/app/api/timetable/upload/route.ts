import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import * as xlsx from "xlsx";

const TIMETABLES_FILE = path.join(process.cwd(), "lib", "data", "timetables.json");

interface BookingEntry {
  semester: string;
  day: string;
  timeslot: string;
  module: string;
  room: string;
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const semester = formData.get("semester") as string | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }
    if (!semester) {
      return NextResponse.json({ error: "No semester provided" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const workbook = xlsx.read(buffer, { type: "buffer" });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];

    // Read as 2D array
    const rows = xlsx.utils.sheet_to_json<string[]>(sheet, { header: 1, defval: "" });

    // Expect at least 15 rows and 7 columns
    if (rows.length < 15) {
      return NextResponse.json({ error: "File must contain at least 15 rows" }, { status: 400 });
    }

    const newBookings: BookingEntry[] = [];
    const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

    // Validate headers (Row 1)
    const headerRow = rows[0];
    if (headerRow.length < 7) {
       return NextResponse.json({ error: "File must contain at least 7 columns" }, { status: 400 });
    }
    
    // Process rows 2 to 15 (indices 1 to 14)
    for (let i = 1; i <= 14; i++) {
      const row = rows[i];
      const timeslot = row[0]?.trim();
      if (!timeslot) continue;

      for (let j = 1; j <= 6; j++) {
        const cellValue = row[j]?.trim();
        if (cellValue) {
          // Format expected: ModuleCode-RoomCode (e.g. EE6401-ECC)
          const parts = cellValue.split("-");
          if (parts.length >= 2) {
            const room = parts.pop()?.trim() || "";
            const module = parts.join("-").trim();
            if (module && room) {
              newBookings.push({
                semester,
                day: days[j - 1],
                timeslot,
                module,
                room,
              });
            }
          } else {
             // If no hyphen, we might assume it's just a module or something, but the requirement says "module code with room code like EE6401-ECC". 
             // We can skip or return error. Let's just push what we have as module, no room?
             // Better to skip or log. Let's assume it might not be a booking if format is wrong, or we treat it as module only.
             // We'll skip for now to be safe.
          }
        }
      }
    }

    // Load existing data
    let existingBookings: BookingEntry[] = [];
    try {
      const data = await fs.readFile(TIMETABLES_FILE, "utf-8");
      existingBookings = JSON.parse(data);
    } catch (err: any) {
      // If file doesn't exist, start with empty array
      if (err.code !== "ENOENT") {
        throw err;
      }
    }

    // Check for crashes
    for (const newBooking of newBookings) {
      // 1. Room Crash (Same Room, Same Time)
      const roomConflict = existingBookings.find(
        (b) =>
          b.day === newBooking.day &&
          b.timeslot === newBooking.timeslot &&
          b.room === newBooking.room
      );

      if (roomConflict) {
        return NextResponse.json(
          {
            error: `Room Crash detected! Room ${newBooking.room} is already booked on ${newBooking.day} at ${newBooking.timeslot} for module ${roomConflict.module} (Semester ${roomConflict.semester}).`,
          },
          { status: 400 }
        );
      }

      // 2. Semester Crash (Same Semester, Same Time)
      const semConflict = existingBookings.find(
        (b) =>
          b.day === newBooking.day &&
          b.timeslot === newBooking.timeslot &&
          b.semester === newBooking.semester
      );

      if (semConflict) {
        return NextResponse.json(
          {
            error: `Semester Crash detected! Semester ${newBooking.semester} already has module ${semConflict.module} scheduled on ${newBooking.day} at ${newBooking.timeslot}.`,
          },
          { status: 400 }
        );
      }
      
      // 3. Internal Room Crash (within the uploaded file)
      const internalRoomConflict = newBookings.find(
        (b) =>
          b !== newBooking &&
          b.day === newBooking.day &&
          b.timeslot === newBooking.timeslot &&
          b.room === newBooking.room
      );
      if (internalRoomConflict) {
        return NextResponse.json(
          {
            error: `Internal crash detected in uploaded file! Room ${newBooking.room} is booked multiple times on ${newBooking.day} at ${newBooking.timeslot}.`,
          },
          { status: 400 }
        );
      }
    }

    // Save data
    const updatedBookings = [...existingBookings, ...newBookings];
    await fs.writeFile(TIMETABLES_FILE, JSON.stringify(updatedBookings, null, 2));

    return NextResponse.json({ success: true, count: newBookings.length });
  } catch (error: any) {
    console.error("Error processing timetable upload:", error);
    return NextResponse.json({ error: error.message || "Failed to upload" }, { status: 500 });
  }
}
