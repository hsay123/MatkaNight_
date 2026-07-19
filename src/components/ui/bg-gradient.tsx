import { cn } from "@/lib/utils";
import React from "react";

interface BgGradientProps {
  className?: string;
  gradientSize?: string;
  gradientPosition?: string;
  gradientStop?: string;
}

export const BgGradient = ({
  className,
  gradientSize = "150% 100%",
  gradientPosition = "50% 0%",
  gradientStop = "25%"
}: BgGradientProps) => {
  return (
    <div
      className={cn("absolute inset-0 w-full h-full -z-10 pointer-events-none hero-bg-gradient", className)}
      style={{
        "--grad-size": gradientSize,
        "--grad-pos": gradientPosition,
        "--grad-stop": gradientStop,
      } as React.CSSProperties}
    />
  );
};
