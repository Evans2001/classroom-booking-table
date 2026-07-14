"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent, type ReactNode } from "react";
import { ArrowLeft, Building2, IdCard, Mail, Send, User, UserRoundCog } from "lucide-react";

import { useToast } from "@/components/common/ToastProvider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { submitAccountRequest } from "@/lib/services/account.service";

export default function RegisterPage() {
  const [form, setForm] = useState({
    name: "",
    department: "",
    position: "",
    gmail: "",
    idNumber: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const router = useRouter();
  const { showToast } = useToast();

  const update = (field: keyof typeof form, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    try {
      await submitAccountRequest(form);
      showToast("Request sent", "Admin will review your lecturer account request.", "success");
      router.push("/login");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to submit account request.";
      showToast("Request failed", message, "error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-slate-100 sm:p-4">
      <div className="flex h-[100dvh] w-full max-w-[402px] flex-col overflow-hidden bg-white shadow-2xl sm:h-[874px] sm:max-h-[874px] sm:rounded-[40px] sm:border-[8px] sm:border-slate-900">
        <div className="bg-brand-primary px-6 pb-8 pt-10 text-white">
          <Button asChild variant="ghost" className="mb-8 h-10 px-0 text-white hover:bg-white/10 hover:text-white">
            <Link href="/login">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to login
            </Link>
          </Button>
          <h1 className="text-3xl font-black tracking-normal">Create lecturer account</h1>
          <p className="mt-3 text-sm font-medium leading-6 text-white/75">
            Submit your details for admin approval. If approved, credentials will be sent to your Gmail.
          </p>
        </div>

        <form className="flex-1 space-y-4 overflow-y-auto px-6 py-6" onSubmit={submit}>
          <Field icon={<User className="h-5 w-5" />} label="Full name">
            <Input
              value={form.name}
              onChange={(event) => update("name", event.target.value)}
              placeholder="Dr. Saman Perera"
              required
            />
          </Field>

          <Field icon={<Building2 className="h-5 w-5" />} label="Department">
            <Input
              value={form.department}
              onChange={(event) => update("department", event.target.value)}
              placeholder="Computer Engineering"
              required
            />
          </Field>

          <Field icon={<UserRoundCog className="h-5 w-5" />} label="Position">
            <Input
              value={form.position}
              onChange={(event) => update("position", event.target.value)}
              placeholder="Senior Lecturer"
              required
            />
          </Field>

          <Field icon={<Mail className="h-5 w-5" />} label="Gmail">
            <Input
              type="email"
              value={form.gmail}
              onChange={(event) => update("gmail", event.target.value)}
              placeholder="name@gmail.com"
              required
            />
          </Field>

          <Field icon={<IdCard className="h-5 w-5" />} label="ID number">
            <Input
              value={form.idNumber}
              onChange={(event) => update("idNumber", event.target.value)}
              placeholder="EMP-001"
              required
            />
          </Field>

          <Button type="submit" className="h-14 w-full rounded-2xl text-base" disabled={submitting}>
            {submitting ? "Sending request..." : "Send to admin"}
            {!submitting ? <Send className="ml-2 h-5 w-5" /> : null}
          </Button>
        </form>
      </div>
    </div>
  );
}

function Field({ icon, label, children }: { icon: ReactNode; label: string; children: ReactNode }) {
  return (
    <label className="block space-y-2">
      <span className="flex items-center gap-2 text-sm font-bold text-slate-700">
        <span className="text-brand-primary">{icon}</span>
        {label}
      </span>
      {children}
    </label>
  );
}
