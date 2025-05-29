import React from 'react';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import { cva, type VariantProps } from 'class-variance-authority';
import { clsx } from 'clsx';

const buttonVariants = cva(
  'inline-flex items-center justify-center rounded-lg font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed relative overflow-hidden',
  {
    variants: {
      variant: {
        primary: 'bg-gradient-primary text-white hover:opacity-90 focus:ring-primary/50 shadow-lg hover:shadow-xl',
        secondary: 'bg-gradient-secondary text-white hover:opacity-90 focus:ring-secondary/50 shadow-lg hover:shadow-xl',
        tertiary: 'bg-gradient-tertiary text-white hover:opacity-90 focus:ring-primary/50 shadow-lg hover:shadow-xl',
        outline: 'border-2 border-border bg-transparent hover:bg-card-highlight focus:ring-primary/50',
        ghost: 'bg-transparent hover:bg-card-highlight focus:ring-primary/50',
        danger: 'bg-red-500 text-white hover:bg-red-600 focus:ring-red-500/50 shadow-lg hover:shadow-xl',
        success: 'bg-green-500 text-white hover:bg-green-600 focus:ring-green-500/50 shadow-lg hover:shadow-xl',
      },
      size: {
        sm: 'h-8 px-3 text-sm',
        md: 'h-10 px-4 text-sm',
        lg: 'h-12 px-6 text-base',
        xl: 'h-14 px-8 text-lg',
        icon: 'h-10 w-10',
        'icon-sm': 'h-8 w-8',
        'icon-lg': 'h-12 w-12',
      },
      fullWidth: {
        true: 'w-full',
        false: 'w-auto',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
      fullWidth: false,
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  children?: React.ReactNode;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ 
    className, 
    variant, 
    size, 
    fullWidth, 
    loading, 
    leftIcon, 
    rightIcon, 
    children, 
    disabled,
    ...props 
  }, ref) => {
    const isDisabled = disabled || loading;

    return (
      <motion.button
        ref={ref}
        className={clsx(buttonVariants({ variant, size, fullWidth, className }))}
        disabled={isDisabled}
        whileHover={{ scale: isDisabled ? 1 : 1.02 }}
        whileTap={{ scale: isDisabled ? 1 : 0.98 }}
        transition={{ duration: 0.1 }}
        {...props}
      >
        {/* Shimmer effect for gradient buttons */}
        {(variant === 'primary' || variant === 'secondary' || variant === 'tertiary') && (
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
            initial={{ x: '-100%' }}
            whileHover={{ x: '100%' }}
            transition={{ duration: 0.6 }}
          />
        )}
        
        {/* Content */}
        <div className="relative flex items-center justify-center gap-2">
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            leftIcon && <span className="flex-shrink-0">{leftIcon}</span>
          )}
          
          {children && (
            <span className={clsx(
              'truncate',
              loading && 'opacity-70'
            )}>
              {children}
            </span>
          )}
          
          {!loading && rightIcon && (
            <span className="flex-shrink-0">{rightIcon}</span>
          )}
        </div>
      </motion.button>
    );
  }
);

Button.displayName = 'Button';

export { Button, buttonVariants };

// Specialized button components
export const IconButton = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ children, size = 'icon', variant = 'ghost', ...props }, ref) => (
    <Button ref={ref} size={size} variant={variant} {...props}>
      {children}
    </Button>
  )
);

IconButton.displayName = 'IconButton';

export const GradientButton = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', ...props }, ref) => (
    <Button ref={ref} variant={variant} {...props} />
  )
);

GradientButton.displayName = 'GradientButton';

// Button group component
interface ButtonGroupProps {
  children: React.ReactNode;
  className?: string;
  orientation?: 'horizontal' | 'vertical';
  spacing?: 'none' | 'sm' | 'md' | 'lg';
}

export const ButtonGroup: React.FC<ButtonGroupProps> = ({
  children,
  className,
  orientation = 'horizontal',
  spacing = 'sm',
}) => {
  const spacingClasses = {
    none: '',
    sm: orientation === 'horizontal' ? 'space-x-2' : 'space-y-2',
    md: orientation === 'horizontal' ? 'space-x-4' : 'space-y-4',
    lg: orientation === 'horizontal' ? 'space-x-6' : 'space-y-6',
  };

  return (
    <div
      className={clsx(
        'flex',
        orientation === 'horizontal' ? 'flex-row items-center' : 'flex-col',
        spacingClasses[spacing],
        className
      )}
    >
      {children}
    </div>
  );
};

// Floating Action Button
interface FABProps extends ButtonProps {
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
}

export const FloatingActionButton: React.FC<FABProps> = ({
  position = 'bottom-right',
  className,
  size = 'icon-lg',
  variant = 'primary',
  ...props
}) => {
  const positionClasses = {
    'bottom-right': 'fixed bottom-6 right-6',
    'bottom-left': 'fixed bottom-6 left-6',
    'top-right': 'fixed top-6 right-6',
    'top-left': 'fixed top-6 left-6',
  };

  return (
    <motion.div
      className={clsx(positionClasses[position], 'z-50')}
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ type: 'spring', stiffness: 260, damping: 20 }}
    >
      <Button
        className={clsx('rounded-full shadow-2xl', className)}
        size={size}
        variant={variant}
        {...props}
      />
    </motion.div>
  );
};
