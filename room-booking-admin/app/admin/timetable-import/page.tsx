"use client";

import { useState, type FormEvent } from "react";

import { useToast } from "@/components/common/ToastProvider";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createImportedRequests, type ImportedRow } from "@/lib/services/requests.service";

interface ImportResult {
  validRows: number;
  invalidRows: number;
  errors: string[];
  createdRequests: number;
}

const CSV_HEADERS = [
  "requesterName",
  "requesterEmail",
  "department",
  "roomId",
  "purpose",
  "date",
  "startTime",
  "endTime",
  "attendees",
];

function parseCsvLine(line: string): string[] {
  return line.split(",").map((value) => value.trim());
}

export default function TimetableImportPage() {
  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const { showToast } = useToast();

  const handleImport = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!file) {
      showToast("No file selected", "Please choose a CSV file.", "error");
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
      if (!lines.length) {
        showToast("Empty file", "The file has no rows.", "error");
        return;
      }

      const headers = parseCsvLine(lines[0]);
      const headerMatches = CSV_HEADERS.every((header, index) => headers[index] === header);
      if (!headerMatches) {
        showToast("Invalid CSV headers", `Expected: ${CSV_HEADERS.join(", ")}`, "error");
        return;
      }

      const errors: string[] = [];
      const validRows: ImportedRow[] = [];

      lines.slice(1).forEach((line, index) => {
        const row = parseCsvLine(line);
        if (row.length !== CSV_HEADERS.length) {
          errors.push(`Row ${index + 2}: incorrect column count`);
          return;
        }
        const attendees = Number(row[8]);
        if (Number.isNaN(attendees) || attendees <= 0) {
          errors.push(`Row ${index + 2}: attendees must be a positive number`);
          return;
        }
        validRows.push({
          requesterName: row[0],
          requesterEmail: row[1],
          department: row[2],
          roomId: row[3],
          purpose: row[4],
          date: row[5],
          startTime: row[6],
          endTime: row[7],
          attendees,
        });
      });

      const created = validRows.length ? await createImportedRequests(validRows) : [];
      const nextResult = {
        validRows: validRows.length,
        invalidRows: errors.length,
        errors,
        createdRequests: created.length,
      };
      setResult(nextResult);
      if (nextResult.createdRequests > 0) {
        showToast("Import completed", `${nextResult.createdRequests} requests created.`, "success");
      } else {
        showToast("Import completed with no records", "Check row validation errors.", "info");
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Timetable CSV Import</CardTitle>
          <CardDescription>
            Upload a CSV file with booking rows. Only `.csv` files are accepted.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-3" onSubmit={handleImport}>
            <Input
              type="file"
              accept=".csv,text/csv"
              onChange={(event) => setFile(event.target.files?.[0] ?? null)}
            />
            <Button type="submit" disabled={submitting}>
              {submitting ? "Importing..." : "Import CSV"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {result ? (
        <Card>
          <CardHeader>
            <CardTitle>Import Result</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p>Valid rows: {result.validRows}</p>
            <p>Invalid rows: {result.invalidRows}</p>
            <p>Created requests: {result.createdRequests}</p>
            {result.errors.length ? (
              <ul className="list-disc space-y-1 pl-5 text-rose-700">
                {result.errors.map((error) => (
                  <li key={error}>{error}</li>
                ))}
              </ul>
            ) : null}
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
