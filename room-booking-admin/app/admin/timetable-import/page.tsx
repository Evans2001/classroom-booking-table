"use client";

import { useState, type FormEvent } from "react";

import { useToast } from "@/components/common/ToastProvider";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Label } from "@/components/ui/label";

interface TimetableRecord {
  semester: string;
  department: string;
  dayOfWeek: string;
  timeSlot: string;
  moduleCode: string;
  roomName: string;
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
  const [file, setFile] = useState<File | null>(null);
  
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const { showToast } = useToast();

  const handleImport = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!semester || !department || !file) {
      showToast("Missing information", "Please select a semester, department, and a CSV file.", "error");
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

        // Iterate through columns (days of the week)
        for (let col = 1; col <= 6; col++) {
          const cellValue = row[col];
          if (!cellValue) continue; // Skip empty cells

          const parts = cellValue.split("-");
          if (parts.length < 2) {
            errors.push(`Row ${rowIndex + 2}, ${EXPECTED_HEADERS[col]}: Cell "${cellValue}" does not match [Module Code]-[Room Name] format.`);
            continue;
          }

          const roomName = parts.pop()!.trim();
          const moduleCode = parts.join("-").trim();

          if (!moduleCode || !roomName) {
            errors.push(`Row ${rowIndex + 2}, ${EXPECTED_HEADERS[col]}: Cell "${cellValue}" has empty module or room.`);
            continue;
          }

          parsedRecords.push({
            semester,
            department,
            dayOfWeek: EXPECTED_HEADERS[col],
            timeSlot,
            moduleCode,
            roomName,
          });
        }
      });

      setResult({
        parsedRecords,
        errors,
      });

      if (parsedRecords.length > 0) {
        showToast("Import processed", `Successfully parsed ${parsedRecords.length} records.`, "success");
        // Log the normalized JSON array as requested by the instructions implicitly for verification
        console.log("Parsed Normalized JSON Records:", parsedRecords);
      } else if (errors.length > 0) {
        showToast("Import failed", "Check row validation errors.", "error");
      } else {
        showToast("Import empty", "No valid records found in the matrix.", "info");
      }
    } catch (err) {
      showToast("Error processing file", "An unexpected error occurred while parsing.", "error");
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const isFormValid = semester && department && file;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Timetable CSV Import</CardTitle>
          <CardDescription>
            Upload a weekly timetable matrix CSV. Columns must be: Time, Monday, Tuesday, Wednesday, Thursday, Friday, Saturday.
            Cells should contain [Module Code]-[Room Name] (e.g. EE6401-ECC).
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-5" onSubmit={handleImport}>
            <div className="space-y-4">
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
