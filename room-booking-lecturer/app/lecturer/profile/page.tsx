"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { Building, IdCard, KeyRound, Mail, ShieldCheck, User, UserRoundCog } from "lucide-react";

import { useToast } from "@/components/common/ToastProvider";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { changeLecturerPassword } from "@/lib/services/account.service";

export default function ProfilePage() {
  const searchParams = useSearchParams();
  const [identifier, setIdentifier] = useState("");
  const [name, setName] = useState("Lecturer");
  const [department, setDepartment] = useState("Faculty Department");
  const [position, setPosition] = useState("Lecturer");
  const [idNumber, setIdNumber] = useState("Verified during admin approval");
  const [currentPassword, setCurrentPassword] = useState("");
  const [nextPassword, setNextPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { showToast } = useToast();
  const mustChangePassword = searchParams.get("changePassword") === "1";

  useEffect(() => {
    setIdentifier(sessionStorage.getItem("lecturer_account_identifier") ?? "lecturer@eng.ruh.ac.lk");
    setName(sessionStorage.getItem("lecturer_account_name") ?? "Lecturer");
    setDepartment(sessionStorage.getItem("lecturer_account_department") ?? "Faculty Department");
    setPosition(sessionStorage.getItem("lecturer_account_position") ?? "Lecturer");
    setIdNumber(sessionStorage.getItem("lecturer_account_id_number") ?? "Verified during admin approval");
  }, []);

  const submitPassword = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    try {
      const account = await changeLecturerPassword(identifier, currentPassword, nextPassword);
      sessionStorage.setItem("lecturer_account_name", account.name);
      sessionStorage.setItem("lecturer_account_department", account.department);
      sessionStorage.setItem("lecturer_account_position", account.position);
      sessionStorage.setItem("lecturer_account_id_number", account.idNumber);
      setName(account.name);
      setDepartment(account.department);
      setPosition(account.position);
      setIdNumber(account.idNumber);
      showToast("Password changed", "You can use your new password next time you sign in.", "success");
      setCurrentPassword("");
      setNextPassword("");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to change password.";
      showToast("Password change failed", message, "error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 pb-24">
      <div className="relative flex flex-col items-center justify-center overflow-hidden rounded-3xl bg-brand-primary px-6 py-10 text-white shadow-xl shadow-brand-primary/20">
        <div className="relative z-10 flex flex-col items-center">
          <div className="mb-4 flex h-24 w-24 items-center justify-center rounded-full border-4 border-white/20 bg-white/10 text-4xl font-black backdrop-blur-sm shadow-inner">
            {name
              .split(" ")
              .map((part) => part[0])
              .join("")
              .slice(0, 2)
              .toUpperCase()}
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">{name}</h1>
          <div className="mt-1 flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1 text-xs font-semibold backdrop-blur-md">
            <ShieldCheck className="h-3.5 w-3.5" />
            Lecturer Account
          </div>
        </div>
      </div>

      <div>
        <h3 className="mb-3 text-sm font-bold uppercase tracking-wider text-slate-500">Personal Information</h3>
        <Card className="overflow-hidden border-slate-100 shadow-xl shadow-slate-200/50">
          <div className="divide-y divide-slate-100">
            <InfoRow icon={<User className="h-5 w-5" />} label="Full Name" value={name} />
            <InfoRow icon={<Mail className="h-5 w-5" />} label="Gmail / Username" value={identifier} />
            <InfoRow icon={<Building className="h-5 w-5" />} label="Department" value={department} />
            <InfoRow icon={<UserRoundCog className="h-5 w-5" />} label="Position" value={position} />
            <InfoRow icon={<IdCard className="h-5 w-5" />} label="ID Number" value={idNumber} />
          </div>
        </Card>
      </div>

      <div>
        <h3 className="mb-3 text-sm font-bold uppercase tracking-wider text-slate-500">Security</h3>
        <Card className="border-slate-100 p-4 shadow-xl shadow-slate-200/50">
          {mustChangePassword ? (
            <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm font-medium text-amber-800">
              Please change the temporary password sent to your Gmail.
            </div>
          ) : null}
          <form className="space-y-3" onSubmit={submitPassword}>
            <label className="block space-y-2">
              <span className="flex items-center gap-2 text-sm font-bold text-slate-700">
                <KeyRound className="h-4 w-4 text-brand-primary" />
                Current password
              </span>
              <Input
                type="password"
                value={currentPassword}
                onChange={(event) => setCurrentPassword(event.target.value)}
                required
              />
            </label>
            <label className="block space-y-2">
              <span className="text-sm font-bold text-slate-700">New password</span>
              <Input
                type="password"
                value={nextPassword}
                onChange={(event) => setNextPassword(event.target.value)}
                minLength={8}
                required
              />
            </label>
            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting ? "Changing password..." : "Change password"}
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
}

function InfoRow({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-4 p-4 transition-colors hover:bg-slate-50">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{label}</p>
        <p className="truncate font-semibold text-slate-900">{value}</p>
      </div>
    </div>
  );
}
