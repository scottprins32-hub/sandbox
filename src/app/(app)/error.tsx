"use client";

// Route-level error boundary for the admin app.
//
// In production Next.js redacts server error messages before they reach this
// component, so nothing here can branch on WHAT failed — the layout's amber
// database banner is where the real cause and the exact fix are shown, from
// the server side where the truth is knowable. This copy just points at it.
// The message check still works in dev, where messages come through.
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
      <h1 className="text-lg font-semibold">This screen couldn&rsquo;t load.</h1>
      <p className="mt-2 text-sm text-ink-soft">
        {unseeded
          ? "The database has no data yet. Run `npm run seed` in the project folder, then reload."
          : "If there is an amber banner at the top of the page, this screen needs the database — follow the banner and it will come back. Otherwise the error was logged: try again, and if it persists check the server logs."}
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
