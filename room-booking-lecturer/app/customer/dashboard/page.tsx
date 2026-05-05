"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { listMyBookings } from "@/lib/services/bookings.service";
import { listMyIssues } from "@/lib/services/issues.service";
import { listRooms } from "@/lib/services/rooms.service";

export default function CustomerDashboardPage() {
  const [roomsCount, setRoomsCount] = useState(0);
  const [bookingsCount, setBookingsCount] = useState(0);
  const [issuesCount, setIssuesCount] = useState(0);

  useEffect(() => {
    async function loadData() {
      const [rooms, bookings, issues] = await Promise.all([
        listRooms(),
        listMyBookings(),
        listMyIssues(),
      ]);
      setRoomsCount(rooms.length);
      setBookingsCount(bookings.length);
      setIssuesCount(issues.length);
    }
    void loadData();
  }, []);

  return (
    <div className="space-y-3">
      <Card>
        <CardHeader>
          <CardTitle>Welcome</CardTitle>
          <CardDescription>Manage bookings and report room issues quickly from your phone.</CardDescription>
        </CardHeader>
      </Card>

      <div className="grid grid-cols-3 gap-2">
        <Card>
          <CardContent className="p-3 text-center">
            <p className="text-lg font-bold text-slate-900">{roomsCount}</p>
            <p className="text-xs text-slate-500">Rooms</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 text-center">
            <p className="text-lg font-bold text-slate-900">{bookingsCount}</p>
            <p className="text-xs text-slate-500">Bookings</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 text-center">
            <p className="text-lg font-bold text-slate-900">{issuesCount}</p>
            <p className="text-xs text-slate-500">Issues</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <Button asChild className="w-full">
          <Link href="/customer/bookings/new">New Booking</Link>
        </Button>
        <Button asChild className="w-full" variant="outline">
          <Link href="/customer/issues/new">Report Issue</Link>
        </Button>
      </div>
    </div>
  );
}
