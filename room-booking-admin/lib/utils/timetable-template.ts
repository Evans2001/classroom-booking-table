import { utils, write } from "xlsx";
import { TIMETABLE_HEADERS } from "@/lib/utils/timetable-file";

export function createTimetableTemplate(): Uint8Array {
  const workbook = utils.book_new();
  const times = Array.from({ length: 10 }, (_, i) => {
    const start = String(i + 8).padStart(2, "0");
    const end = String(i + 9).padStart(2, "0");
    return [`${start}:00-${end}:00`, "", "", "", "", "", ""];
  });
  const timetable = utils.aoa_to_sheet([TIMETABLE_HEADERS, ...times]);
  timetable["!cols"] = [{ wch: 18 }, ...Array.from({ length: 6 }, () => ({ wch: 28 }))];
  timetable["!rows"] = Array.from({ length: 11 }, () => ({ hpt: 24 }));
  utils.book_append_sheet(workbook, timetable, "Timetable");

  const instructions = utils.aoa_to_sheet([
    ["How to fill your timetable"],
    ["1. Fill the Timetable sheet. Keep it as the first worksheet and keep its headers unchanged."],
    ["2. Edit or add time slots as needed, using 24-hour HH:MM-HH:MM text, for example 08:00-10:00."],
    ["3. In each occupied day/time cell, enter module code/room ID/lecturer ID."],
    ["Example only: CS6101/R-001/EIE001"],
    ["4. Use actual room IDs from Rooms and lecturer IDs from Users in the admin portal."],
    ["5. Keep IDs unchanged (e.g. R-001 and EIE001). Existing numeric lecturer IDs also work. Leave unoccupied cells empty."],
    ["6. For a lecture spanning several hours, use a single row with its full time range."],
    ["7. Do not merge cells. Enter one lecture per occupied cell."],
    ["8. Save as .xls or .xlsx. Select the batch, semester, and department on the import page, then upload."],
    ["Only the first worksheet is imported. These instructions are not imported."],
  ]);
  instructions["!cols"] = [{ wch: 120 }];
  utils.book_append_sheet(workbook, instructions, "Instructions");
  // BIFF8 produces a genuine Excel 97-2003 workbook matching the .xls extension.
  return new Uint8Array(write(workbook, { bookType: "biff8", type: "array" }));
}
