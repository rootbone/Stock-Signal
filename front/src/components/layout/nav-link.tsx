"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type Props = {
  href: string;
  label: string;
  exact?: boolean;
};

export function NavLink({ href, label, exact = false }: Props) {
  const pathname = usePathname();

  const active = exact ? pathname === href : pathname.startsWith(href);

  return (
    <Link
      href={href}
      className={`rounded-xl px-3 py-2 text-sm font-medium transition ${
        active
          ? "bg-[var(--foreground)] text-[var(--background)] shadow-sm"
          : "text-[var(--muted-foreground)] hover:bg-[var(--card)] hover:text-[var(--foreground)]"
      }`}
    >
      {label}
    </Link>
  );
}