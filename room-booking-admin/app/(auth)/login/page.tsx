"use client";

import { useState, type FormEvent } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { ArrowRight, Eye, EyeOff, LockKeyhole, Mail, ShieldCheck } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/common/ToastProvider";
import {
  AUTH_COOKIE_NAME,
  AUTH_COOKIE_VALUE,
  AUTH_MAX_AGE_SECONDS,
  DEMO_ADMIN_EMAIL,
  DEMO_ADMIN_PASSWORD,
} from "@/lib/utils/constants";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const router = useRouter();
  const { showToast } = useToast();

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    try {
      const valid = email.trim() === DEMO_ADMIN_EMAIL && password === DEMO_ADMIN_PASSWORD;
      if (!valid) {
        showToast("Invalid credentials", "Use the provided demo credentials.", "error");
        return;
      }
      document.cookie = `${AUTH_COOKIE_NAME}=${AUTH_COOKIE_VALUE}; path=/; max-age=${AUTH_MAX_AGE_SECONDS}`;
      showToast("Login successful", "Redirecting to dashboard.", "success");
      router.push("/admin/dashboard");
      router.refresh();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen overflow-hidden bg-[#f7f2ee] text-[#261817]">
      <div className="grid min-h-screen lg:grid-cols-[1.05fr_0.95fr]">
        <section className="relative flex min-h-[38vh] items-center justify-center overflow-hidden bg-[#5E2726] px-6 py-12 text-white lg:min-h-screen lg:px-12">
          <div className="absolute inset-0 opacity-20">
            <div className="absolute -left-24 top-14 h-72 w-72 rounded-full bg-[#F3C033]" />
            <div className="absolute bottom-10 right-0 h-80 w-80 rounded-full bg-white" />
          </div>
          <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.12)_0,rgba(255,255,255,0)_42%),radial-gradient(circle_at_20%_80%,rgba(243,192,51,0.24),transparent_34%)]" />
          <div className="relative z-10 flex w-full max-w-xl flex-col items-center text-center">
            <div className="mb-10 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-[#f7df93]">
              <ShieldCheck className="h-4 w-4" aria-hidden="true" />
              Secure Admin Access
            </div>

            <div className="relative mb-10 flex aspect-square w-44 items-center justify-center rounded-[2rem] bg-white p-5 shadow-2xl shadow-black/25 sm:w-52">
              <div className="absolute -right-4 -top-4 h-16 w-16 rounded-2xl border border-[#F3C033]/50 bg-[#F3C033]/20" />
              <Image
                src="/faculty-logo.svg"
                alt="Faculty of Engineering University of Ruhuna"
                width={155}
                height={200}
                priority
                className="h-full w-auto object-contain"
              />
            </div>

            <div className="space-y-5">
              <p className="text-sm font-semibold uppercase tracking-[0.26em] text-[#F3C033]">
                University of Ruhuna
              </p>
              <h1 className="mx-auto max-w-lg text-4xl font-black leading-tight tracking-normal sm:text-5xl">
                Faculty Room Booking Console
              </h1>
              <p className="mx-auto max-w-md text-base leading-7 text-white/75">
                Manage rooms, booking requests, timetable imports, and maintenance issues from one focused
                administration workspace.
              </p>
            </div>
          </div>
        </section>

        <section className="flex items-center justify-center px-5 py-10 sm:px-8 lg:px-12">
          <div className="w-full max-w-md">
            <div className="mb-8">
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[#8a4a45]">Admin Portal</p>
              <h2 className="mt-3 text-3xl font-black tracking-normal text-[#2a1716]">Welcome back</h2>
              <p className="mt-3 text-sm leading-6 text-[#6f5a57]">
                Sign in to continue to the classroom booking dashboard.
              </p>
            </div>

            <form
              className="space-y-5 rounded-2xl border border-[#e5d5cf] bg-white/90 p-6 shadow-2xl shadow-[#5E2726]/10 backdrop-blur sm:p-8"
              onSubmit={handleSubmit}
            >
              <div className="space-y-2">
                <Label htmlFor="email" className="text-[#513130]">
                  Email address
                </Label>
                <div className="relative">
                  <Mail
                    className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8a4a45]"
                    aria-hidden="true"
                  />
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder={DEMO_ADMIN_EMAIL}
                    className="h-12 border-[#dfccc6] bg-[#fffaf7] pl-11 text-[#2a1716] placeholder:text-[#9a817d] focus-visible:border-[#F3C033]"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-[#513130]">
                  Password
                </Label>
                <div className="relative">
                  <LockKeyhole
                    className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8a4a45]"
                    aria-hidden="true"
                  />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="Enter password"
                    className="h-12 border-[#dfccc6] bg-[#fffaf7] px-11 text-[#2a1716] placeholder:text-[#9a817d] focus-visible:border-[#F3C033]"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((value) => !value)}
                    className="absolute right-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-lg text-[#8a4a45] transition hover:bg-[#f2e5df] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F3C033]"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" aria-hidden="true" />
                    ) : (
                      <Eye className="h-4 w-4" aria-hidden="true" />
                    )}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                size="lg"
                className="h-12 w-full gap-2 rounded-xl bg-[#5E2726] text-white shadow-lg shadow-[#5E2726]/25 hover:bg-[#753331]"
                disabled={submitting}
              >
                {submitting ? "Signing in..." : "Sign in"}
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Button>

              <div className="rounded-xl border border-[#eadbd6] bg-[#fbf4ef] p-4 text-xs leading-6 text-[#694644]">
                <p>
                  <span className="font-semibold">Email:</span> {DEMO_ADMIN_EMAIL}
                </p>
                <p>
                  <span className="font-semibold">Password:</span> {DEMO_ADMIN_PASSWORD}
                </p>
              </div>
            </form>
          </div>
        </section>
      </div>
    </main>
  );
}
