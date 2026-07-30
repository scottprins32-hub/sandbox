import "../globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Scara · Curățenie cu dovadă",
  description:
    "Scara curăță blocuri în Giroc și Timișoara, cu fotografii la fiecare vizită și proces-verbal semnat în fiecare lună.",
  openGraph: {
    title: "Scara · Curățenie cu dovadă",
    description:
      "Curățenie de scări de bloc în Giroc și Timișoara, cu fotografii datate și proces-verbal lunar semnat.",
    type: "website",
    locale: "ro_RO",
    siteName: "Scara",
  },
};

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ro">
      <body>{children}</body>
    </html>
  );
}
