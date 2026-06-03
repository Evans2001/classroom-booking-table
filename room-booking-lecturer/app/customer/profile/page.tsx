import { User, Mail, Building, Phone, ShieldCheck, LogOut, ChevronRight, Settings } from "lucide-react";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function ProfilePage() {
  return (
    <div className="space-y-6 pb-24">
      {/* Hero Avatar Header */}
      <div className="relative flex flex-col items-center justify-center overflow-hidden rounded-3xl bg-brand-primary py-10 px-6 text-white shadow-xl shadow-brand-primary/20">
        <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-white/10 blur-2xl" />
        <div className="absolute -bottom-10 -left-10 h-32 w-32 rounded-full bg-brand-accent/20 blur-2xl" />
        
        <div className="relative z-10 flex flex-col items-center">
          <div className="mb-4 flex h-24 w-24 items-center justify-center rounded-full border-4 border-white/20 bg-white/10 text-4xl font-black backdrop-blur-sm shadow-inner">
            DS
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Demo Lecturer</h1>
          <div className="mt-1 flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1 text-xs font-semibold backdrop-blur-md">
            <ShieldCheck className="h-3.5 w-3.5" />
            Lecturer Account
          </div>
        </div>
      </div>

      {/* Main Info Card */}
      <div>
        <h3 className="mb-3 text-sm font-bold uppercase tracking-wider text-slate-500">Personal Information</h3>
        <Card className="overflow-hidden border-slate-100 shadow-xl shadow-slate-200/50">
          <div className="divide-y divide-slate-100">
            <div className="flex items-center gap-4 p-4 transition-colors hover:bg-slate-50">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                <User className="h-5 w-5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Full Name</p>
                <p className="truncate font-semibold text-slate-900">Demo Lecturer</p>
              </div>
            </div>

            <div className="flex items-center gap-4 p-4 transition-colors hover:bg-slate-50">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
                <Mail className="h-5 w-5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Email Address</p>
                <p className="truncate font-semibold text-slate-900">lecturer@eng.ruh.ac.lk</p>
              </div>
            </div>

            <div className="flex items-center gap-4 p-4 transition-colors hover:bg-slate-50">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                <Building className="h-5 w-5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Department</p>
                <p className="truncate font-semibold text-slate-900">Faculty of Engineering</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4 p-4 transition-colors hover:bg-slate-50">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-purple-50 text-purple-600">
                <Phone className="h-5 w-5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Contact Number</p>
                <p className="truncate font-semibold text-slate-500 italic">Not provided</p>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Settings Menu */}
      <div>
        <h3 className="mb-3 text-sm font-bold uppercase tracking-wider text-slate-500">Preferences</h3>
        <Card className="overflow-hidden border-slate-100 shadow-xl shadow-slate-200/50">
          <div className="divide-y divide-slate-100">
            <button className="flex w-full items-center justify-between p-4 transition-colors hover:bg-slate-50 focus:outline-none">
              <div className="flex items-center gap-3">
                <Settings className="h-5 w-5 text-slate-400" />
                <span className="font-semibold text-slate-700">Account Settings</span>
              </div>
              <ChevronRight className="h-4 w-4 text-slate-300" />
            </button>
            <button className="flex w-full items-center justify-between p-4 transition-colors hover:bg-slate-50 focus:outline-none">
              <div className="flex items-center gap-3">
                <ShieldCheck className="h-5 w-5 text-slate-400" />
                <span className="font-semibold text-slate-700">Privacy & Security</span>
              </div>
              <ChevronRight className="h-4 w-4 text-slate-300" />
            </button>
          </div>
        </Card>
      </div>

      {/* Coming Soon Notice */}
      <div className="rounded-xl border border-dashed border-slate-200 p-4 text-center">
        <p className="text-sm font-semibold text-slate-500">Profile editing features are coming in the next update.</p>
      </div>
    </div>
  );
}