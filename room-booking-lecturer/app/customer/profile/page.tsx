import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function ProfilePage() {
  return (
    <div className="space-y-3">
      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
          <CardDescription>Customer account details.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-slate-700">
          <p>
            <span className="font-medium text-slate-900">Name:</span> Demo Student
          </p>
          <p>
            <span className="font-medium text-slate-900">Email:</span> student@eng.ruh.ac.lk
          </p>
          <p>
            <span className="font-medium text-slate-900">Department:</span> Faculty of Engineering
          </p>
          <p className="text-xs text-slate-500">
            Editable profile settings can be added in the next implementation phase.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
