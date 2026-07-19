import { ArrowRight } from "lucide-react";
import React from "react";
import { cn } from "@/lib/utils";

export const SelectZonesButton = React.forwardRef<HTMLButtonElement, React.ButtonHTMLAttributes<HTMLButtonElement>>(
  ({ className, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          "relative group/btn flex items-center h-12 rounded-full bg-[#5047e4] pe-14 ps-6 text-white shadow-md transition-all duration-500 cursor-pointer hover:bg-[#433ac4] hover:ps-14 hover:pe-6 overflow-hidden w-fit",
          className
        )}
        {...props}
      >
        <span className="relative z-10 font-medium text-sm md:text-base transition-all duration-500">
          Select Zones
        </span>

        <div className="absolute right-1 top-1 flex h-10 w-10 items-center justify-center rounded-full bg-white text-[#5047e4] transition-all duration-500 group-hover/btn:right-[calc(100%-44px)]">
          <ArrowRight size={18} strokeWidth={2.5} />
        </div>
      </button>
    );
  }
);

SelectZonesButton.displayName = "SelectZonesButton";
