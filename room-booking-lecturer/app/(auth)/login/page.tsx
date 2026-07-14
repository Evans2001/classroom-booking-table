"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Mail, Lock, ArrowRight, Info } from "lucide-react";

import { useToast } from "@/components/common/ToastProvider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  AUTH_COOKIE_NAME,
  AUTH_COOKIE_VALUE,
  AUTH_MAX_AGE_SECONDS,
  DEMO_USER_EMAIL,
  DEMO_USER_PASSWORD,
} from "@/lib/utils/constants";
import { loginLecturer } from "@/lib/services/account.service";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { showToast } = useToast();
  const router = useRouter();

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    try {
      const account = await loginLecturer(email.trim(), password);
      document.cookie = `${AUTH_COOKIE_NAME}=${AUTH_COOKIE_VALUE}; path=/; max-age=${AUTH_MAX_AGE_SECONDS}`;
      sessionStorage.setItem("lecturer_account_identifier", account.gmail);
      sessionStorage.setItem("lecturer_account_name", account.name);
      showToast("Welcome Back!", "Signed in successfully.", "success");
      router.push(account.mustChangePassword ? "/lecturer/profile?changePassword=1" : "/lecturer/dashboard");
      router.refresh();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Please check your username and password.";
      showToast("Invalid credentials", message, "error");
    } finally {
      setSubmitting(false);
    }
  };

  const useDemoData = () => {
    setEmail(DEMO_USER_EMAIL);
    setPassword(DEMO_USER_PASSWORD);
  }

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-slate-100 sm:p-4">
      <div className="relative flex h-[100dvh] w-full max-w-[402px] flex-col overflow-hidden bg-brand-primary shadow-2xl sm:h-[874px] sm:max-h-[874px] sm:rounded-[40px] sm:border-[8px] sm:border-slate-900">
      {/* Abstract Background Elements */}
      <div className="absolute -left-[20%] -top-[10%] h-[500px] w-[500px] rounded-full bg-white/5 blur-3xl" />
      <div className="absolute -bottom-[10%] -right-[10%] h-[400px] w-[400px] rounded-full bg-brand-accent/20 blur-3xl" />
      <div className="absolute top-[20%] right-[10%] h-[200px] w-[200px] rounded-full bg-white/10 blur-3xl" />

      {/* Top Branding Area */}
      <div className="relative z-10 flex flex-1 flex-col items-center justify-center p-6 text-center pt-12 pb-8">
        <Image src="/faculty-logo.svg" alt="University of Ruhuna Logo" width={100} height={100} className="mb-6 object-contain drop-shadow-md" priority />
        <h1 className="text-3xl font-black tracking-tight text-white mb-2 drop-shadow-sm">Classroom Booking System</h1>
        <p className="text-sm font-medium text-white/80 max-w-[260px]">
          Faculty of Engineering University of Ruhuna
        </p>
      </div>

      {/* Login Bottom Sheet */}
      <div className="relative z-10 mt-auto flex w-full flex-col rounded-t-[40px] bg-white p-8 pb-12 shadow-[0_-20px_40px_-15px_rgba(0,0,0,0.3)]">
        <div className="mx-auto mb-8 h-1.5 w-12 rounded-full bg-slate-200" />
        
        <h2 className="mb-6 text-2xl font-bold tracking-tight text-slate-900">Welcome Back</h2>

        <form className="space-y-4" onSubmit={submit}>
          <div className="space-y-4">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
                <Mail className="h-5 w-5 text-slate-400" />
              </div>
              <Input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="Email address"
                required
                className="pl-11 h-14 bg-slate-50 border-slate-200 focus-visible:ring-brand-primary/20 focus-visible:border-brand-primary rounded-2xl font-medium"
              />
            </div>
            
            <div className="relative">
              <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
                <Lock className="h-5 w-5 text-slate-400" />
              </div>
              <Input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Password"
                required
                className="pl-11 h-14 bg-slate-50 border-slate-200 focus-visible:ring-brand-primary/20 focus-visible:border-brand-primary rounded-2xl font-medium"
              />
            </div>
          </div>

          <Button 
            type="submit" 
            className="w-full h-14 rounded-2xl text-base shadow-lg shadow-brand-primary/30 mt-2" 
            disabled={submitting}
          >
            {submitting ? "Signing in..." : "Sign In"}
            {!submitting && <ArrowRight className="ml-2 h-5 w-5" />}
          </Button>
        </form>

        <div className="mt-5 text-center">
          <Link href="/register" className="text-sm font-bold text-brand-primary hover:underline">
            Create lecturer account
          </Link>
        </div>

        {/* Demo Credentials Helper */}
        <div className="mt-8 rounded-2xl border border-blue-100 bg-blue-50/50 p-4">
          <div className="flex items-start gap-3">
            <Info className="mt-0.5 h-5 w-5 shrink-0 text-blue-500" />
            <div className="flex-1">
              <p className="text-xs font-bold uppercase tracking-wider text-blue-800 mb-1">Demo Credentials</p>
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs font-medium text-slate-600">Use pre-filled demo data.</p>
                <button 
                  onClick={useDemoData}
                  className="text-[10px] font-bold uppercase tracking-wider text-blue-600 bg-blue-100 hover:bg-blue-200 px-3 py-1.5 rounded-lg transition-colors"
                >
                  Auto-fill
                </button>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
    </div>
  );
}
