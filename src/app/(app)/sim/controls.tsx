"use client";

// Control primitives for the Simulator rail. Quiet, dense, touch-friendly.

export function SliderRow({
  label,
  value,
  min,
  max,
  step,
  onChange,
  format,
  children,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
  format?: (v: number) => string;
  children?: React.ReactNode;
}) {
  return (
    <div className="py-2">
      <div className="flex items-baseline justify-between gap-2">
        <label className="text-sm text-ink-soft">{label}</label>
        <span className="tnum text-sm font-medium">{format ? format(value) : value}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        aria-label={label}
      />
      {children}
    </div>
  );
}

export function Segmented<T extends string | number>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: { value: T; label: string }[];
  onChange: (v: T) => void;
}) {
  return (
    <div className="py-2">
      <div className="text-sm text-ink-soft">{label}</div>
      <div className="mt-1.5 inline-flex rounded-lg border border-line bg-surface p-0.5">
        {options.map((o) => (
          <button
            key={String(o.value)}
            type="button"
            onClick={() => onChange(o.value)}
            className={`rounded-md px-3 py-1 text-sm ${
              o.value === value
                ? "bg-moss-deep font-medium text-paper"
                : "text-ink-soft hover:text-ink"
            }`}
            aria-pressed={o.value === value}
          >
            {o.label}
          </button>
        ))}
      </div>
    </div>
  );
}

export function Stepper({
  label,
  value,
  min,
  max,
  onChange,
  suffix,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (v: number) => void;
  suffix?: string;
}) {
  return (
    <div className="flex items-center justify-between py-1.5">
      <span className="text-sm text-ink-soft">{label}</span>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => onChange(Math.max(min, value - 1))}
          disabled={value <= min}
          className="h-7 w-7 rounded-md border border-line bg-surface text-ink-soft disabled:opacity-40"
          aria-label={`Decrease ${label}`}
        >
          −
        </button>
        <span className="tnum w-8 text-center text-sm font-medium">
          {value}
          {suffix}
        </span>
        <button
          type="button"
          onClick={() => onChange(Math.min(max, value + 1))}
          disabled={value >= max}
          className="h-7 w-7 rounded-md border border-line bg-surface text-ink-soft disabled:opacity-40"
          aria-label={`Increase ${label}`}
        >
          +
        </button>
      </div>
    </div>
  );
}

export function NumberField({
  label,
  value,
  onChange,
  step,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  step?: number;
}) {
  return (
    <label className="flex items-center justify-between gap-2 py-1.5 text-sm">
      <span className="text-ink-soft">{label}</span>
      <input
        type="number"
        value={value}
        step={step}
        onChange={(e) => {
          const v = Number(e.target.value);
          if (Number.isFinite(v)) onChange(v);
        }}
        className="tnum w-28 rounded-md border border-line bg-surface px-2 py-1 text-right outline-none focus:border-moss"
      />
    </label>
  );
}

export function Section({
  title,
  children,
  defaultOpen = true,
}: {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  return (
    <details open={defaultOpen} className="group border-b border-line px-4 py-2 last:border-b-0">
      <summary className="cursor-pointer select-none list-none py-1 text-xs font-semibold uppercase tracking-wide text-ink-faint">
        <span className="mr-1 inline-block transition-transform group-open:rotate-90">›</span>
        {title}
      </summary>
      <div className="pb-2">{children}</div>
    </details>
  );
}
