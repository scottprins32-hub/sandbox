"use client";

// Route-level error boundary for the admin app. The most common cause on a
// fresh clone is an unseeded database — say so instead of a stack trace.
export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const unseeded = error.message.includes("npm run seed");
  return (
    <div className="mx-auto max-w-md py-24 text-center">
      <h1 className="text-lg font-semibold">Something broke.</h1>
      <p className="mt-2 text-sm text-ink-soft">
        {unseeded
          ? "The database has no data yet. Run `npm run seed` in the project folder, then reload."
          : "The error was logged. Try again; if it persists, check the server logs."}
      </p>
      <button
        onClick={reset}
        className="mt-4 rounded-md border border-line bg-surface px-4 py-2 text-sm text-ink-soft"
      >
        Try again
      </button>
    </div>
  );
}
