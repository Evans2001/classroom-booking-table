"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";

import { useToast } from "@/components/common/ToastProvider";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Label } from "@/components/ui/label";

interface TimetableRecord {
  semester: string;
  department: string;
  batch: string;
  lecturerName: string;
  lecturerId: string;
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  moduleCode: string;
  roomCode: string;
}

interface ImportResult {
  parsedRecords: TimetableRecord[];
  errors: string[];
}

const EXPECTED_HEADERS = [
  "Time",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

const SEMESTER_OPTIONS = [
  { label: "Select Semester", value: "" },
  { label: "Semester 1", value: "Semester 1" },
  { label: "Semester 2", value: "Semester 2" },
  { label: "Semester 3", value: "Semester 3" },
  { label: "Semester 4", value: "Semester 4" },
  { label: "Semester 5", value: "Semester 5" },
  { label: "Semester 6", value: "Semester 6" },
  { label: "Semester 7", value: "Semester 7" },
  { label: "Semester 8", value: "Semester 8" },
];

const DEPARTMENT_OPTIONS = [
  { label: "Select Department", value: "" },
  { label: "Electrical and Information Engineering", value: "Electrical and Information Engineering" },
  { label: "Civil Engineering", value: "Civil Engineering" },
  { label: "Mechanical Engineering", value: "Mechanical Engineering" },
  { label: "Computer Science", value: "Computer Science" },
];

function parseCsvLine(line: string): string[] {
  // Simple CSV line parser ignoring potential quotes inside cells, as this is a simple matrix.
  return line.split(",").map((value) => value.trim().replace(/^"|"$/g, ''));
}

export default function TimetableImportPage() {
  const [semester, setSemester] = useState("");
  const [department, setDepartment] = useState("");
  const [batch, setBatch] = useState("");
  const [file, setFile] = useState<File | null>(null);
  
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [uploaded, setUploaded] = useState<TimetableRecord[]>([]);
  const { showToast } = useToast();

  const loadUploaded = async () => {
    const response = await fetch("/api/timetable/upload");
    if (response.ok) setUploaded(await response.json());
  };
  useEffect(() => { void loadUploaded(); }, []);
  const uploadedGroups = useMemo(() => {
    const groups = new Map<string, { department: string; batch: string; semester: string; count: number }>();
    for (const entry of uploaded) {
      const key = `${entry.department}|${entry.batch}|${entry.semester}`;
      const group = groups.get(key);
      if (group) group.count += 1;
      else groups.set(key, { department: entry.department, batch: entry.batch, semester: entry.semester, count: 1 });
    }
    return [...groups.values()];
  }, [uploaded]);

  const removeUpload = async (group: { department: string; batch: string; semester: string }) => {
    if (!window.confirm(`Remove the timetable for ${group.batch}, ${group.semester}?`)) return;
    const query = new URLSearchParams(group).toString();
    const response = await fetch(`/api/timetable/upload?${query}`, { method: "DELETE" });
    const payload = await response.json();
    if (!response.ok) { showToast("Removal failed", payload.error || "Unable to remove timetable.", "error"); return; }
    showToast("Timetable removed", `Removed ${payload.deleted} scheduled lectures.`, "success");
    await loadUploaded();
  };

  const handleImport = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!semester || !department || !batch.trim() || !file) {
      showToast("Missing information", "Please select a semester and department, enter the batch, and choose a CSV file.", "error");
      return;
    }
    if (!file.name.toLowerCase().endsWith(".csv")) {
      showToast("Invalid file type", "Only CSV files are supported.", "error");
      return;
    }

    setSubmitting(true);
    try {
      const raw = await file.text();
      const lines = raw
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter(Boolean);
        
      if (lines.length < 2) {
        showToast("Invalid file", "The file must contain headers and at least one data row.", "error");
        return;
      }

      const headers = parseCsvLine(lines[0]);
      const headerMatches = EXPECTED_HEADERS.every((h, i) => headers[i]?.toLowerCase() === h.toLowerCase());
      
      if (!headerMatches) {
        showToast("Invalid CSV headers", `Expected: ${EXPECTED_HEADERS.join(", ")}`, "error");
        return;
      }

      const errors: string[] = [];
      const parsedRecords: TimetableRecord[] = [];

      // Iterate through rows
      lines.slice(1).forEach((line, rowIndex) => {
        const row = parseCsvLine(line);
        const timeSlot = row[0];
        
        if (!timeSlot) return; // Skip empty rows
        const [startTime, endTime] = timeSlot.split(/\s*[-–]\s*/);
        if (!startTime || !endTime || !/^\d{1,2}:\d{2}$/.test(startTime) || !/^\d{1,2}:\d{2}$/.test(endTime)) {
          errors.push(`Row ${rowIndex + 2}: Time must use HH:MM-HH:MM format.`);
          return;
        }

        // Iterate through columns (days of the week)
        for (let col = 1; col <= 6; col++) {
          const cellValue = row[col];
          if (!cellValue) continue; // Skip empty cells

          const [lecturePart, lecturerPart, lecturerIdPart] = cellValue.split("|").map((part) => part.trim());
          const separator = lecturePart.indexOf("-");
          if (separator < 1 || separator === lecturePart.length - 1) {
            errors.push(`Row ${rowIndex + 2}, ${EXPECTED_HEADERS[col]}: Cell "${cellValue}" does not match [Module Code]-[Room Code] format.`);
            continue;
          }

          const moduleCode = lecturePart.slice(0, separator).trim();
          const roomCode = lecturePart.slice(separator + 1).trim();

          if (!moduleCode || !roomCode) {
            errors.push(`Row ${rowIndex + 2}, ${EXPECTED_HEADERS[col]}: Cell "${cellValue}" has an empty module or room code.`);
            continue;
          }

          parsedRecords.push({
            semester,
            department,
            batch: batch.trim(),
            lecturerName: lecturerPart || "Unassigned",
            lecturerId: lecturerIdPart || "",
            dayOfWeek: EXPECTED_HEADERS[col],
            startTime,
            endTime,
            moduleCode,
            roomCode,
          });
        }
      });

      setResult({
        parsedRecords,
        errors,
      });

      if (parsedRecords.length > 0) {
        if (errors.length) {
          showToast("Validation failed", "Fix all CSV errors before importing.", "error");
          return;
        }
        const response = await fetch("/api/timetable/upload", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ entries: parsedRecords }),
        });
        const payload = await response.json();
        if (!response.ok) throw new Error(payload.error || "Import failed");
        showToast("Timetable imported", `Saved ${payload.count} scheduled lectures.`, "success");
        await loadUploaded();
      } else if (errors.length > 0) {
        showToast("Import failed", "Check row validation errors.", "error");
      } else {
        showToast("Import empty", "No valid records found in the matrix.", "info");
      }
    } catch (err) {
      showToast("Import failed", err instanceof Error ? err.message : "An unexpected error occurred.", "error");
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const isFormValid = semester && department && batch.trim() && file;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Timetable CSV Import</CardTitle>
          <CardDescription>
            Upload a weekly timetable matrix CSV. Columns must be: Time, Monday, Tuesday, Wednesday, Thursday, Friday, Saturday.
            Cells may contain [Module Code]-[Room Code]|[Lecturer]|[Lecturer ID] (e.g. CS6101-LH-101|Dr Silva|LEC001).
            The lecturer part is optional and can differ for every cell.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-5" onSubmit={handleImport}>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="batch">Batch</Label>
                <Input id="batch" value={batch} onChange={(e) => setBatch(e.target.value)} placeholder="For example: 2023 Intake" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="semester">Semester</Label>
                <Select
                  id="semester"
                  value={semester}
                  onChange={(e) => setSemester(e.target.value)}
                  options={SEMESTER_OPTIONS}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="department">Department</Label>
                <Select
                  id="department"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  options={DEPARTMENT_OPTIONS}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="file">CSV File</Label>
                <Input
                  id="file"
                  type="file"
                  accept=".csv,text/csv"
                  className="file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-slate-50 file:text-[#5E2726] hover:file:bg-slate-100 cursor-pointer"
                  onChange={(event) => setFile(event.target.files?.[0] ?? null)}
                />
              </div>
            </div>

            <button 
              type="submit" 
              disabled={!isFormValid || submitting}
              className="bg-[#5E2726] text-white hover:bg-[#7a3332] rounded-xl px-6 py-2.5 shadow-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? "Processing..." : "Import Timetable"}
            </button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Uploaded timetables</CardTitle><CardDescription>Remove a complete timetable upload by department, batch, and semester.</CardDescription></CardHeader>
        <CardContent className="space-y-3">
          {uploadedGroups.length ? uploadedGroups.map((group) => <div key={`${group.department}-${group.batch}-${group.semester}`} className="flex flex-col gap-3 rounded-lg border border-slate-200 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div><p className="font-semibold text-slate-900">{group.department} · {group.batch}</p><p className="text-sm text-slate-500">{group.semester} · {group.count} lectures</p></div>
            <button type="button" onClick={() => void removeUpload(group)} className="rounded-lg border border-rose-300 px-3 py-2 text-sm font-medium text-rose-700 hover:bg-rose-50">Remove</button>
          </div>) : <p className="text-sm text-slate-500">No timetables have been uploaded.</p>}
        </CardContent>
      </Card>

      {result ? (
        <Card>
          <CardHeader>
            <CardTitle>Processing Result</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-md bg-slate-50 p-4 border border-slate-200">
                <p className="text-slate-500 font-medium mb-1">Parsed Records</p>
                <p className="text-2xl font-semibold text-slate-900">{result.parsedRecords.length}</p>
              </div>
              <div className="rounded-md bg-slate-50 p-4 border border-slate-200">
                <p className="text-slate-500 font-medium mb-1">Validation Errors</p>
                <p className={`text-2xl font-semibold ${result.errors.length ? 'text-rose-600' : 'text-slate-900'}`}>
                  {result.errors.length}
                </p>
              </div>
            </div>
            
            {result.errors.length > 0 && (
              <div className="mt-4">
                <h4 className="font-semibold text-rose-700 mb-2">Errors:</h4>
                <ul className="list-disc space-y-1 pl-5 text-rose-700">
                  {result.errors.map((error, idx) => (
                    <li key={idx}>{error}</li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
