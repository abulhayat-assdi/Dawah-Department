import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import {
  Card,
  CardHeader,
  PageHeader,
  Label,
  Input,
  Textarea,
  Select,
  Button,
} from "@/components/ui";
import { toBn } from "@/lib/utils";
import { COURSE_CATEGORY_LABEL } from "@/lib/constants";
import { DeleteButton } from "@/components/delete-button";
import { FileUpload } from "@/components/file-upload";
import {
  updateCourse,
  deleteCourse,
  uploadSyllabus,
  deleteSyllabus,
} from "../actions";
import type { Course } from "@/lib/types";

interface SyllabusDoc {
  id: string;
  syllabus_kind: "quran" | "general" | "dawah";
  url: string | null;
}

const SYLLABUS_KINDS = [
  { kind: "quran" as const, label: "Quran Class Syllabus" },
  { kind: "general" as const, label: "General Class Syllabus" },
  { kind: "dawah" as const, label: "Dawah Class Syllabus" },
];

export default async function CourseDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();
  const { id } = await params;
  const supabase = await createClient();

  const { data: course } = await supabase
    .from("courses")
    .select("*")
    .eq("id", id)
    .single();
  if (!course) notFound();

  const { data: syllabusData } = await supabase
    .from("resources")
    .select("id, syllabus_kind, url")
    .eq("course_id", id)
    .not("syllabus_kind", "is", null);
  const syllabusDocs = (syllabusData ?? []) as SyllabusDoc[];
  const c = course as Course;

  return (
    <div className="space-y-6">
      <Link href="/admin/courses" className="text-sm text-slate-500 hover:text-brand-600">
        ← Back to course list
      </Link>
      <PageHeader
        title={`${c.abbreviation} — ${c.name}`}
        subtitle={`${COURSE_CATEGORY_LABEL[c.category]} · ${c.duration_label ?? ""} · ${toBn(c.default_total_classes)} classes`}
      />

      <Card>
        <CardHeader title="Edit Course" subtitle="Update this course's details" />
        <form action={updateCourse} className="grid gap-4 p-5 md:grid-cols-2">
          <input type="hidden" name="id" value={id} />
          <div className="md:col-span-2">
            <Label htmlFor="name">Course Name</Label>
            <Input id="name" name="name" required defaultValue={c.name} />
          </div>
          <div>
            <Label htmlFor="abbreviation">Code</Label>
            <Input id="abbreviation" name="abbreviation" required defaultValue={c.abbreviation} />
          </div>
          <div>
            <Label htmlFor="duration_label">Duration</Label>
            <Input id="duration_label" name="duration_label" defaultValue={c.duration_label ?? ""} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="category">Category</Label>
              <Select id="category" name="category" defaultValue={c.category}>
                <option value="common">Both</option>
                <option value="alem">Alem</option>
                <option value="general">General</option>
              </Select>
            </div>
            <div>
              <Label htmlFor="default_total_classes">Total Classes</Label>
              <Input
                id="default_total_classes"
                name="default_total_classes"
                type="number"
                defaultValue={c.default_total_classes}
              />
            </div>
          </div>
          <div className="md:col-span-2">
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" name="description" defaultValue={c.description ?? ""} />
          </div>
          <div className="md:col-span-2">
            <Button type="submit">Save changes</Button>
          </div>
        </form>
        <div className="flex items-center gap-3 border-t border-slate-100 p-5">
          <DeleteButton
            action={deleteCourse}
            id={id}
            label="Delete course"
            confirmText="এই কোর্সটি মুছে ফেলবেন? এর ব্যাচ ও সিলেবাসও মুছে যাবে।"
          />
        </div>
      </Card>

      <Card>
        <CardHeader
          title="Syllabus Documents"
          subtitle="Upload the PDF syllabus for each class type — shown on the public academic page"
        />
        <div className="grid gap-6 p-5 md:grid-cols-3">
          {SYLLABUS_KINDS.map(({ kind, label }) => {
            const doc = syllabusDocs.find((d) => d.syllabus_kind === kind);
            return (
              <div key={kind} className="space-y-3 rounded-xl border border-slate-200 p-4">
                <p className="text-sm font-semibold text-slate-800">{label}</p>
                {doc?.url && (
                  <a
                    href={doc.url}
                    target="_blank"
                    rel="noreferrer"
                    className="block truncate text-sm font-medium text-brand-600 hover:underline"
                  >
                    📎 Current PDF
                  </a>
                )}
                <form action={uploadSyllabus} className="space-y-2">
                  <input type="hidden" name="course_id" value={id} />
                  <input type="hidden" name="syllabus_kind" value={kind} />
                  <FileUpload name="file_url" bucket="resources" kind="file" />
                  <Button type="submit" variant="secondary" className="w-full text-sm">
                    {doc ? "Replace PDF" : "Upload PDF"}
                  </Button>
                </form>
                {doc && (
                  <form action={deleteSyllabus}>
                    <input type="hidden" name="id" value={doc.id} />
                    <input type="hidden" name="course_id" value={id} />
                    <Button variant="ghost" className="w-full text-xs text-red-600">
                      Remove
                    </Button>
                  </form>
                )}
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}
