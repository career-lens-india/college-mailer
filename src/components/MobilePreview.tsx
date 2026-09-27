import type { ReactNode } from "react";
import { PreviewChrome } from "./DesktopPreview.tsx";

export function MobilePreview({ children }: { children: ReactNode }) {
  return (
    <div className="mx-auto w-full max-w-[375px]">
      <PreviewChrome>{children}</PreviewChrome>
    </div>
  );
}
