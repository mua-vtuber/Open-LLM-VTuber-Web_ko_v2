import { forwardRef } from 'react';
import { cn } from '../../utils';

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  description?: string;
  error?: string;
}

const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, description, error, className, ...props }, ref) => {
    const textareaElement = (
      <textarea
        ref={ref}
        className={cn(
          'flex min-h-[80px] w-full rounded-lg border bg-background-secondary px-3 py-2 text-sm',
          'border-background-tertiary text-text-primary placeholder:text-text-muted',
          'focus:outline-none focus:ring-2 focus:ring-accent-primary focus:ring-offset-2 focus:ring-offset-background-primary',
          'disabled:cursor-not-allowed disabled:opacity-50',
          'resize-none',
          error && 'border-accent-error focus:ring-accent-error',
          className
        )}
        {...props}
      />
    );

    if (label) {
      return (
        <div className="space-y-2">
          <div>
            <span className="text-sm font-medium text-text-primary">{label}</span>
            {description && (
              <p className="text-xs text-text-muted mt-0.5">{description}</p>
            )}
          </div>
          {textareaElement}
          {error && (
            <p className="text-xs text-accent-error">{error}</p>
          )}
        </div>
      );
    }

    return textareaElement;
  }
);

Textarea.displayName = 'Textarea';

export { Textarea };
