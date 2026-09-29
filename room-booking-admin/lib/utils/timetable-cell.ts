export function parseTimetableCell(value: string): { moduleCode: string; roomNumber: string; lecturerId: string } {
  const parts = value.split("/").map((part) => part.trim());
  if (parts.length !== 3 || !parts[0] || !/^R-[0-9]{3,}$/.test(parts[1]) || !/^(?!000)[0-9]{3}$/.test(parts[2])) {
    throw new Error("Use module code/room ID/lecturer ID, for example CS6101/R-001/001.");
  }
  return { moduleCode: parts[0], roomNumber: parts[1], lecturerId: parts[2] };
}
