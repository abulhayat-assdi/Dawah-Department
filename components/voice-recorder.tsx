"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui";

/**
 * Records a voice note via the browser MediaRecorder API, uploads it to the
 * `voice-messages` Supabase Storage bucket, and inserts a messages row with the
 * public audio URL. Refreshes the server component on success.
 */
export function VoiceRecorder({ userId }: { userId: string }) {
  const router = useRouter();
  const [recording, setRecording] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  async function start() {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const rec = new MediaRecorder(stream);
      chunksRef.current = [];
      rec.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      rec.onstop = () => {
        stream.getTracks().forEach((t) => t.stop());
        void upload(new Blob(chunksRef.current, { type: "audio/webm" }));
      };
      recorderRef.current = rec;
      rec.start();
      setRecording(true);
    } catch {
      setError("Microphone access denied.");
    }
  }

  function stop() {
    recorderRef.current?.stop();
    setRecording(false);
  }

  async function upload(blob: Blob) {
    setBusy(true);
    setError(null);
    try {
      const supabase = createClient();
      const path = `${userId}/${crypto.randomUUID()}.webm`;
      const { error: upErr } = await supabase.storage
        .from("voice-messages")
        .upload(path, blob, { contentType: "audio/webm" });
      if (upErr) throw upErr;

      const { data } = supabase.storage
        .from("voice-messages")
        .getPublicUrl(path);

      const { error: insErr } = await supabase
        .from("messages")
        .insert({ sender_id: userId, audio_url: data.publicUrl });
      if (insErr) throw insErr;

      router.refresh();
    } catch {
      setError("Upload failed. Try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex items-center gap-2">
      {recording ? (
        <Button type="button" variant="danger" onClick={stop}>
          ⏹ Stop
        </Button>
      ) : (
        <Button
          type="button"
          variant="secondary"
          onClick={start}
          disabled={busy}
        >
          {busy ? "Uploading…" : "🎙 Record voice"}
        </Button>
      )}
      {recording && (
        <span className="flex items-center gap-1.5 text-sm text-red-600">
          <span className="size-2 animate-pulse rounded-full bg-red-600" />
          Recording…
        </span>
      )}
      {error && <span className="text-sm text-red-600">{error}</span>}
    </div>
  );
}
