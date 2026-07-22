"use client";

import { useState } from "react";
import { Card, CardHeader, Button } from "@/components/ui";
import {
  AssignmentBuilder,
  type AssignmentOpt,
  type TeacherBatchOpt,
  type TeacherOpt,
} from "./assignment-builder";

export function AdminLessonPlanClient({
  teachers,
  teacherBatches,
  assignments,
}: {
  teachers: TeacherOpt[];
  teacherBatches: TeacherBatchOpt[];
  assignments: AssignmentOpt[];
}) {
  const [showBuilder, setShowBuilder] = useState(false);

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <Button onClick={() => setShowBuilder((v) => !v)}>
          {showBuilder ? "Close" : "Assign Monthly Batches"}
        </Button>
      </div>

      {showBuilder && (
        <Card>
          <CardHeader
            title="Assign Monthly Batches"
            subtitle="Pick a teacher and month, then check which of their batches they should submit a weekly plan for. Saving replaces that teacher's assignment for the month."
          />
          <AssignmentBuilder
            teachers={teachers}
            teacherBatches={teacherBatches}
            assignments={assignments}
            onSaved={() => setShowBuilder(false)}
          />
        </Card>
      )}
    </div>
  );
}
