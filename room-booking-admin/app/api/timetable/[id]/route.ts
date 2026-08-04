import { errorResponse, json } from "@/lib/server/api";
import { deleteTimetableEntry, updateTimetableEntry, type TimetableEntryInput } from "@/lib/server/database";

export async function PUT(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const input = await request.json() as TimetableEntryInput;
    return json(updateTimetableEntry(id, input));
  } catch (error) {
    return errorResponse(error);
  }
}

export async function DELETE(_request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    deleteTimetableEntry(id);
    return json({ success: true });
  } catch (error) {
    return errorResponse(error);
  }
}
