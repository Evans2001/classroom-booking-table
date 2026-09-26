"use client";

import { useCallback, useEffect, useState } from "react";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { EmptyState } from "@/components/common/EmptyState";
import { useToast } from "@/components/common/ToastProvider";
import { DataTable, type DataColumn } from "@/components/tables/DataTable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { deleteUser, listUsers } from "@/lib/services/users.service";
import type { AdminUser } from "@/lib/types/user";
import { formatDateTime } from "@/lib/utils/format";

export default function UsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState<AdminUser | null>(null);
  const [busy, setBusy] = useState(false);
  const { showToast } = useToast();

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try { setUsers(await listUsers()); }
    catch (cause) { setError(cause instanceof Error ? cause.message : "Unable to load users."); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { void load(); }, [load]);

  async function confirmDelete() {
    if (!selected || busy) return;
    setBusy(true);
    try {
      await deleteUser(selected.id);
      setUsers((current) => current.filter((user) => user.id !== selected.id));
      setSelected(null);
      showToast("Account deleted", `${selected.name} can no longer sign in.`, "success");
    } catch (cause) {
      showToast("Deletion failed", cause instanceof Error ? cause.message : "Unable to delete account.", "error");
    } finally { setBusy(false); }
  }

  const query = search.trim().toLowerCase();
  const filtered = users.filter((user) =>
    [user.name, user.gmail, user.department, user.username, user.idNumber]
      .some((value) => value.toLowerCase().includes(query)),
  );
  const columns: DataColumn<AdminUser>[] = [
    { key: "name", header: "Lecturer", render: (user) => <div><p className="font-semibold text-slate-900">{user.name}</p><p className="text-sm text-slate-500">{user.gmail}</p><p className="text-xs text-slate-500">ID: {user.idNumber}</p></div> },
    { key: "department", header: "Department", render: (user) => <div><p>{user.department}</p><p className="text-sm text-slate-500">{user.position}</p></div> },
    { key: "username", header: "Username", render: (user) => user.username },
    { key: "created", header: "Created", render: (user) => formatDateTime(user.createdAt) },
    { key: "actions", header: "Actions", render: (user) => <Button variant="destructive" size="sm" disabled={busy} onClick={() => setSelected(user)} aria-label={`Delete account for ${user.name}`}>Delete account</Button> },
  ];

  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-600">View and manage lecturer accounts.</p>
      <Input className="max-w-md" aria-label="Search users" placeholder="Search name, email, department, username or ID" value={search} onChange={(event) => setSearch(event.target.value)} />
      {loading ? <p className="text-sm text-slate-500">Loading users...</p> : error ? (
        <div role="alert" className="space-y-3 rounded-xl border border-red-200 bg-red-50 p-4 text-red-700"><p>{error}</p><Button variant="outline" onClick={() => void load()}>Try again</Button></div>
      ) : <>
        <p className="text-sm text-slate-500">{filtered.length} of {users.length} users</p>
        {filtered.length ? <DataTable columns={columns} data={filtered} rowKey={(user) => user.id} /> : <EmptyState title="No users found" description={query ? "Try another search." : "Approved lecturer accounts will appear here."} />}
      </>}
      <ConfirmDialog open={selected !== null} title="Delete user account?" description={selected ? `Permanently delete ${selected.name}'s account (${selected.gmail})? They will lose access immediately. Booking and issue records will be retained, and existing bookings will remain scheduled. This cannot be undone.` : undefined} confirmLabel={busy ? "Deleting..." : "Delete account"} busy={busy} onConfirm={() => void confirmDelete()} onCancel={() => { if (!busy) setSelected(null); }} />
    </div>
  );
}
