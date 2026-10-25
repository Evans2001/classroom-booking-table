import { describe, expect, it } from "vitest";
import { parseTimetableCell } from "@/lib/utils/timetable-cell";
describe("timetable CSV identity cells", () => {
  it.each(["EIE001", "CE002", "MME003", "MNAE004", "ME003", "CS004"])("accepts department ID %s", (lecturerId) => {
    expect(parseTimetableCell(`CS6101/R-001/${lecturerId}`).lecturerId).toBe(lecturerId);
  });
  it.each(["EIE000", "CE000", "XX001", "EIE1"])("rejects invalid department ID %s", (lecturerId) => {
    expect(() => parseTimetableCell(`CS6101/R-001/${lecturerId}`)).toThrow("lecturer ID");
  });
  it("parses IDs as strings and keeps lecturer leading zeros", () => {
    expect(parseTimetableCell(" CS-6101 / R-001 / 007 ")).toEqual({ moduleCode: "CS-6101", roomNumber: "R-001", lecturerId: "007" });
  });
  it.each(["CS6101-R-001|Name|001", "CS6101/R-001", "CS6101/R-001/Name", "CS6101/R-001/000", "CS6101/R-1/001", "CS6101/R-001/001/extra"])("rejects malformed cell %s", (cell) => {
    expect(() => parseTimetableCell(cell)).toThrow("module code/room ID/lecturer ID");
  });
});
