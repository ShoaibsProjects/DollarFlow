import { Fragment, ReactNode, forwardRef } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/shared/lib/utils';
import { createPortal } from 'react-dom';

interface DialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: ReactNode;
  className?: string;
}

export function Dialog({ open, onOpenChange, children, className }: DialogProps) {
  if (!open) return null;
  
  return createPortal(
    <Fragment>
      <div
        className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm animate-fade-in"
        onClick={() => onOpenChange(false)}
        aria-hidden="true"
      />
      <div
        className={cn(
          'fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-lg',
          'animate-scale-in',
          className
        )}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="dialog-title"
      >
        {children}
      </div>
    </Fragment>,
    document.body
  );
}

interface DialogContentProps {
  children: ReactNode;
  className?: string;
}

export const DialogContent = forwardRef<HTMLDivElement, DialogContentProps>(
  ({ children, className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        'bg-surface border border-border rounded-2xl shadow-[var(--shadow-elevated)]',
        'p-6',
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
);

DialogContent.displayName = 'DialogContent';

interface DialogHeaderProps {
  children: ReactNode;
  className?: string;
}

export const DialogHeader = forwardRef<HTMLDivElement, DialogHeaderProps>(
  ({ children, className, ...props }, ref) => (
    <div ref={ref} className={cn('flex items-center justify-between mb-4', className)} {...props}>
      {children}
    </div>
  )
);

DialogHeader.displayName = 'DialogHeader';

interface DialogTitleProps {
  children: ReactNode;
  className?: string;
}

export const DialogTitle = forwardRef<HTMLHeadingElement, DialogTitleProps>(
  ({ children, className, ...props }, ref) => (
    <h2
      ref={ref}
      id="dialog-title"
      className={cn('font-display text-lg font-semibold text-foreground', className)}
      {...props}
    >
      {children}
    </h2>
  )
);

DialogTitle.displayName = 'DialogTitle';

interface DialogTriggerProps {
  children: ReactNode;
  asChild?: boolean;
}

export function DialogTrigger({ children, asChild = false }: DialogTriggerProps) {
  if (asChild && typeof children === 'object' && children !== null) {
    return children;
  }
  return <>{children}</>;
}

interface DialogCloseProps {
  className?: string;
}

export function DialogClose({ className }: DialogCloseProps) {
  return (
    <button
      className={cn(
        'p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-surface-elevated transition-colors',
        className
      )}
      onClick={() => {
        const dialog = document.querySelector('[role="dialog"]');
        if (dialog) {
          (dialog as HTMLElement).click();
        }
      }}
      aria-label="Close dialog"
    >
      <X className="w-5 h-5" />
    </button>
  );
}