import type { ReactNode } from "react";

type ButtonProps = {
  children: ReactNode;
  type?: "button" | "submit";
  onClick?: () => void;
  disabled?: boolean;
  variant?: "primary" | "danger";
  id?: string;
};

const variants = {
  primary: "bg-navy hover:bg-navy-deep",
  danger: "bg-[#9f1239] hover:bg-[#881337]",
};

export function PrimaryButton({
  children,
  type = "button",
  onClick,
  disabled,
  variant = "primary",
  id,
}: ButtonProps) {
  return (
    <button
      id={id}
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex w-full items-center justify-center rounded-xl px-5 py-3 text-sm font-semibold text-white shadow-sm transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-teal/30 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto ${variants[variant]}`}
    >
      {children}
    </button>
  );
}
