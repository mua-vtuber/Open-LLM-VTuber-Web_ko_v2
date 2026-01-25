import { forwardRef } from 'react';
import * as SliderPrimitive from '@radix-ui/react-slider';
import { cn } from '../../utils';

export interface SliderProps {
  value?: number[];
  onValueChange?: (value: number[]) => void;
  min?: number;
  max?: number;
  step?: number;
  disabled?: boolean;
  label?: string;
  description?: string;
  showValue?: boolean;
  formatValue?: (value: number) => string;
  className?: string;
}

const Slider = forwardRef<HTMLSpanElement, SliderProps>(
  (
    {
      value = [0],
      onValueChange,
      min = 0,
      max = 100,
      step = 1,
      disabled,
      label,
      description,
      showValue = true,
      formatValue = (v) => String(v),
      className,
    },
    ref
  ) => {
    const sliderElement = (
      <SliderPrimitive.Root
        ref={ref}
        value={value}
        onValueChange={onValueChange}
        min={min}
        max={max}
        step={step}
        disabled={disabled}
        className={cn(
          'relative flex w-full touch-none select-none items-center',
          disabled && 'opacity-50 cursor-not-allowed',
          className
        )}
      >
        <SliderPrimitive.Track className="relative h-2 w-full grow overflow-hidden rounded-full bg-background-tertiary">
          <SliderPrimitive.Range className="absolute h-full bg-accent-primary" />
        </SliderPrimitive.Track>
        <SliderPrimitive.Thumb
          className={cn(
            'block h-5 w-5 rounded-full border-2 border-accent-primary bg-white shadow transition-colors',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background-primary',
            'disabled:pointer-events-none'
          )}
        />
      </SliderPrimitive.Root>
    );

    if (label) {
      return (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-sm font-medium text-text-primary">{label}</span>
              {description && (
                <p className="text-xs text-text-muted mt-0.5">{description}</p>
              )}
            </div>
            {showValue && (
              <span className="text-sm font-medium text-accent-primary">
                {formatValue(value[0])}
              </span>
            )}
          </div>
          {sliderElement}
        </div>
      );
    }

    return sliderElement;
  }
);

Slider.displayName = 'Slider';

export { Slider };
