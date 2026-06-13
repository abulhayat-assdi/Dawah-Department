import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import {
  Card,
  CardHeader,
  PageHeader,
  Label,
  Input,
  Select,
  Button,
  EmptyState,
} from "@/components/ui";
import { FileUpload } from "@/components/file-upload";
import { createResource, deleteResource } from "./actions";
import type { Course } from "@/lib/types";

interface Resource {
  id: string;
  title: string;
  type: string;
  url: string | null;
  course_id: string | null;
}

const TYPE_ICON: Record<string, string> = {
  slide: "📑",
  pdf: "📄",
  book: "📚",
  link: "🔗",
  video: "🎬",
};

export default async function ResourcesPage() {
  await requireAdmin();
  const supabase = await createClient();
  const [{ data: resData }, { data: courseData }] = await Promise.all([
    supabase.from("resources").select("*").order("created_at", { ascending: false }),
    supabase.from("courses").select("*").order("abbreviation"),
  ]);
  const resources = (resData ?? []) as Resource[];
  const courses = (courseData ?? []) as Course[];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Resource Center"
        subtitle="A digital library of Dawah slides, PDFs, books and links."
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader title="Resource List" subtitle={`${resources.length} total`} />
          {resources.length === 0 ? (
            <EmptyState icon="📁" title="No resources yet" />
          ) : (
            <ul className="divide-y divide-slate-50">
              {resources.map((r) => (
                <li
                  key={r.id}
                  className="flex items-center justify-between gap-3 px-5 py-3.5"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{TYPE_ICON[r.type] ?? "📄"}</span>
                    <div>
                      {r.url ? (
                        <a
                          href={r.url}
                          target="_blank"
                          rel="noreferrer"
                          className="font-medium text-slate-800 hover:text-brand-600"
                        >
                          {r.title}
                        </a>
                      ) : (
                        <p className="font-medium text-slate-800">{r.title}</p>
                      )}
                      <p className="text-xs uppercase text-slate-400">{r.type}</p>
                    </div>
                  </div>
                  <form action={deleteResource}>
                    <input type="hidden" name="id" value={r.id} />
                    <Button variant="ghost" className="text-xs text-red-600">
                      Delete
                    </Button>
                  </form>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card className="h-fit">
          <CardHeader title="New Resource" />
          <form action={createResource} className="space-y-4 p-5">
            <div>
              <Label htmlFor="title">Title</Label>
              <Input id="title" name="title" required />
            </div>
            <div>
              <Label htmlFor="type">Type</Label>
              <Select id="type" name="type" defaultValue="pdf">
                <option value="pdf">PDF</option>
                <option value="slide">Slide</option>
                <option value="book">Book</option>
                <option value="link">Link</option>
                <option value="video">Video</option>
              </Select>
            </div>
            <div>
              <FileUpload
                name="file_url"
                bucket="resources"
                kind="file"
                label="Upload File (PDF, slide, etc.)"
              />
            </div>
            <div>
              <Label htmlFor="url">Or paste a Link / URL</Label>
              <Input id="url" name="url" type="url" placeholder="https://" />
            </div>
            <div>
              <Label htmlFor="course_id">Related Course (optional)</Label>
              <Select id="course_id" name="course_id" defaultValue="">
                <option value="">— None —</option>
                {courses.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.abbreviation}
                  </option>
                ))}
              </Select>
            </div>
            <Button type="submit" className="w-full">
              Add
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
}
