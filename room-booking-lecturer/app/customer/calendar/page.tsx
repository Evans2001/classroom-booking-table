"use client";

import React, { useEffect, useState } from "react";

export default function CalendarPage() {
  const [days, setDays] = useState<{ label: string; date: Date; isToday: boolean }[]>([]);

  useEffect(() => {
    // Generate dates starting from today for the next 7 days
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Normalize to start of day

    const next7Days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      return {
        label: d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" }),
        date: d,
        isToday: i === 0,
      };
    });
    setDays(next7Days);
  }, []);

  // 14 columns: Hours from 8:30 to 22:30 (10:30 PM)
  const timeSlots = Array.from({ length: 14 }, (_, i) => {
    const startHour = i + 8;
    const endHour = startHour + 1;
    
    const s12 = startHour > 12 ? startHour - 12 : startHour;
    const e12 = endHour > 12 ? endHour - 12 : endHour;
    const sAmPm = startHour >= 12 ? "PM" : "AM";
    const eAmPm = endHour >= 12 && endHour < 24 ? "PM" : "AM";
    
    // Format: "8.30 - 9.30 AM" or "11.30 AM - 12.30 PM"
    if (sAmPm === eAmPm) {
      return `${s12}.30 - ${e12}.30 ${eAmPm}`;
    }
    return `${s12}.30 ${sAmPm} - ${e12}.30 ${eAmPm}`;
  });

  return (
    <div className="flex h-full flex-col space-y-4 p-4 pb-24">
      <div>
        <h1 className="text-xl font-bold tracking-tight text-slate-900">Calendar</h1>
        <p className="text-sm text-slate-500">View schedule for the next 7 days.</p>
      </div>

      <div className="relative w-full rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        {/* Overflow container for horizontal scrolling */}
        <div className="overflow-x-auto custom-scrollbar">
          <div className="min-w-max">
            
            {/* Header: Times (14 columns) */}
            <div className="flex border-b border-slate-200 bg-slate-50/80">
              {/* Top-left empty sticky cell */}
              <div className="sticky left-0 z-20 w-36 shrink-0 border-r border-slate-200 bg-slate-50 p-3 shadow-[1px_0_0_0_rgba(226,232,240,1)]"></div>
              
              {timeSlots.map((time, i) => (
                <div 
                  key={i} 
                  className="w-40 shrink-0 border-r border-slate-200 p-3 text-center text-xs font-semibold text-slate-600 last:border-r-0"
                >
                  {time}
                </div>
              ))}
            </div>

            {/* Body: Days (7 rows) */}
            <div className="flex flex-col">
              {days.length === 0 ? (
                <div className="p-8 text-center text-sm text-slate-500">Loading calendar dates...</div>
              ) : (
                days.map((dayObj, rowIndex) => (
                  <div key={rowIndex} className="flex border-b border-slate-200 last:border-b-0 group">
                    
                    {/* Day Label (Sticky Left Column) */}
                    <div className={`sticky left-0 z-10 w-36 shrink-0 border-r border-slate-200 p-3 shadow-[1px_0_0_0_rgba(226,232,240,1)] flex items-center transition-colors ${dayObj.isToday ? 'bg-blue-50/60 group-hover:bg-blue-50' : 'bg-white group-hover:bg-slate-50'}`}>
                      <span className={`text-sm font-medium ${dayObj.isToday ? 'text-blue-700 font-bold' : 'text-slate-700'}`}>
                        {dayObj.label}
                        {dayObj.isToday && (
                          <span className="ml-2 rounded bg-blue-100 px-1.5 py-0.5 text-[10px] font-bold text-blue-600">
                            TODAY
                          </span>
                        )}
                      </span>
                    </div>
                    
                    {/* Grid Cells (14 columns) */}
                    {timeSlots.map((_, colIndex) => (
                      <div 
                        key={colIndex} 
                        className={`w-40 shrink-0 border-r border-slate-200 h-20 p-1 last:border-r-0 hover:bg-blue-50/50 transition-colors cursor-pointer ${dayObj.isToday ? 'bg-blue-50/10' : ''}`}
                      >
                        {/* Placeholder for future bookings inside this specific slot */}
                      </div>
                    ))}
                  </div>
                ))
              )}
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
