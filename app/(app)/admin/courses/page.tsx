import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Card, CardHeader, PageHeader, Input, Button } from "@/components/ui";
import { DeleteButton } from "@/components/delete-button";
import { FileUpload } from "@/components/file-upload";
import {
  createSyllabusDocument,
  updateSyllabusDocumentFile,
  deleteSyllabusDocument,
} from "./actions";
import type { SyllabusDocument } from "@/lib/types";

export default async function CoursesPage() {
  await requireAdmin();
  const supabase = await createClient();
  const { data: syllabusData } = await supabase
    .from("syllabus_documents")
    .select("*")
    .order("sort_order");
  const syllabusDocs = (syllabusData ?? []) as SyllabusDocument[];

  return (
    <div className="space-y-6">
      <PageHeader title="Courses & Syllabus" subtitle="Manage the syllabus library." />

      <Card>
        <CardHeader
          title="Syllabus Library"
          subtitle="Add or remove syllabus PDFs yourself — not tied to any single course. Shown on the public academic page."
        />
        <div className="grid gap-6 p-5 md:grid-cols-2 lg:grid-cols-3">
          {syllabusDocs.map((doc) => (
            <div key={doc.id} className="space-y-3 rounded-xl border border-slate-200 p-4">
              <p className="text-sm font-semibold text-slate-800">{doc.title}</p>
              {doc.url && (
                <a
                  href={doc.url}
                  target="_blank"
                  rel="noreferrer"
                  className="block truncate text-sm font-medium text-brand-600 hover:underline"
                >
                  📎 Current PDF
                </a>
              )}
              <form action={updateSyllabusDocumentFile} className="space-y-2">
                <input type="hidden" name="id" value={doc.id} />
                <FileUpload name="file_url" bucket="resources" kind="file" autoSubmit />
                <p className="text-xs text-slate-400">
                  Selecting a file saves it right away — no extra click needed.
                </p>
              </form>
              <DeleteButton
                action={deleteSyllabusDocument}
                id={doc.id}
                label="Delete"
                confirmText="এই সিলেবাসটি মুছে ফেলবেন?"
                className="w-full text-xs"
              />
            </div>
          ))}

          <div className="space-y-3 rounded-xl border border-dashed border-slate-300 p-4">
            <p className="text-sm font-semibold text-slate-800">Add New Syllabus</p>
            <form action={createSyllabusDocument} className="space-y-2">
              <Input name="title" required placeholder="e.g. আলেম শিক্ষার্থী সিলেবাস" />
              <FileUpload name="file_url" bucket="resources" kind="file" />
              <Button type="submit" className="w-full text-sm">
                Add Syllabus
              </Button>
            </form>
          </div>
        </div>
      </Card>
    </div>
  );
}
