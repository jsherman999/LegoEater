import { Link, useRouterState } from "@tanstack/react-router";

const links = [
  { to: "/", label: "Home" },
  { to: "/inventory", label: "Inventory" },
  { to: "/add", label: "Add" },
  { to: "/reports", label: "Reports" },
  { to: "/settings", label: "Settings" }
] as const;

export function MobileNav() {
  const pathname = useRouterState({
    select: (state) => state.location.pathname
  });

  return (
    <nav className="fixed bottom-0 left-0 right-0 border-t border-gray-200 bg-white px-2 py-2">
      <ul className="mx-auto flex max-w-4xl items-center justify-between">
        {links.map((link) => {
          const active = pathname === link.to;
          return (
            <li key={link.to}>
              <Link
                to={link.to}
                className={`rounded-md px-3 py-2 text-sm font-semibold ${active ? "bg-red-100 text-red-700" : "text-gray-600"}`}
              >
                {link.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
