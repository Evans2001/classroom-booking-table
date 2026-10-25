// @vitest-environment node
import { File } from "node:buffer";
import { read, utils, write } from "xlsx";
import { describe, expect, it } from "vitest";
import { readTimetableFile, TIMETABLE_HEADERS } from "@/lib/utils/timetable-file";
import { createTimetableTemplate } from "@/lib/utils/timetable-template";
import { parseTimetableCell } from "@/lib/utils/timetable-cell";

const asFile = (data: Uint8Array | string, name: string) => new File([data], name) as unknown as globalThis.File;

describe("timetable file reader", () => {
  it.each(["biff8", "xlsx"] as const)("reads %s and preserves empty cells and leading zeros", async (bookType) => {
    const workbook = utils.book_new();
    utils.book_append_sheet(workbook, utils.aoa_to_sheet([
      TIMETABLE_HEADERS,
      ["08:00-09:00", " CS6101/R-001/007 ", "", "CS6102/R-002/001"],
    ]), "Timetable");
    utils.book_append_sheet(workbook, utils.aoa_to_sheet([["Do not import this sheet"]]), "Instructions");
    const extension = bookType === "biff8" ? "XLS" : "XLSX";
    const data = new Uint8Array(write(workbook, { bookType, type: "array" }));
    const rows = await readTimetableFile(asFile(data, `timetable.${extension}`));
    expect(rows[0]).toEqual(TIMETABLE_HEADERS);
    expect(rows[1].slice(0, 4)).toEqual(["08:00-09:00", "CS6101/R-001/007", "", "CS6102/R-002/001"]);
    expect(rows).toHaveLength(2);
  });

  it("keeps CSV imports working", async () => {
    const csv = `${TIMETABLE_HEADERS.join(",")}\r\n08:00-09:00,CS6101/R-001/007,,,,,\r\n`;
    expect(await readTimetableFile(asFile(csv, "timetable.csv"))).toEqual([
      TIMETABLE_HEADERS, ["08:00-09:00", "CS6101/R-001/007", "", "", "", "", ""],
    ]);
  });

  it.each(["xls", "xlsx"])("explains unreadable .%s workbooks", async (extension) => {
    await expect(readTimetableFile(asFile("not an Excel file", `broken.${extension}`))).rejects.toThrow("valid, unprotected .xls or .xlsx");
  });

  it("rejects unsupported formats", async () => {
    await expect(readTimetableFile(asFile("", "timetable.pdf"))).rejects.toThrow("Choose an Excel");
  });

  it("generates a genuine .xls template that can be filled and imported", async () => {
    const data = createTimetableTemplate();
    expect([...data.slice(0, 8)]).toEqual([0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1]);
    const blankRows = await readTimetableFile(asFile(data, "timetable-template.xls"));
    expect(blankRows[0]).toEqual(TIMETABLE_HEADERS);
    expect(blankRows).toHaveLength(11);
    expect(blankRows[1]).toEqual(["08:00-09:00", "", "", "", "", "", ""]);
    expect(blankRows[10][0]).toBe("17:00-18:00");
    expect(blankRows.slice(1).every((row) => row.slice(1).every((cell) => cell === ""))).toBe(true);

    const workbook = read(data, { type: "array" });
    expect(workbook.SheetNames).toEqual(["Timetable", "Instructions"]);
    workbook.Sheets.Timetable.B2 = { t: "s", v: "CS6101/R-001/007" };
    const filled = new Uint8Array(write(workbook, { type: "array", bookType: "biff8" }));
    const filledRows = await readTimetableFile(asFile(filled, "filled.xls"));
    expect(parseTimetableCell(filledRows[1][1])).toEqual({ moduleCode: "CS6101", roomNumber: "R-001", lecturerId: "007" });
  });
});
