import Link from "next/link";

const OPS_NAV = [
  { href: "/ops", label: "Today" },
  { href: "/ops/buildings", label: "Buildings" },
  { href: "/ops/compliance", label: "Compliance" },
  { href: "/ops/offers", label: "Offers" },
  { href: "/ops/protocols", label: "Protocols" },
  { href: "/ops/payroll", label: "Payroll" },
  { href: "/ops/leads", label: "Leads" },
  { href: "/ops/settings", label: "Settings" },
];

export default function OpsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div>
      <nav className="-mx-4 mb-4 flex gap-1 overflow-x-auto border-b border-line px-4 pb-2 text-sm">
        {OPS_NAV.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="whitespace-nowrap rounded-md px-2.5 py-1 text-ink-soft hover:bg-moss-wash hover:text-ink"
          >
            {item.label}
          </Link>
        ))}
      </nav>
      {children}
    </div>
  );
}
