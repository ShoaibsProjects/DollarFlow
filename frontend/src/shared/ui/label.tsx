import { forwardRef, LabelHTMLAttributes } from 'react';
import { cn } from '@/shared/lib/utils';

export const Label = forwardRef<HTMLLabelElement, LabelHTMLAttributes<HTMLLabelElement>>(
  ({ className, children, ...props }, ref) => (
    <label
      ref={ref}
      className={cn('text-sm font-medium text-foreground mb-1.5 block', className)}
      {...props}
    >
      {children}
    </label>
  )
);

Label.displayName = 'Label';