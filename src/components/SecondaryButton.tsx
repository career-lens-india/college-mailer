import type { ReactNode } from "react";

type ButtonProps = {
  children: ReactNode;
  type?: "button" | "submit";
  onClick?: () => void;
  disabled?: boolean;
  id?: string;
};

export function SecondaryButton({ children, type = "button", onClick, disabled, id }: ButtonProps) {
  return (
    <button
      id={id}
      type={type}
      onClick={onClick}
      disabled={disabled}
      className="inline-flex w-full items-center justify-center rounded-xl border border-line bg-white px-5 py-3 text-sm font-semibold text-navy shadow-sm transition hover:bg-[#f6f8fb] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-teal/25 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
    >
      {children}
    </button>
  );
}
