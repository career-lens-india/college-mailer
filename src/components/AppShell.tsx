import type { ReactNode } from "react";
import { Header } from "./Header.tsx";

type AppShellProps = {
  children: ReactNode;
  workspace?: boolean;
  onLogout?: () => void;
};

export function AppShell({ children, workspace = false, onLogout }: AppShellProps) {
  return (
    <div className={workspace ? "flex min-h-screen w-full min-w-0 flex-1 flex-col lg:h-full lg:min-h-0 lg:overflow-hidden" : "min-h-screen"}>
      <a
        href="#outreach"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-white focus:px-3 focus:py-2 focus:text-sm focus:font-semibold focus:text-navy focus:shadow-lg"
      >
        Skip to outreach form
      </a>
      <Header onLogout={onLogout} />
      <main
        id="outreach"
        className={
          workspace
            ? "mx-auto flex w-full max-w-[90rem] flex-1 flex-col px-4 py-4 sm:px-6 lg:min-h-0 lg:overflow-hidden lg:px-8 lg:py-4"
            : "mx-auto max-w-[90rem] px-4 py-8 sm:px-6 sm:py-10 lg:px-8 lg:py-12"
        }
      >
        {children}
      </main>
    </div>
  );
}
