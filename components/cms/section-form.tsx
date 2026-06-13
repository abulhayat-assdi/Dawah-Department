"use client";

import { useState } from "react";
import { Button, Input, Textarea, Label } from "@/components/ui";
import { RichTextEditor } from "@/components/rich-text-editor";
import { FileUpload } from "@/components/file-upload";
import { upsertContentJson } from "@/app/(app)/admin/content/actions";
import type { CmsField, CmsGroupChild } from "@/lib/cms-schema";

type Obj = Record<string, unknown>;

export function SectionForm({
  sectionKey,
  fields,
  initial,
}: {
  sectionKey: string;
  fields: CmsField[];
  initial: Obj;
}) {
  const [data, setData] = useState<Obj>(initial);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const set = (key: string, value: unknown) => {
    setData((d) => ({ ...d, [key]: value }));
    setSaved(false);
  };

  async function save() {
    setSaving(true);
    const fd = new FormData();
    fd.append("__key", sectionKey);
    fd.append("__json", JSON.stringify(data));
    await upsertContentJson(fd);
    setSaving(false);
    setSaved(true);
  }

  return (
    <div className="space-y-5">
      {fields.map((f) => (
        <FieldView key={f.key} field={f} value={data[f.key]} onChange={(v) => set(f.key, v)} />
      ))}
      <div className="flex items-center gap-3">
        <Button onClick={save} disabled={saving}>
          {saving ? "Saving…" : "Save changes"}
        </Button>
        {saved && <span className="text-sm font-medium text-green-700">✓ Saved</span>}
      </div>
    </div>
  );
}

function FieldView({
  field,
  value,
  onChange,
}: {
  field: CmsField;
  value: unknown;
  onChange: (v: unknown) => void;
}) {
  if (field.type === "text") {
    return (
      <div>
        <Label>{field.label}</Label>
        <Input value={(value as string) ?? ""} onChange={(e) => onChange(e.target.value)} />
      </div>
    );
  }
  if (field.type === "textarea") {
    return (
      <div>
        <Label>{field.label}</Label>
        <Textarea value={(value as string) ?? ""} onChange={(e) => onChange(e.target.value)} />
      </div>
    );
  }
  if (field.type === "rich") {
    return (
      <RichTextEditor
        label={field.label}
        defaultValue={(value as string) ?? ""}
        onChange={(html) => onChange(html)}
      />
    );
  }
  if (field.type === "image") {
    return (
      <FileUpload
        label={field.label}
        bucket="resources"
        kind="image"
        defaultUrl={(value as string) ?? ""}
        onChange={(url) => onChange(url)}
      />
    );
  }
  if (field.type === "list-text") {
    return <ListText label={field.label} value={(value as string[]) ?? []} onChange={onChange} />;
  }
  if (field.type === "list-object") {
    return (
      <ListObject
        label={field.label}
        fields={field.fields}
        value={(value as Obj[]) ?? []}
        onChange={onChange}
      />
    );
  }
  if (field.type === "group") {
    return (
      <div className="rounded-2xl border border-slate-200 p-4">
        <p className="mb-3 text-sm font-bold text-slate-800">{field.label}</p>
        <div className="space-y-4">
          {field.fields.map((sf) => (
            <GroupChild
              key={sf.key}
              field={sf}
              value={(value as Obj)?.[sf.key]}
              onChange={(v) => onChange({ ...((value as Obj) ?? {}), [sf.key]: v })}
            />
          ))}
        </div>
      </div>
    );
  }
  return null;
}

function GroupChild({
  field,
  value,
  onChange,
}: {
  field: CmsGroupChild;
  value: unknown;
  onChange: (v: unknown) => void;
}) {
  if (field.type === "list-text") {
    return <ListText label={field.label} value={(value as string[]) ?? []} onChange={onChange} />;
  }
  if (field.type === "textarea") {
    return (
      <div>
        <Label>{field.label}</Label>
        <Textarea value={(value as string) ?? ""} onChange={(e) => onChange(e.target.value)} />
      </div>
    );
  }
  return (
    <div>
      <Label>{field.label}</Label>
      <Input value={(value as string) ?? ""} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}

function ListText({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string[];
  onChange: (v: string[]) => void;
}) {
  return (
    <div>
      <Label>{label}</Label>
      <div className="space-y-2">
        {value.map((item, i) => (
          <div key={i} className="flex gap-2">
            <Input
              value={item}
              onChange={(e) => {
                const next = [...value];
                next[i] = e.target.value;
                onChange(next);
              }}
            />
            <Button
              type="button"
              variant="ghost"
              className="text-red-600"
              onClick={() => onChange(value.filter((_, j) => j !== i))}
            >
              ✕
            </Button>
          </div>
        ))}
        <Button type="button" variant="secondary" onClick={() => onChange([...value, ""])}>
          + Add
        </Button>
      </div>
    </div>
  );
}

function ListObject({
  label,
  fields,
  value,
  onChange,
}: {
  label: string;
  fields: { key: string; label: string; type: "text" | "textarea" }[];
  value: Obj[];
  onChange: (v: Obj[]) => void;
}) {
  const blank = () => Object.fromEntries(fields.map((f) => [f.key, ""]));
  return (
    <div>
      <Label>{label}</Label>
      <div className="space-y-3">
        {value.map((row, i) => (
          <div key={i} className="rounded-2xl border border-slate-200 p-4">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400">#{i + 1}</span>
              <Button
                type="button"
                variant="ghost"
                className="text-xs text-red-600"
                onClick={() => onChange(value.filter((_, j) => j !== i))}
              >
                Remove
              </Button>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {fields.map((f) => (
                <div key={f.key} className={f.type === "textarea" ? "sm:col-span-2" : ""}>
                  <Label>{f.label}</Label>
                  {f.type === "textarea" ? (
                    <Textarea
                      value={(row[f.key] as string) ?? ""}
                      onChange={(e) => {
                        const next = [...value];
                        next[i] = { ...row, [f.key]: e.target.value };
                        onChange(next);
                      }}
                    />
                  ) : (
                    <Input
                      value={(row[f.key] as string) ?? ""}
                      onChange={(e) => {
                        const next = [...value];
                        next[i] = { ...row, [f.key]: e.target.value };
                        onChange(next);
                      }}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
        <Button type="button" variant="secondary" onClick={() => onChange([...value, blank()])}>
          + Add item
        </Button>
      </div>
    </div>
  );
}
