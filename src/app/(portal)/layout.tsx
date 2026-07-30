import "../globals.css";

// The cleaner portal is Romanian-first (§0 language rule) and phone-first: no
// admin chrome, its own root so <html lang="ro">.
export default function PortalLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ro">
      <body>{children}</body>
    </html>
  );
}
