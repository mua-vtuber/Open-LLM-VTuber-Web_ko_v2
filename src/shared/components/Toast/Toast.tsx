import { useEffect, useState } from 'react';
import { X, CheckCircle, AlertCircle, Info } from 'lucide-react';
import { cn } from '../../utils';

export interface ToastProps {
  /** Toast type determines the color and icon */
  type: 'success' | 'error' | 'info';
  /** Message to display */
  message: string;
  /** Duration in milliseconds before auto-dismiss (0 = no auto-dismiss) */
  duration?: number;
  /** Callback when toast is closed */
  onClose?: () => void;
  /** Additional className */
  className?: string;
}

const icons = {
  success: CheckCircle,
  error: AlertCircle,
  info: Info,
};

const styles = {
  success: 'bg-green-500/10 border-green-500/30 text-green-400',
  error: 'bg-red-500/10 border-red-500/30 text-red-400',
  info: 'bg-blue-500/10 border-blue-500/30 text-blue-400',
};

const iconStyles = {
  success: 'text-green-400',
  error: 'text-red-400',
  info: 'text-blue-400',
};

export function Toast({
  type,
  message,
  duration = 3000,
  onClose,
  className,
}: ToastProps) {
  const [isVisible, setIsVisible] = useState(true);
  const [isLeaving, setIsLeaving] = useState(false);

  const Icon = icons[type];

  const handleClose = () => {
    setIsLeaving(true);
    setTimeout(() => {
      setIsVisible(false);
      onClose?.();
    }, 200); // Match animation duration
  };

  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(handleClose, duration);
      return () => clearTimeout(timer);
    }
  }, [duration]);

  if (!isVisible) return null;

  return (
    <div
      className={cn(
        'fixed bottom-4 right-4 z-50',
        'flex items-center gap-3 px-4 py-3 rounded-lg border',
        'shadow-lg backdrop-blur-sm',
        'transition-all duration-200',
        isLeaving ? 'opacity-0 translate-y-2' : 'opacity-100 translate-y-0',
        styles[type],
        className
      )}
      role="alert"
    >
      <Icon className={cn('w-5 h-5 flex-shrink-0', iconStyles[type])} />
      <span className="text-sm font-medium text-text-primary">{message}</span>
      <button
        onClick={handleClose}
        className="ml-2 p-1 rounded hover:bg-white/10 transition-colors"
        aria-label="Close"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
