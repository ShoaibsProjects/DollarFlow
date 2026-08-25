import { forwardRef, ImgHTMLAttributes, HTMLAttributes } from 'react';
import { cn } from '@/shared/lib/utils';

const avatarColors = [
  '#FF6B9D', '#4ECDC4', '#FFE66D', '#A8E6CF', 
  '#DDA0DD', '#87CEEB', '#FFA07A', '#98D8C8',
  '#00D395', '#A78BFA', '#FF6B6B', '#FFB800',
];

function getColorFromName(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return avatarColors[Math.abs(hash) % avatarColors.length];
}

interface AvatarProps extends HTMLAttributes<HTMLDivElement> {
  src?: string | null;
  alt?: string;
  name?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
}

export const Avatar = forwardRef<HTMLDivElement, AvatarProps>(
  ({ className, src, alt, name, size = 'md', ...props }, ref) => {
    const sizes = {
      sm: 'w-8 h-8 text-xs',
      md: 'w-10 h-10 text-sm',
      lg: 'w-12 h-12 text-base',
      xl: 'w-16 h-16 text-lg',
      '2xl': 'w-20 h-20 text-xl',
    };
    
    const color = name ? getColorFromName(name) : avatarColors[0];
    const initials = name
      ? name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
      : '?';
    
    return (
      <div
        ref={ref}
        className={cn(
          'relative inline-flex items-center justify-center rounded-full overflow-hidden bg-surface border border-border',
          'bg-cover bg-center',
          sizes[size],
          className
        )}
        {...props}
      >
        {src ? (
          <img
            src={src}
            alt={alt || name || 'Avatar'}
            className="w-full h-full object-cover"
          />
        ) : (
          <div
            className="w-full h-full flex items-center justify-center font-bold text-white"
            style={{ backgroundColor: color }}
          >
            {initials}
          </div>
        )}
      </div>
    );
  }
);

Avatar.displayName = 'Avatar';

const AvatarImageComponent = forwardRef<HTMLImageElement, ImgHTMLAttributes<HTMLImageElement>>(
  ({ className, ...props }, ref) => (
    <img
      ref={ref}
      className={cn('w-full h-full object-cover', className)}
      {...props}
    />
  )
);

AvatarImageComponent.displayName = 'AvatarImage';
export const AvatarImage = AvatarImageComponent;

const AvatarFallbackComponent = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, children, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('w-full h-full flex items-center justify-center font-bold text-white', className)}
      {...props}
    >
      {children}
    </div>
  )
);

AvatarFallbackComponent.displayName = 'AvatarFallback';
export const AvatarFallback = AvatarFallbackComponent;