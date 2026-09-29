import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";

const output = path.join(process.cwd(), "sample-timetables");
const departments = [
  { slug: "electrical-information", code: "EE", name: "Electrical and Information Engineering" },
  { slug: "civil", code: "CE", name: "Civil Engineering" },
  { slug: "mechanical", code: "ME", name: "Mechanical Engineering" },
  { slug: "computer-science", code: "CS", name: "Computer Science" },
];
const database = new DatabaseSync(process.env.ROOM_BOOKING_DB_PATH || path.join(process.cwd(), "data", "room-booking.sqlite"), { readOnly: true });
const rooms = database.prepare("SELECT room_number FROM rooms WHERE status = 'ACTIVE' ORDER BY room_number").all().map((room) => room.room_number);
const lecturerIds = database.prepare("SELECT id_number FROM lecturer_accounts ORDER BY id_number").all().map((lecturer) => lecturer.id_number);
database.close();
if (!rooms.length || !lecturerIds.length) throw new Error("Create rooms and approve lecturer accounts before generating timetable examples.");
const times = ["08:00-09:00", "09:00-10:00", "10:00-11:00", "11:00-12:00", "13:00-14:00", "14:00-15:00"];

mkdirSync(output, { recursive: true });
let roomIndex = 0;
for (const department of departments) {
  for (let year = 1; year <= 4; year++) {
    const room = rooms[roomIndex++ % rooms.length];
    const rows = ["Time,Monday,Tuesday,Wednesday,Thursday,Friday,Saturday"];
    times.forEach((time, index) => {
      const cells = Array(6).fill("");
      // Shift the day when a room is reused by another sample schedule.
      const day = (index + Math.floor((roomIndex - 1) / rooms.length)) % 5;
      const moduleCode = `${department.code}${year}${String(index + 1).padStart(2, "0")}`;
      cells[day] = `${moduleCode}/${room}/${lecturerIds[(roomIndex - 1) % lecturerIds.length]}`;
      rows.push(`${time},${cells.join(",")}`);
    });
    const filename = `${department.slug}-year-${year}`;
    const contents = `${rows.join("\n")}\n`;
    try {
      writeFileSync(path.join(output, `${filename}.csv`), contents);
    } catch (error) {
      if (error.code !== "EBUSY") throw error;
      const alternate = path.join(output, `${filename}-room-ids.csv`);
      writeFileSync(alternate, contents);
      console.warn(`Original CSV is open in another program. Updated sample saved to ${alternate}`);
    }
  }
}
