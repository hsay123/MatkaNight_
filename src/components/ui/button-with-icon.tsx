import { ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ButtonHTMLAttributes } from "react";

interface ButtonWithIconProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  text: string;
  loading?: boolean;
}

export function ButtonWithIcon({ text, className, loading, disabled, ...props }: ButtonWithIconProps) {
  return (
    <button
      className={cn(
        "relative text-sm font-medium rounded-full h-10 flex items-center justify-center overflow-hidden cursor-pointer bg-[#5047e4] text-white hover:bg-[#5047e4]/90 border-none group transition-all duration-500 disabled:opacity-40 disabled:cursor-not-allowed",
        "!p-1 !pl-5 !pr-12 hover:!pl-12 hover:!pr-5",
        className
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <span className="relative z-10 flex items-center justify-center w-full h-full">
          <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        </span>
      ) : (
        <>
          <span className="relative z-10 transition-all duration-500 whitespace-nowrap">
            {text}
          </span>
          <div className="absolute right-1 z-20 w-8 h-8 bg-white text-[#5047e4] rounded-full flex items-center justify-center transition-all duration-500 group-hover:right-[calc(100%-36px)] group-hover:rotate-45">
            <ArrowUpRight size={16} strokeWidth={2.5} />
          </div>
        </>
      )}
    </button>
  );
}
