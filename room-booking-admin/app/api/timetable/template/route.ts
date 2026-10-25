import { requireAdminApiAuth } from "@/lib/server/api";
import { createTimetableTemplate } from "@/lib/utils/timetable-template";

export function GET(request: Request) {
  const authError = requireAdminApiAuth(request);
  if (authError) return authError;

  return new Response(new Uint8Array(createTimetableTemplate()), {
    headers: {
      "Content-Type": "application/vnd.ms-excel",
      "Content-Disposition": 'attachment; filename="timetable-template.xls"',
      "Cache-Control": "no-store",
    },
  });
}
