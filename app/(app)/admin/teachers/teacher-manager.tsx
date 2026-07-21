"use client";

import { useMemo, useState } from "react";
import { Card, CardHeader, EmptyState, Input } from "@/components/ui";
import { MemberCard } from "./member-card";
import { MemberForm } from "./member-form";
import type { Campus } from "@/lib/types";
import type { MemberWithMeta } from "./types";

export function TeacherManager({
  members,
  campuses,
}: {
  members: MemberWithMeta[];
  campuses: Campus[];
}) {
  const [query, setQuery] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);

  const editing = members.find((m) => m.id === editingId) ?? null;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return members;
    return members.filter(
      (m) =>
        m.full_name.toLowerCase().includes(q) ||
        m.email.toLowerCase().includes(q) ||
        (m.phone ?? "").toLowerCase().includes(q) ||
        (m.designation ?? "").toLowerCase().includes(q),
    );
  }, [members, query]);

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <Card className="lg:col-span-2">
        <CardHeader title="Member List" subtitle={`${members.length} total`} />
        <div className="p-5 pb-0">
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name, email, phone or designation…"
          />
        </div>
        <div className="p-5">
          {filtered.length === 0 ? (
            <EmptyState
              icon="👥"
              title={members.length === 0 ? "No members yet" : "No matches"}
            />
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {filtered.map((m) => (
                <MemberCard
                  key={m.id}
                  member={m}
                  onEdit={() => setEditingId(m.id)}
                />
              ))}
            </div>
          )}
        </div>
      </Card>

      <Card className="h-fit lg:sticky lg:top-6">
        <CardHeader
          title={editing ? `Edit Member: ${editing.full_name || "Unnamed"}` : "Add New Member"}
        />
        <MemberForm
          key={editing?.id ?? "new"}
          member={editing}
          campuses={campuses}
          onSaved={() => {
            if (!editing) return; // creating: stay in "Add New Member" mode
          }}
          onCancel={() => setEditingId(null)}
        />
      </Card>
    </div>
  );
}
