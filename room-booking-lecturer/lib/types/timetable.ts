export interface LecturerTimetableEntry {
  id: string; semester: string; department: string; batch: string;
  lecturerName: string; lecturerId: string; dayOfWeek: string;
  startTime: string; endTime: string; moduleCode: string; roomCode: string;
}
