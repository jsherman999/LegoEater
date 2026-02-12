import { Outlet, createRootRoute } from "@tanstack/react-router";
import { MobileNav } from "../components/layout/MobileNav";

function RootComponent() {
  return (
    <>
      <main className="mx-auto min-h-screen max-w-4xl px-4 pb-24 pt-4">
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

export const rootRoute = createRootRoute({
  component: RootComponent
});
