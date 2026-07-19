import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";

const output = path.join(process.cwd(), "sample-timetables");
const departments = [
  { slug: "electrical-information", code: "EE", name: "Electrical and Information Engineering", lecturers: ["Dr Silva", "Prof Perera"] },
  { slug: "civil", code: "CE", name: "Civil Engineering", lecturers: ["Dr Fernando", "Prof Kumari"] },
  { slug: "mechanical", code: "ME", name: "Mechanical Engineering", lecturers: ["Dr Jayasinghe", "Prof Nimal"] },
  { slug: "computer-science", code: "CS", name: "Computer Science", lecturers: ["Dr Abeysekara", "Prof Dias"] },
];
const rooms = ["AUDITORIUM", "LT1", "LT2", "NHL1", "NHL2", "NHL3", "NHL4", "LR1", "LR2", "EEC", "ELR", "NCC", "OCC", "DO1", "DO2", "LT1"];
const times = ["08:00-09:00", "09:00-10:00", "10:00-11:00", "11:00-12:00", "13:00-14:00", "14:00-15:00"];

mkdirSync(output, { recursive: true });
let roomIndex = 0;
for (const department of departments) {
  for (let year = 1; year <= 4; year++) {
    const room = rooms[roomIndex++];
    const rows = ["Time,Monday,Tuesday,Wednesday,Thursday,Friday,Saturday"];
    times.forEach((time, index) => {
      const cells = Array(6).fill("");
      // The final scope reuses LT1 because 16 schedules share 15 rooms; shift its days to avoid clashes.
      const day = (index + (roomIndex > 15 ? 1 : 0)) % 5;
      const module = `${department.code}${year}${String(index + 1).padStart(2, "0")}`;
      cells[day] = `${module}-${room}|${department.lecturers[index % department.lecturers.length]}`;
      rows.push(`${time},${cells.join(",")}`);
    });
    writeFileSync(path.join(output, `${department.slug}-year-${year}.csv`), `${rows.join("\n")}\n`);
  }
}
