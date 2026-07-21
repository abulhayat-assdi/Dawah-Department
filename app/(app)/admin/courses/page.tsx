import Link from "next/link";
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
import { COURSE_CATEGORY_LABEL } from "@/lib/constants";
import { toBn } from "@/lib/utils";
import { createCourse, deleteCourse } from "./actions";
import type { Course } from "@/lib/types";

export default async function CoursesPage() {
  await requireAdmin();
  const supabase = await createClient();
  const { data: courseData } = await supabase
    .from("courses")
    .select("*")
    .order("abbreviation");
  const courses = (courseData ?? []) as Course[];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Courses & Syllabus"
        subtitle="Manage the master course list and its syllabus documents."
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader title="Course List" subtitle={`${courses.length} total`} />
          {courses.length === 0 ? (
            <EmptyState icon="📚" title="No courses yet" />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] text-sm">
                <thead>
                  <tr className="border-b border-slate-100 text-left text-xs font-semibold uppercase text-slate-500">
                    <th className="px-4 py-3">Code</th>
                    <th className="px-4 py-3">Course</th>
                    <th className="px-4 py-3 text-center">Classes</th>
                    <th className="px-4 py-3"></th>
                  </tr>
                </thead>
                <tbody>
                  {courses.map((c) => (
                    <tr key={c.id} className="border-b border-slate-50">
                      <td className="px-4 py-3 font-bold text-brand-700">
                        {c.abbreviation}
                      </td>
                      <td className="px-4 py-3">
                        <Link
                          href={`/admin/courses/${c.id}`}
                          className="font-medium text-slate-800 hover:text-brand-600"
                        >
                          {c.name}
                        </Link>
                        <p className="text-xs text-slate-400">
                          {COURSE_CATEGORY_LABEL[c.category]} · {c.duration_label}
                        </p>
                      </td>
                      <td className="px-4 py-3 text-center text-slate-600">
                        {toBn(c.default_total_classes)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <form action={deleteCourse}>
                          <input type="hidden" name="id" value={c.id} />
                          <Button variant="ghost" className="text-xs text-red-600">
                            Delete
                          </Button>
                        </form>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        <Card className="h-fit">
          <CardHeader title="New Course" />
          <form action={createCourse} className="space-y-4 p-5">
            <div>
              <Label htmlFor="name">Course Name</Label>
              <Input id="name" name="name" required />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="abbreviation">Code</Label>
                <Input id="abbreviation" name="abbreviation" required placeholder="SSELP" />
              </div>
              <div>
                <Label htmlFor="duration_label">Duration</Label>
                <Input id="duration_label" name="duration_label" placeholder="3 months" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="category">Category</Label>
                <Select id="category" name="category" defaultValue="common">
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
                  defaultValue={0}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea id="description" name="description" />
            </div>
            <Button type="submit" className="w-full">
              Add Course
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
}
