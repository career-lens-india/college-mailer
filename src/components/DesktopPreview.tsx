import type { ReactNode } from "react";

export function PreviewChrome({ children }: { children: ReactNode }) {
  return (
    <div className="overflow-hidden rounded-xl bg-white shadow-[0_24px_50px_-28px_rgba(12,35,64,0.55)] ring-1 ring-[#0c2340]/10">
      {children}
    </div>
  );
}
