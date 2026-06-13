"use client";

import { useState } from "react";
import { clsx } from "@/lib/utils";
import { Card } from "@/components/ui";
import { SectionForm } from "@/components/cms/section-form";
import { CMS_TABS } from "@/lib/cms-schema";

export function ContentTabs({
  data,
}: {
  data: Record<string, Record<string, unknown>>;
}) {
  const [active, setActive] = useState(CMS_TABS[0].key);
  const tab = CMS_TABS.find((t) => t.key === active)!;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap gap-2">
        {CMS_TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setActive(t.key)}
            className={clsx(
              "rounded-xl px-4 py-2 text-sm font-semibold transition",
              active === t.key
                ? "bg-brand-700 text-white shadow-sm"
                : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50",
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      <Card className="p-6">
        <SectionForm
          key={tab.key}
          sectionKey={tab.key}
          fields={tab.fields}
          initial={data[tab.key] ?? {}}
        />
      </Card>
    </div>
  );
}
