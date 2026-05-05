import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const mockNotifications = [
  "Your booking request for Main Lecture Hall is pending review.",
  "Issue update: Projector not turning on is now in progress.",
  "Reminder: Check room availability before booking peak hours.",
];

export default function NotificationsPage() {
  return (
    <div className="space-y-3">
      <Card>
        <CardHeader>
          <CardTitle>Notifications</CardTitle>
          <CardDescription>Recent booking and issue updates.</CardDescription>
        </CardHeader>
      </Card>
      {mockNotifications.map((note) => (
        <Card key={note}>
          <CardContent className="text-sm text-slate-700">{note}</CardContent>
        </Card>
      ))}
    </div>
  );
}
