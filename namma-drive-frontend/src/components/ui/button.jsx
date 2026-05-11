import { forwardRef } from 'react';
import { cn } from '@/lib/utils';

export const Button = forwardRef(function Button(
  { className, variant = 'default', size = 'default', type = 'button', disabled, ...props },
  ref
) {
  const variants = {
    default: 'bg-primary text-primary-foreground hover:opacity-90',
    outline: 'border border-border bg-background hover:bg-muted',
    ghost: 'hover:bg-muted',
    link: 'text-primary underline-offset-4 hover:underline',
  };
  const sizes = {
    default: 'h-10 px-4 py-2',
    sm: 'h-9 rounded-md px-3',
    lg: 'h-11 rounded-md px-8',
  };
  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled}
      className={cn(
        'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50',
        variants[variant] || variants.default,
        sizes[size] || sizes.default,
        className
      )}
      {...props}
    />
  );
});
