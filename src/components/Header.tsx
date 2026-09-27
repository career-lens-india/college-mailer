import { appImages } from "../brand/assets.ts";

type HeaderProps = {
  onLogout?: () => void;
};

export function Header({ onLogout }: HeaderProps) {
  return (
    <header className="z-30 shrink-0 border-b border-line/80 bg-white/90 backdrop-blur-md">
      <div className="h-1 bg-gradient-to-r from-navy via-teal to-orange" />
      <div className="mx-auto flex max-w-[90rem] items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
        <div className="flex min-w-0 items-center gap-3">
          <img
            src={appImages.markUrl}
            alt=""
            width={48}
            height={55}
            className="h-11 w-auto shrink-0"
          />
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold leading-tight text-navy sm:text-base">
              CareerLens India
            </p>
            <p className="truncate text-xs text-teal">Industry × Academia</p>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-4">
          <p className="text-right text-sm font-semibold text-navy">College Mailer</p>
          {onLogout ? (
            <button
              type="button"
              onClick={onLogout}
              className="text-xs font-semibold text-muted underline-offset-2 hover:text-navy hover:underline focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-teal/30"
            >
              Logout
            </button>
          ) : null}
        </div>
      </div>
    </header>
  );
}
