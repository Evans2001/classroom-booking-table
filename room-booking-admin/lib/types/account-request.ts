export type LecturerAccountRequestStatus = "PENDING" | "APPROVED" | "REJECTED";

export interface LecturerAccountRequest {
  id: string;
  name: string;
  department: string;
  position: string;
  gmail: string;
  idNumber: string;
  status: LecturerAccountRequestStatus;
  submittedAt: string;
  reviewedAt?: string;
  reviewer?: string;
  reviewerNote?: string;
  generatedUsername?: string;
}
