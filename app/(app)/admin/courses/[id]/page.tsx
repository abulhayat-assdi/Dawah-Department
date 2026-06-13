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
  EmptyState,
} from "@/components/ui";
import { toBn } from "@/lib/utils";
import { COURSE_CATEGORY_LABEL } from "@/lib/constants";
import { DeleteButton } from "@/components/delete-button";
import { addTopic, deleteTopic, updateCourse, deleteCourse } from "../actions";
import type { Campus, Course } from "@/lib/types";

interface Topic {
  id: string;
  sequence: number;
  title: string;
  description: string | null;
}

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

  const [{ data: topicData }, { data: campusData }] = await Promise.all([
    supabase.from("syllabus_topics").select("*").eq("course_id", id).order("sequence"),
    supabase.from("campuses").select("*").order("name"),
  ]);
  const topics = (topicData ?? []) as Topic[];
  const campuses = (campusData ?? []) as Campus[];
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
          <div>
            <Label htmlFor="campus_id">Campus</Label>
            <Select id="campus_id" name="campus_id" defaultValue={c.campus_id ?? ""}>
              <option value="">— Select —</option>
              {campuses.map((cm) => (
                <option key={cm.id} value={cm.id}>
                  {cm.name}
                </option>
              ))}
            </Select>
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
          <div className="flex items-center gap-3 md:col-span-2">
            <Button type="submit">Save changes</Button>
            <DeleteButton
              action={deleteCourse}
              id={id}
              label="Delete course"
              confirmText="এই কোর্সটি মুছে ফেলবেন? এর ব্যাচ ও সিলেবাসও মুছে যাবে।"
            />
          </div>
        </form>
      </Card>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader
            title="Syllabus / Curriculum"
            subtitle={`${topics.length} topic(s)`}
          />
          {topics.length === 0 ? (
            <EmptyState icon="📖" title="No topics added yet" />
          ) : (
            <ol className="divide-y divide-slate-50">
              {topics.map((t) => (
                <li
                  key={t.id}
                  className="flex items-start justify-between gap-3 px-5 py-3.5"
                >
                  <div className="flex gap-3">
                    <span className="grid size-7 shrink-0 place-items-center rounded-lg bg-brand-50 text-xs font-bold text-brand-700">
                      {toBn(t.sequence)}
                    </span>
                    <div>
                      <p className="font-medium text-slate-800">{t.title}</p>
                      {t.description && (
                        <p className="text-sm text-slate-500">{t.description}</p>
                      )}
                    </div>
                  </div>
                  <form action={deleteTopic}>
                    <input type="hidden" name="id" value={t.id} />
                    <input type="hidden" name="course_id" value={id} />
                    <Button variant="ghost" className="text-xs text-red-600">
                      Delete
                    </Button>
                  </form>
                </li>
              ))}
            </ol>
          )}
        </Card>

        <Card className="h-fit">
          <CardHeader title="New Topic" />
          <form action={addTopic} className="space-y-4 p-5">
            <input type="hidden" name="course_id" value={id} />
            <div>
              <Label htmlFor="sequence">Sequence No.</Label>
              <Input
                id="sequence"
                name="sequence"
                type="number"
                defaultValue={topics.length + 1}
              />
            </div>
            <div>
              <Label htmlFor="title">Topic Title</Label>
              <Input id="title" name="title" required />
            </div>
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea id="description" name="description" />
            </div>
            <Button type="submit" className="w-full">
              Add Topic
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
}
