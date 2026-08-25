import { Toaster as SonnerToaster, toast as sonnerToast } from 'sonner';

export { SonnerToaster as Toaster };

export const toast = {
  success: (message: string, options?: any) => 
    sonnerToast.success(message, { 
      className: 'glass-card border-border',
      style: { background: 'var(--color-surface)', color: 'var(--color-foreground)' },
      ...options 
    }),
  error: (message: string, options?: any) => 
    sonnerToast.error(message, { 
      className: 'glass-card border-border',
      style: { background: 'var(--color-surface)', color: 'var(--color-foreground)' },
      ...options 
    }),
  info: (message: string, options?: any) => 
    sonnerToast.info(message, { 
      className: 'glass-card border-border',
      style: { background: 'var(--color-surface)', color: 'var(--color-foreground)' },
      ...options 
    }),
  warning: (message: string, options?: any) => 
    sonnerToast.warning(message, { 
      className: 'glass-card border-border',
      style: { background: 'var(--color-surface)', color: 'var(--color-foreground)' },
      ...options 
    }),
  loading: (message: string, options?: any) => 
    sonnerToast.loading(message, { 
      className: 'glass-card border-border',
      style: { background: 'var(--color-surface)', color: 'var(--color-foreground)' },
      ...options 
    }),
  promise: (promise: Promise<unknown>, messages: { loading: string; success: string; error: string }) => 
    sonnerToast.promise(promise, messages),
  dismiss: sonnerToast.dismiss,
};