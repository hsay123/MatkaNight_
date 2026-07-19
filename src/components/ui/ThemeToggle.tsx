import * as React from "react";
import { ThemeProvider as NextThemesProvider, useTheme } from "next-themes";
import type { ThemeProviderProps } from "next-themes";
import { useReducedMotion } from "framer-motion";
import { Sun, Moon } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";

const VT_STYLE_ID = "be-theme-toggle-vt";

const VT_CSS = `
@keyframes theme-toggle-circle-in {
  from {
    clip-path: circle(0% at 50% 50%);
  }
  to {
    clip-path: circle(150% at 50% 50%);
  }
}

::view-transition-old(root),
::view-transition-new(root) {
  animation: none;
  mix-blend-mode: normal;
}

::view-transition-new(root) {
  animation: theme-toggle-circle-in 0.4s cubic-bezier(0.4, 0, 0.2, 1) forwards;
}
`;

function ensureVTStyles() {
  if (typeof document === "undefined") return;
  if (document.getElementById(VT_STYLE_ID)) return;
  const style = document.createElement("style");
  style.id = VT_STYLE_ID;
  style.textContent = VT_CSS;
  document.head.appendChild(style);
}

function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  React.useEffect(() => {
    ensureVTStyles();
  }, []);
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>;
}

interface ThemeToggleProps {
  variant?: "circle-blur";
  className?: string;
  iconClassName?: string;
}

function ThemeToggle({
  className,
  iconClassName,
}: ThemeToggleProps) {
  const [mounted, setMounted] = React.useState(false);
  const shouldReduceMotion = useReducedMotion();

  React.useEffect(() => {
    setMounted(true);
    ensureVTStyles();
  }, []);

  if (!mounted) {
    return <div className={cn("w-9 h-9", className)} />;
  }

  return (
    <CircleBlurToggle
      className={className}
      iconClassName={iconClassName}
      disableAnimation={!!shouldReduceMotion}
    />
  );
}

function CircleBlurToggle({
  className,
  iconClassName,
  disableAnimation,
}: {
  className?: string;
  iconClassName?: string;
  disableAnimation: boolean;
}) {
  const { theme, setTheme } = useTheme();
  const isDark = theme === "dark";

  const handleToggle = React.useCallback(() => {
    const next = isDark ? "light" : "dark";

    if (disableAnimation || !document.startViewTransition) {
      setTheme(next);
      return;
    }

    document.startViewTransition(() => {
      setTheme(next);
    });
  }, [isDark, disableAnimation, setTheme]);

  return (
    <button
      onClick={handleToggle}
      className={cn(
        "relative flex items-center justify-center w-9 h-9 rounded-full",
        "bg-surface-2/50 border border-surface-3/50 hover:border-indigo-pulse/30",
        "transition-colors duration-200 cursor-pointer",
        className
      )}
      aria-label={`Switch to ${isDark ? "light" : "dark"} theme`}
    >
      {isDark ? (
        <Moon size={18} weight="duotone" className={cn("text-indigo-pulse", iconClassName)} />
      ) : (
        <Sun size={18} weight="duotone" className={cn("text-amber-400", iconClassName)} />
      )}
    </button>
  );
}

export { ThemeToggle, ThemeProvider, useTheme };
