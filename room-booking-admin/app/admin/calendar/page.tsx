"use client";

import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";

interface Entry { id: string; semester: string; department: string; batch: string; lecturerName: string; dayOfWeek: string; startTime: string; endTime: string; moduleCode: string; roomCode: string }
interface Room { code: string; status: string }
const week = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const departmentColors: Record<string, string> = {
  "Electrical and Information Engineering": "border-blue-400 bg-blue-100 text-blue-950",
  "Civil Engineering": "border-orange-400 bg-orange-100 text-orange-950",
  "Mechanical Engineering": "border-emerald-400 bg-emerald-100 text-emerald-950",
  "Computer Science": "border-violet-400 bg-violet-100 text-violet-950",
};
const fallbackColors = [
  "border-pink-400 bg-pink-100 text-pink-950",
  "border-cyan-400 bg-cyan-100 text-cyan-950",
  "border-amber-400 bg-amber-100 text-amber-950",
];

function departmentColor(department: string) {
  if (departmentColors[department]) return departmentColors[department];
  let hash = 0;
  for (const character of department) hash = (hash * 31 + character.charCodeAt(0)) >>> 0;
  return fallbackColors[hash % fallbackColors.length];
}

export default function SemesterCalendarPage() {
  const today = new Date();
  const [month, setMonth] = useState(`${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}`);
  const [entries, setEntries] = useState<Entry[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [department, setDepartment] = useState("ALL");
  const [batch, setBatch] = useState("ALL");
  const [semester, setSemester] = useState("ALL");
  const [selected, setSelected] = useState<{ entry: Entry; date: Date } | null>(null);

  useEffect(() => {
    void Promise.all([
      fetch("/api/timetable/upload").then((response) => response.json()),
      fetch("/api/admin/rooms").then((response) => response.json()),
    ]).then(([schedule, roomList]) => { setEntries(schedule); setRooms(roomList); });
  }, []);

  const options = (field: keyof Entry) => [...new Set(entries.map((entry) => String(entry[field])))].filter(Boolean).sort();
  const departments = options("department");
  const filtered = entries.filter((entry) =>
    (department === "ALL" || entry.department === department)
    && (batch === "ALL" || entry.batch === batch)
    && (semester === "ALL" || entry.semester === semester));
  const dates = useMemo(() => {
    const [year, selectedMonth] = month.split("-").map(Number);
    const first = new Date(year, selectedMonth - 1, 1);
    const result: Array<Date | null> = Array(first.getDay()).fill(null);
    for (let day = 1; day <= new Date(year, selectedMonth, 0).getDate(); day++) result.push(new Date(year, selectedMonth - 1, day));
    while (result.length % 7) result.push(null);
    return result;
  }, [month]);
  const activeRooms = rooms.filter((room) => room.status === "ACTIVE").map((room) => room.code);
  const isToday = (date: Date) => date.toDateString() === today.toDateString();

  return <div className="space-y-5">
    <Card className="overflow-hidden">
      <CardHeader className="border-b bg-slate-50"><div className="flex flex-wrap items-center justify-between gap-3"><CardTitle>Semester monthly calendar</CardTitle><div className="flex gap-2 text-xs"><span className="rounded-full bg-white px-3 py-1.5 ring-1 ring-slate-200">{filtered.length} weekly lectures</span><span className="rounded-full bg-emerald-50 px-3 py-1.5 text-emerald-700 ring-1 ring-emerald-200">{activeRooms.length} active halls</span></div></div></CardHeader>
      <CardContent className="space-y-4 pt-5"><div className="grid gap-3 md:grid-cols-4">
        <Input aria-label="Calendar month" type="month" value={month} onChange={(event) => setMonth(event.target.value)} />
        <Select value={department} onChange={(event) => setDepartment(event.target.value)} options={[{ label: "All departments", value: "ALL" }, ...departments.map((value) => ({ label: value, value }))]} />
        <Select value={batch} onChange={(event) => setBatch(event.target.value)} options={[{ label: "All batches", value: "ALL" }, ...options("batch").map((value) => ({ label: value, value }))]} />
        <Select value={semester} onChange={(event) => setSemester(event.target.value)} options={[{ label: "All semesters", value: "ALL" }, ...options("semester").map((value) => ({ label: value, value }))]} />
      </div><div className="flex flex-wrap gap-2"><span className="text-xs font-semibold text-slate-500">Departments:</span>{departments.map((value) => <span key={value} className={`rounded-full border px-2.5 py-1 text-xs font-medium ${departmentColor(value)}`}>{value}</span>)}</div></CardContent>
    </Card>

    <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="grid min-w-[1120px] grid-cols-7 bg-slate-800 text-white">{week.map((day, index) => <div key={day} className={`border-r border-slate-700 p-3 text-center text-sm font-semibold ${index === 0 || index === 6 ? "bg-slate-900" : ""}`}>{day}</div>)}</div>
      <div className="grid min-w-[1120px] grid-cols-7">{dates.map((date, index) => {
        if (!date) return <div key={`empty-${index}`} className="min-h-56 border-r border-t bg-slate-50" />;
        const lectures = filtered.filter((entry) => entry.dayOfWeek === week[date.getDay()]).sort((a, b) => a.startTime.localeCompare(b.startTime));
        const occupied = new Set(lectures.map((entry) => entry.roomCode.toLowerCase()));
        const free = activeRooms.filter((code) => !occupied.has(code.toLowerCase()));
        return <div key={date.toISOString()} className={`min-h-56 border-r border-t p-2 ${isToday(date) ? "bg-amber-50/60 ring-2 ring-inset ring-amber-400" : date.getDay() === 0 || date.getDay() === 6 ? "bg-slate-50/70" : "bg-white"}`}>
          <div className="mb-2 flex items-center justify-between"><span className={`flex h-7 w-7 items-center justify-center rounded-full text-sm font-bold ${isToday(date) ? "bg-amber-500 text-white" : "text-slate-700"}`}>{date.getDate()}</span><span className="text-[10px] font-medium text-slate-400">{lectures.length} lectures</span></div>
          <div className="max-h-40 space-y-1.5 overflow-y-auto pr-0.5">{lectures.map((entry) => <button type="button" onClick={() => setSelected({ entry, date })} key={entry.id} className={`block w-full rounded-md border-l-4 p-2 text-left text-[11px] shadow-sm transition hover:-translate-y-0.5 hover:shadow-md focus:ring-2 focus:ring-slate-500 ${departmentColor(entry.department)}`} title={`View ${entry.moduleCode} details`}><p className="font-bold">{entry.startTime}-{entry.endTime} · {entry.moduleCode}</p><p className="truncate font-medium">{entry.roomCode} · {entry.lecturerName}</p><p className="truncate opacity-70">{entry.batch} · {entry.semester}</p></button>)}</div>
          <div className="mt-2 border-t border-dashed pt-2"><p className="mb-1 text-[10px] font-bold uppercase tracking-wide text-emerald-700">Free halls</p><div className="flex flex-wrap gap-1">{free.length ? free.map((code) => <span key={code} className="rounded bg-emerald-50 px-1.5 py-0.5 text-[10px] font-medium text-emerald-700 ring-1 ring-emerald-200">{code}</span>) : <span className="text-[10px] text-slate-400">None</span>}</div></div>
        </div>;
      })}</div>
    </div>
    <Dialog open={Boolean(selected)} onClose={() => setSelected(null)} title={selected?.entry.moduleCode || "Lecture details"} description={selected ? selected.date.toLocaleDateString(undefined, { weekday: "long", year: "numeric", month: "long", day: "numeric" }) : undefined}>
      {selected ? <div className="space-y-4">
        <div className={`rounded-lg border-l-4 p-4 ${departmentColor(selected.entry.department)}`}><p className="font-semibold">{selected.entry.department}</p><p className="mt-1 text-xs opacity-75">{selected.entry.batch} · {selected.entry.semester}</p></div>
        <dl className="grid grid-cols-[8rem_1fr] gap-x-4 gap-y-3 text-sm">
          <dt className="font-medium text-slate-500">Module</dt><dd className="font-semibold">{selected.entry.moduleCode}</dd>
          <dt className="font-medium text-slate-500">Lecturer</dt><dd>{selected.entry.lecturerName}</dd>
          <dt className="font-medium text-slate-500">Lecture hall</dt><dd>{selected.entry.roomCode}</dd>
          <dt className="font-medium text-slate-500">Time</dt><dd>{selected.entry.startTime} - {selected.entry.endTime}</dd>
          <dt className="font-medium text-slate-500">Day</dt><dd>{selected.entry.dayOfWeek}</dd>
          <dt className="font-medium text-slate-500">Batch</dt><dd>{selected.entry.batch}</dd>
          <dt className="font-medium text-slate-500">Semester</dt><dd>{selected.entry.semester}</dd>
        </dl>
      </div> : null}
    </Dialog>
  </div>;
}
