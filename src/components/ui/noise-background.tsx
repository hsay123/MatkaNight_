import { cn } from "@/lib/utils";

interface NoiseBackgroundProps {
  className?: string;
}

export const NoiseBackground = ({ className }: NoiseBackgroundProps) => {
  return (
    <div
      className={cn(
        "absolute inset-0 w-full h-full -z-10 pointer-events-none hero-noise-bg",
        className
      )}
    />
  );
};
