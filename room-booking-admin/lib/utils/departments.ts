export const DEPARTMENTS = [
  { name: "Electrical and Information Engineering", prefix: "EIE" },
  { name: "Civil Engineering", prefix: "CE" },
  { name: "Mechanical and Manufacturing Engineering", prefix: "MME" },
  { name: "Marine and Naval Architecture", prefix: "MNAE" },
] as const;

export function departmentPrefix(department: string): string {
  const match = DEPARTMENTS.find((item) => item.name === department);
  if (!match) throw new Error("Please select one of the four main departments.");
  return match.prefix;
}

export function isLecturerId(value: string): boolean {
  return /^(?:EIE|CE|MME|MNAE|ME|CS)?(?!000)[0-9]{3}$/.test(value);
}
