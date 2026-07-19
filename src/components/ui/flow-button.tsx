import { ArrowRight } from 'lucide-react';
import type { ButtonHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

interface FlowButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  text?: string;
  variant?: 'primary' | 'secondary';
  hideArrow?: boolean;
}

export function FlowButton({ text = 'Modern Button', variant = 'primary', hideArrow = false, className, ...props }: FlowButtonProps) {
  const isPrimary = variant === 'primary';

  return (
    <button
      className={cn(
        'group relative flex items-center justify-center gap-2 overflow-hidden rounded-[100px] border-[1.5px] px-8 sm:px-10 py-3 sm:py-4 text-base sm:text-lg font-semibold cursor-pointer transition-all duration-[600ms] ease-[cubic-bezier(0.23,1,0.32,1)] hover:border-black hover:bg-black hover:text-white hover:rounded-[16px] active:scale-[0.95]',
        isPrimary ? 'border-[#5047e4] bg-[#5047e4] text-white' : 'border-white bg-white text-gray-900',
        className,
      )}
      {...props}
    >
      {!hideArrow && (
        <ArrowRight className={cn('absolute w-5 h-5 left-[-25%] fill-none z-[9] group-hover:left-5 group-hover:stroke-white transition-all duration-[800ms] ease-[cubic-bezier(0.34,1.56,0.64,1)]', isPrimary ? 'stroke-white' : 'stroke-gray-900')} />
      )}
      <span className={cn('relative z-[1] transition-all duration-[800ms] ease-out', !hideArrow && '-translate-x-4 group-hover:translate-x-4')}>
        {text}
      </span>
      <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 bg-black rounded-[50%] opacity-0 group-hover:w-[350px] group-hover:h-[350px] group-hover:opacity-100 transition-all duration-[800ms] ease-[cubic-bezier(0.19,1,0.22,1)]" />
      {!hideArrow && (
        <ArrowRight className={cn('absolute w-5 h-5 right-5 fill-none z-[9] group-hover:right-[-25%] group-hover:stroke-white transition-all duration-[800ms] ease-[cubic-bezier(0.34,1.56,0.64,1)]', isPrimary ? 'stroke-white' : 'stroke-gray-900')} />
      )}
    </button>
  );
}
