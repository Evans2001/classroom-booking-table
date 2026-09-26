import { errorResponse, json, requireAdminApiAuth } from "@/lib/server/api";
import { deleteTimetableEntries, importTimetableEntries, listTimetableEntries, type TimetableEntryInput } from "@/lib/server/database";

export function GET(request: Request) {
  const authError = requireAdminApiAuth(request);
  if (authError) return authError;

  const params = new URL(request.url).searchParams;
  return json(listTimetableEntries({
    department: params.get("department") || undefined,
    lecturer: params.get("lecturer") || undefined,
  }));
}

export async function POST(request: Request) {
  const authError = requireAdminApiAuth(request);
  if (authError) return authError;

  try {
    const body = await request.json() as { entries?: TimetableEntryInput[] };
    if (!body.entries?.length) throw new Error("No timetable entries were provided");
    const entries = importTimetableEntries(body.entries);
    return json({ success: true, count: entries.length, entries }, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}

export function DELETE(request: Request) {
  const authError = requireAdminApiAuth(request);
  if (authError) return authError;

  try {
    const params = new URL(request.url).searchParams;
    const deleted = deleteTimetableEntries({
      department: params.get("department") || "",
      batch: params.get("batch") || "",
      semester: params.get("semester") || "",
    });
    return json({ success: true, deleted });
  } catch (error) {
    return errorResponse(error);
  }
}
