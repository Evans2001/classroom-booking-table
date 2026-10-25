export const TIMETABLE_HEADERS = ["Time", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

/** Read all supported formats into the same grid used by timetable validation. */
export async function readTimetableFile(file: File): Promise<string[][]> {
  if (/\.xlsx?$/i.test(file.name)) {
    try {
      const { read, utils } = await import("xlsx");
      const data = await file.arrayBuffer();
      const signature = new Uint8Array(data, 0, Math.min(data.byteLength, 8));
      const isXls = [0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1].every((byte, i) => signature[i] === byte);
      const isXlsx = signature[0] === 0x50 && signature[1] === 0x4b;
      if (!isXls && !isXlsx) throw new Error("Invalid workbook");
      const workbook = read(data, { type: "array" });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      if (!sheet) throw new Error("Missing first worksheet");
      return utils.sheet_to_json<string[]>(sheet, { header: 1, defval: "", raw: false, blankrows: true })
        .map((row) => row.map((cell) => String(cell ?? "").trim()));
    } catch {
      throw new Error("Unable to read the Excel file. Choose a valid, unprotected .xls or .xlsx workbook with the timetable on its first worksheet.");
    }
  }
  if (/\.csv$/i.test(file.name)) {
    return (await file.text()).split(/\r?\n/)
      .map((line) => line.trim()).filter(Boolean)
      .map((line) => line.split(",").map((value) => value.trim().replace(/^"|"$/g, "")));
  }
  throw new Error("Choose an Excel (.xls or .xlsx) or CSV (.csv) file.");
}
