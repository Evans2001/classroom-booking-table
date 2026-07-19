import { apiGet } from "@/lib/services/api-client";
import type { LecturerTimetableEntry } from "@/lib/types/timetable";
export function listMySemesterLectures() { return apiGet<LecturerTimetableEntry[]>("/api/lecturer/timetable"); }
