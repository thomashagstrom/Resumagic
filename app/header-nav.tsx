import Link from "next/link";

export const navLinks = [{ href: "/dashboard", label: "My CV & portfolio" }];

export function HeaderNav() {
  return (
    <nav aria-label="Primary" className="hidden items-center gap-6 sm:flex">
      {navLinks.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          className="text-sm font-medium text-black hover:underline dark:text-zinc-50"
        >
          {link.label}
        </Link>
      ))}
    </nav>
  );
}
