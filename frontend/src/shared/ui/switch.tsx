import { forwardRef, ButtonHTMLAttributes } from 'react';
import { cn } from '@/shared/lib/utils';

interface SwitchProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  disabled?: boolean;
  id?: string;
  label?: string;
}

export const Switch = forwardRef<HTMLButtonElement, SwitchProps>(
  ({ className, checked, onCheckedChange, disabled, id, label, ...props }, ref) => {
    const switchId = id || `switch-${Math.random().toString(36).slice(2, 9)}`;
    
    return (
      <div className="flex items-center gap-3">
        <button
          ref={ref}
          role="switch"
          aria-checked={checked}
          aria-disabled={disabled}
          id={switchId}
          onClick={() => !disabled && onCheckedChange(!checked)}
          className={cn(
            'relative w-11 h-6 rounded-full border-2 transition-all duration-fast ease-spring',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            checked
              ? 'bg-primary border-primary'
              : 'bg-surface border-border hover:border-primary/50',
            className
          )}
          disabled={disabled}
          {...props}
        >
          <span
            className={cn(
              'absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow-md transition-transform duration-fast ease-spring',
              checked ? 'translate-x-5' : 'translate-x-0'
            )}
          />
        </button>
        {label && (
          <label htmlFor={switchId} className="text-sm font-medium text-foreground cursor-pointer">
            {label}
          </label>
        )}
      </div>
    );
  }
);

Switch.displayName = 'Switch';