"use client";

import { useState } from "react";
import { Card, CardHeader, Button } from "@/components/ui";
import type { CampusRoutine } from "@/lib/types";
import { RoutineBuilder } from "./routine-builder";
import {
  RoutineViewer,
  type CampusOpt,
  type CourseOpt,
  type RoutineBatch,
} from "./routine-viewer";

export function RoutinePageClient({
  campuses,
  courses,
  batches,
  routines,
  canEdit,
  builderCampuses,
  builderBatches,
}: {
  campuses: CampusOpt[];
  courses: CourseOpt[];
  batches: RoutineBatch[];
  routines: CampusRoutine[];
  canEdit: boolean;
  builderCampuses: CampusOpt[];
  builderBatches: RoutineBatch[];
}) {
  const [showBuilder, setShowBuilder] = useState(false);

  return (
    <div className="space-y-6">
      {canEdit && (
        <div className="flex justify-end">
          <Button onClick={() => setShowBuilder((v) => !v)}>
            {showBuilder ? "Close" : "Add Schedule"}
          </Button>
        </div>
      )}

      {canEdit && showBuilder && (
        <Card>
          <CardHeader
            title="Schedule Builder"
            subtitle="Select a campus and batch, then set the weekly Quran & Dawah class timings. Saving an existing batch updates its routine."
          />
          <RoutineBuilder
            campuses={builderCampuses}
            batches={builderBatches}
            routines={routines}
            onSaved={() => setShowBuilder(false)}
          />
        </Card>
      )}

      <RoutineViewer
        campuses={campuses}
        courses={courses}
        batches={batches}
        routines={routines}
        canEdit={canEdit}
      />
    </div>
  );
}
