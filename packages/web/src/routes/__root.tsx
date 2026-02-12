import { Outlet, createRootRoute } from "@tanstack/react-router";
import { MobileNav } from "../components/layout/MobileNav";

function RootComponent() {
  return (
    <>
      <main className="page-enter mx-auto min-h-screen max-w-4xl px-4 pb-24 pt-4">
        <header className="mb-6 rounded-xl bg-red-600 px-4 py-3 text-white shadow">
          <h1 className="text-xl font-black tracking-wide">LegoEater</h1>
          <p className="text-sm text-red-100">Family LEGO Inventory</p>
        </header>
        <Outlet />
      </main>
      <MobileNav />
    </>
  );
}

function RootError({ error }: { error: unknown }) {
  const message = error instanceof Error ? error.message : "Unexpected error";
  return (
    <main className="mx-auto min-h-screen max-w-3xl px-4 py-8">
      <article className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
        <h2 className="text-base font-bold">Something went wrong</h2>
        <p className="mt-2">{message}</p>
      </article>
    </main>
  );
}

export const rootRoute = createRootRoute({
  component: RootComponent,
  errorComponent: RootError
});
