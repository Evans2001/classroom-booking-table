export interface LecturerAccountRequestInput {
  name: string;
  department: string;
  position: string;
  gmail: string;
  idNumber: string;
}

export interface LecturerAccountRequest {
  id: string;
  name: string;
  department: string;
  position: string;
  gmail: string;
  idNumber: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  submittedAt: string;
}

export interface LecturerAccount {
  id: string;
  name: string;
  department: string;
  position: string;
  gmail: string;
  idNumber: string;
  username: string;
  mustChangePassword: boolean;
}
