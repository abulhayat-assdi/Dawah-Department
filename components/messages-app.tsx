"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Avatar } from "@/components/avatar";
import { clsx } from "@/lib/utils";
import type { Message } from "@/lib/types";

interface Person {
  id: string;
  full_name: string;
  photo_url: string | null;
  designation: string | null;
  role: string;
}

function timeOf(iso: string) {
  return new Date(iso).toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

function fileIcon(name: string) {
  const n = name.toLowerCase();
  if (/\.(png|jpe?g|gif|webp|svg)$/.test(n)) return "🖼️";
  if (/\.pdf$/.test(n)) return "📄";
  return "📎";
}

export function MessagesApp({ me, people }: { me: Person; people: Person[] }) {
  const [all, setAll] = useState<Message[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    const supabase = createClient();
    const { data } = await supabase
      .from("messages")
      .select("*")
      .or(`sender_id.eq.${me.id},recipient_id.eq.${me.id}`)
      .order("created_at");
    setAll((data ?? []) as Message[]);
  }, [me.id]);

  useEffect(() => {
    // load() only setState()s after an awaited fetch — not synchronous.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
    const t = setInterval(load, 4000);
    return () => clearInterval(t);
  }, [load]);

  const other = (m: Message) => (m.sender_id === me.id ? m.recipient_id : m.sender_id);
  const convoMsgs = (pid: string) =>
    all.filter((m) => other(m) === pid).sort((a, b) => a.created_at.localeCompare(b.created_at));
  const lastMsg = (pid: string) => {
    const c = convoMsgs(pid);
    return c[c.length - 1];
  };
  const unread = (pid: string) =>
    all.filter((m) => m.sender_id === pid && m.recipient_id === me.id && !m.is_read).length;

  // Sort people by latest activity, then name.
  const sorted = [...people].sort((a, b) => {
    const la = lastMsg(a.id)?.created_at ?? "";
    const lb = lastMsg(b.id)?.created_at ?? "";
    if (la && lb) return lb.localeCompare(la);
    if (la) return -1;
    if (lb) return 1;
    return a.full_name.localeCompare(b.full_name);
  });

  const selected = people.find((p) => p.id === selectedId) ?? null;
  const thread = selectedId ? convoMsgs(selectedId) : [];

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [thread.length, selectedId]);

  async function openConvo(pid: string) {
    setSelectedId(pid);
    const supabase = createClient();
    await supabase
      .from("messages")
      .update({ is_read: true })
      .eq("recipient_id", me.id)
      .eq("sender_id", pid)
      .eq("is_read", false);
    load();
  }

  async function send() {
    if (!selectedId || !text.trim()) return;
    setBusy(true);
    const supabase = createClient();
    await supabase.from("messages").insert({
      sender_id: me.id,
      recipient_id: selectedId,
      body: text.trim(),
    });
    setText("");
    setBusy(false);
    load();
  }

  async function attach(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !selectedId) return;
    setBusy(true);
    const supabase = createClient();
    const path = `${me.id}/${crypto.randomUUID()}-${file.name}`;
    const { error } = await supabase.storage
      .from("chat-files")
      .upload(path, file, { contentType: file.type });
    if (!error) {
      const { data } = supabase.storage.from("chat-files").getPublicUrl(path);
      await supabase.from("messages").insert({
        sender_id: me.id,
        recipient_id: selectedId,
        file_url: data.publicUrl,
        file_name: file.name,
      });
    }
    setBusy(false);
    if (fileRef.current) fileRef.current.value = "";
    load();
  }

  async function clearConvo() {
    if (!selectedId || !confirm("এই কথোপকথনের সব বার্তা মুছে ফেলবেন?")) return;
    const supabase = createClient();
    await supabase
      .from("messages")
      .delete()
      .or(
        `and(sender_id.eq.${me.id},recipient_id.eq.${selectedId}),and(sender_id.eq.${selectedId},recipient_id.eq.${me.id})`,
      );
    load();
  }

  return (
    <div className="grid h-[calc(100vh-9rem)] grid-cols-1 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm md:grid-cols-[320px_1fr]">
      {/* Conversation list */}
      <aside className={clsx("flex flex-col border-r border-slate-200", selectedId && "hidden md:flex")}>
        <div className="border-b border-slate-100 px-5 py-4">
          <h2 className="text-base font-bold text-slate-900">Live Support</h2>
          <p className="text-xs text-slate-500">Internal team messaging</p>
        </div>
        <div className="flex-1 overflow-y-auto">
          {sorted.map((p) => {
            const lm = lastMsg(p.id);
            const u = unread(p.id);
            return (
              <button
                key={p.id}
                onClick={() => openConvo(p.id)}
                className={clsx(
                  "flex w-full items-center gap-3 border-b border-slate-50 px-4 py-3 text-left transition hover:bg-slate-50",
                  selectedId === p.id && "bg-brand-50/60",
                )}
              >
                <Avatar name={p.full_name} photoUrl={p.photo_url} size={42} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="truncate font-semibold text-slate-800">{p.full_name}</p>
                    {lm && (
                      <span className="shrink-0 text-[10px] text-slate-400">
                        {timeOf(lm.created_at)}
                      </span>
                    )}
                  </div>
                  <p className="truncate text-xs text-slate-500">
                    {lm ? (lm.body || (lm.file_url ? "Sent an attachment" : "")) : "No messages yet"}
                  </p>
                </div>
                {u > 0 && (
                  <span className="grid size-5 shrink-0 place-items-center rounded-full bg-brand-500 text-[10px] font-bold text-white">
                    {u}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </aside>

      {/* Chat thread */}
      <section className={clsx("flex flex-col", !selectedId && "hidden md:flex")}>
        {!selected ? (
          <div className="grid flex-1 place-items-center text-center text-slate-400">
            <div>
              <p className="text-4xl">💬</p>
              <p className="mt-2 text-sm">একজনকে বেছে নিয়ে কথোপকথন শুরু করুন</p>
            </div>
          </div>
        ) : (
          <>
            <header className="flex items-center justify-between gap-3 border-b border-slate-200 px-5 py-3">
              <div className="flex items-center gap-3">
                <button onClick={() => setSelectedId(null)} className="text-slate-400 md:hidden">
                  ←
                </button>
                <Avatar name={selected.full_name} photoUrl={selected.photo_url} size={40} />
                <div>
                  <p className="font-semibold text-slate-900">{selected.full_name}</p>
                  <p className="text-xs text-slate-500">
                    {selected.designation || (selected.role === "super_admin" ? "Coordinator" : "Member")}
                  </p>
                </div>
              </div>
              <button
                onClick={clearConvo}
                className="grid size-9 place-items-center rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-600"
                aria-label="Clear conversation"
              >
                🗑️
              </button>
            </header>

            <div className="flex-1 space-y-3 overflow-y-auto bg-slate-50/60 px-5 py-5">
              {thread.map((m) => {
                const mine = m.sender_id === me.id;
                return (
                  <div key={m.id} className={clsx("flex", mine ? "justify-end" : "justify-start")}>
                    <div
                      className={clsx(
                        "max-w-[78%] rounded-2xl px-4 py-2.5 shadow-sm",
                        mine
                          ? "rounded-br-md bg-brand-800 text-white"
                          : "rounded-bl-md border border-slate-200 bg-white text-slate-800",
                      )}
                    >
                      {m.body && <p className="whitespace-pre-wrap break-words text-sm">{m.body}</p>}
                      {m.file_url && (
                        <a
                          href={m.file_url}
                          target="_blank"
                          rel="noreferrer"
                          className={clsx(
                            "flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm",
                            mine ? "bg-white/10" : "bg-slate-50",
                          )}
                        >
                          <span>{fileIcon(m.file_name || "")}</span>
                          <span className="truncate underline">{m.file_name || "File"}</span>
                        </a>
                      )}
                      {m.audio_url && (
                        <audio controls src={m.audio_url} className="mt-1 h-9 w-56 max-w-full" />
                      )}
                      <p className={clsx("mt-1 text-[10px]", mine ? "text-brand-100/70" : "text-slate-400")}>
                        {timeOf(m.created_at)}
                      </p>
                    </div>
                  </div>
                );
              })}
              <div ref={bottomRef} />
            </div>

            <div className="flex items-center gap-2 border-t border-slate-200 px-4 py-3">
              <input
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    send();
                  }
                }}
                placeholder="Write your reply…"
                className="flex-1 rounded-xl border border-slate-300 px-4 py-2.5 text-sm outline-none focus:border-brand-600 focus:ring-2 focus:ring-brand-100"
              />
              <input ref={fileRef} type="file" onChange={attach} className="hidden" />
              <button
                onClick={() => fileRef.current?.click()}
                disabled={busy}
                className="grid size-10 place-items-center rounded-xl border border-slate-300 text-lg hover:bg-slate-50"
                aria-label="Attach file"
              >
                📎
              </button>
              <button
                onClick={send}
                disabled={busy || !text.trim()}
                className="grid size-10 place-items-center rounded-xl bg-brand-700 text-white hover:bg-brand-800 disabled:opacity-50"
                aria-label="Send"
              >
                ➤
              </button>
            </div>
          </>
        )}
      </section>
    </div>
  );
}
