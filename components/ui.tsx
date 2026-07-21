import { clsx } from "@/lib/utils";
import type { ReactNode } from "react";
import {
  BATCH_STATUS,
  EXAM_STATUS,
  TASK_STATUS,
} from "@/lib/constants";
import type { BatchStatus, ExamStatus, TaskStatus } from "@/lib/types";

/* ----------------------------------------------------------------- Card */
export function Card({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={clsx(
        "rounded-2xl border border-slate-200 bg-white shadow-sm",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function CardHeader({
  title,
  subtitle,
  action,
}: {
  title: ReactNode;
  subtitle?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-3 border-b border-slate-100 px-5 py-4">
      <div>
        <h3 className="text-base font-semibold text-slate-900">{title}</h3>
        {subtitle && (
          <p className="mt-0.5 text-sm text-slate-500">{subtitle}</p>
        )}
      </div>
      {action}
    </div>
  );
}

/* --------------------------------------------------------------- Stat card */
export function StatCard({
  label,
  value,
  icon,
  accent = "brand",
}: {
  label: string;
  value: ReactNode;
  icon?: ReactNode;
  accent?: "brand" | "green" | "blue" | "yellow" | "red";
}) {
  const accents: Record<string, string> = {
    brand: "bg-brand-50 text-brand-600",
    green: "bg-green-50 text-green-600",
    blue: "bg-blue-50 text-blue-600",
    yellow: "bg-yellow-50 text-yellow-600",
    red: "bg-red-50 text-red-600",
  };
  return (
    <Card className="p-5">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-slate-500">{label}</p>
        {icon && (
          <span
            className={clsx(
              "grid size-9 place-items-center rounded-xl text-lg",
              accents[accent],
            )}
          >
            {icon}
          </span>
        )}
      </div>
      <p className="mt-2 text-center text-3xl font-bold text-slate-900">{value}</p>
    </Card>
  );
}

/* --------------------------------------------------------------- Progress */
export function ProgressBar({
  value,
  className,
}: {
  value: number;
  className?: string;
}) {
  const pct = Math.max(0, Math.min(100, value));
  const gradient =
    pct >= 100
      ? "from-green-400 to-green-600"
      : pct >= 50
        ? "from-brand-400 to-brand-600"
        : "from-yellow-400 to-yellow-500";
  return (
    <div className={clsx("flex items-center gap-2", className)}>
      <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-slate-100 shadow-inner">
        <div
          className={clsx(
            "h-full rounded-full bg-gradient-to-r transition-all duration-700 ease-out",
            gradient,
          )}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="w-10 text-right text-xs font-semibold text-slate-600">
        {pct}%
      </span>
    </div>
  );
}

/* ----------------------------------------------------------------- Badges */
function Pill({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={clsx(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium",
        className,
      )}
    >
      {children}
    </span>
  );
}

export function ExamBadge({ status }: { status: ExamStatus }) {
  const s = EXAM_STATUS[status];
  return <Pill className={clsx(s.bg, s.text)}>{s.label}</Pill>;
}

export function BatchStatusBadge({ status }: { status: BatchStatus }) {
  const s = BATCH_STATUS[status];
  return <Pill className={clsx(s.bg, s.text)}>{s.label}</Pill>;
}

export function TaskStatusBadge({ status }: { status: TaskStatus }) {
  const s = TASK_STATUS[status];
  return <Pill className={clsx(s.bg, s.text)}>{s.label}</Pill>;
}

/* ----------------------------------------------------------------- Inputs */
export function Label({
  children,
  htmlFor,
}: {
  children: ReactNode;
  htmlFor?: string;
}) {
  return (
    <label
      htmlFor={htmlFor}
      className="mb-1.5 block text-sm font-medium text-slate-700"
    >
      {children}
    </label>
  );
}

const fieldClass =
  "w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-brand-600 focus:ring-2 focus:ring-brand-100 disabled:bg-slate-50";

export function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={clsx(fieldClass, props.className)} />;
}

export function Textarea(
  props: React.TextareaHTMLAttributes<HTMLTextAreaElement>,
) {
  return (
    <textarea
      {...props}
      className={clsx(fieldClass, "min-h-24", props.className)}
    />
  );
}

export function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className={clsx(fieldClass, props.className)} />;
}

/* ---------------------------------------------------------------- Buttons */
type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";

const buttonVariants: Record<ButtonVariant, string> = {
  // Gold CTA on dark text — matches the reference site's primary button.
  primary:
    "bg-gold-400 text-brand-900 hover:bg-gold-500 shadow-sm ring-1 ring-gold-600/20",
  secondary: "bg-white text-slate-700 border border-slate-300 hover:bg-slate-50",
  ghost: "text-slate-600 hover:bg-slate-100",
  danger: "bg-red-600 text-white hover:bg-red-700",
};

export function Button({
  variant = "primary",
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
}) {
  return (
    <button
      {...props}
      className={clsx(
        "inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60",
        buttonVariants[variant],
        className,
      )}
    />
  );
}

/* --------------------------------------------------------------- EmptyState */
export function EmptyState({
  icon = "📭",
  title,
  hint,
}: {
  icon?: string;
  title: string;
  hint?: string;
}) {
  return (
    <div className="grid place-items-center px-6 py-14 text-center">
      <div className="text-4xl">{icon}</div>
      <p className="mt-3 font-semibold text-slate-700">{title}</p>
      {hint && <p className="mt-1 text-sm text-slate-500">{hint}</p>}
    </div>
  );
}

/* ------------------------------------------------------------- Page header */
export function PageHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-slate-500">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}
