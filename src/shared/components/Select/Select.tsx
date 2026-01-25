import { forwardRef, useEffect, useState } from 'react';
import * as SelectPrimitive from '@radix-ui/react-select';
import { Check, ChevronDown, ChevronUp } from 'lucide-react';
import { cn, isElectron, companionMouse } from '../../utils';
import { useAppStore } from '../../store';

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface SelectProps {
  value?: string;
  onValueChange?: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  disabled?: boolean;
  label?: string;
  description?: string;
  className?: string;
}

const Select = forwardRef<HTMLButtonElement, SelectProps>(
  (
    {
      value,
      onValueChange,
      options,
      placeholder = 'Select...',
      disabled,
      label,
      description,
      className,
    },
    ref
  ) => {
    const [isOpen, setIsOpen] = useState(false);
    const mode = useAppStore((state) => state.ui.mode);

    // Companion 모드에서 드롭다운이 열려있는 동안 hover 상태 유지
    useEffect(() => {
      if (isElectron && mode === 'companion' && isOpen) {
        companionMouse.updateHover('selectDropdown', true);
        return () => {
          companionMouse.updateHover('selectDropdown', false);
        };
      }
    }, [isOpen, mode]);

    const selectElement = (
      <SelectPrimitive.Root
        value={value}
        onValueChange={onValueChange}
        disabled={disabled}
        open={isOpen}
        onOpenChange={setIsOpen}
      >
        <SelectPrimitive.Trigger
          ref={ref}
          className={cn(
            'flex h-10 w-full items-center justify-between rounded-lg border border-background-tertiary bg-background-secondary px-3 py-2 text-sm',
            'focus:outline-none focus:ring-2 focus:ring-accent-primary focus:ring-offset-2 focus:ring-offset-background-primary',
            'disabled:cursor-not-allowed disabled:opacity-50',
            'text-text-primary placeholder:text-text-muted',
            className
          )}
        >
          <SelectPrimitive.Value placeholder={placeholder} />
          <SelectPrimitive.Icon>
            <ChevronDown className="h-4 w-4 text-text-muted" />
          </SelectPrimitive.Icon>
        </SelectPrimitive.Trigger>

        <SelectPrimitive.Portal>
          <SelectPrimitive.Content
            className={cn(
              'relative z-50 min-w-[8rem] overflow-hidden rounded-lg border border-background-tertiary bg-background-secondary shadow-md',
              'animate-in fade-in-0 zoom-in-95'
            )}
            position="popper"
            sideOffset={4}
          >
            <SelectPrimitive.ScrollUpButton className="flex h-6 cursor-default items-center justify-center bg-background-secondary">
              <ChevronUp className="h-4 w-4 text-text-muted" />
            </SelectPrimitive.ScrollUpButton>

            <SelectPrimitive.Viewport className="p-1">
              {options.map((option) => (
                <SelectPrimitive.Item
                  key={option.value}
                  value={option.value}
                  disabled={option.disabled}
                  className={cn(
                    'relative flex w-full cursor-pointer select-none items-center rounded-md py-2 pl-8 pr-2 text-sm outline-none',
                    'text-text-primary focus:bg-background-tertiary',
                    'data-[disabled]:pointer-events-none data-[disabled]:opacity-50'
                  )}
                >
                  <span className="absolute left-2 flex h-4 w-4 items-center justify-center">
                    <SelectPrimitive.ItemIndicator>
                      <Check className="h-4 w-4 text-accent-primary" />
                    </SelectPrimitive.ItemIndicator>
                  </span>
                  <SelectPrimitive.ItemText>{option.label}</SelectPrimitive.ItemText>
                </SelectPrimitive.Item>
              ))}
            </SelectPrimitive.Viewport>

            <SelectPrimitive.ScrollDownButton className="flex h-6 cursor-default items-center justify-center bg-background-secondary">
              <ChevronDown className="h-4 w-4 text-text-muted" />
            </SelectPrimitive.ScrollDownButton>
          </SelectPrimitive.Content>
        </SelectPrimitive.Portal>
      </SelectPrimitive.Root>
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
          {selectElement}
        </div>
      );
    }

    return selectElement;
  }
);

Select.displayName = 'Select';

export { Select };
