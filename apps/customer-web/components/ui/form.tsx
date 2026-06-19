'use client';

import MuiCheckbox from '@mui/material/Checkbox';
import FormControl from '@mui/material/FormControl';
import MenuItem from '@mui/material/MenuItem';
import MuiSelect from '@mui/material/Select';
import TextField from '@mui/material/TextField';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { TimePicker } from '@mui/x-date-pickers/TimePicker';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';
import * as React from 'react';
import { cn } from '../../lib/utils';

const controlSx = {
  '& .MuiOutlinedInput-root': {
    borderRadius: '12px',
    backgroundColor: 'rgba(255,255,255,0.95)',
    fontSize: '0.875rem',
    '& fieldset': { borderColor: 'hsl(var(--border))' },
    '&:hover fieldset': { borderColor: 'hsl(var(--primary) / 0.35)' },
    '&.Mui-focused fieldset': {
      borderColor: 'hsl(var(--primary))',
      borderWidth: '1px',
    },
  },
  '& .MuiInputBase-input': {
    color: 'hsl(var(--foreground))',
  },
};

export function Field({
  label,
  hint,
  optional,
  children,
  className,
}: {
  label: string;
  hint?: string;
  optional?: boolean;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <label className={cn('block', className)}>
      <span className="mb-2 flex items-center justify-between gap-3 text-sm font-semibold">
        <span>{label}</span>
        {optional && (
          <span className="text-xs font-medium text-muted-foreground">
            Optional
          </span>
        )}
      </span>
      {children}
      {hint && (
        <span className="mt-1.5 block text-xs leading-5 text-muted-foreground">
          {hint}
        </span>
      )}
    </label>
  );
}

export const Select = React.forwardRef<
  HTMLDivElement,
  React.SelectHTMLAttributes<HTMLSelectElement>
>(
  (
    { className, children, value, onChange, required, disabled, ...props },
    ref,
  ) => {
    const items = React.Children.map(children, (child) => {
      if (
        !React.isValidElement<{
          value?: string;
          children?: React.ReactNode;
          disabled?: boolean;
        }>(child)
      )
        return null;
      return (
        <MenuItem
          value={child.props.value ?? ''}
          disabled={child.props.disabled}
        >
          {child.props.children}
        </MenuItem>
      );
    });

    return (
      <FormControl
        fullWidth
        required={required}
        disabled={disabled}
        className={className}
        ref={ref}
      >
        <MuiSelect
          displayEmpty
          value={String(value ?? '')}
          onChange={onChange as never}
          sx={{ ...controlSx, height: 48 }}
          {...(props as Record<string, unknown>)}
        >
          {items}
        </MuiSelect>
      </FormControl>
    );
  },
);
Select.displayName = 'Select';

export const Textarea = React.forwardRef<
  HTMLDivElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(
  (
    {
      className,
      value,
      onChange,
      placeholder,
      required,
      disabled,
      maxLength,
      ...props
    },
    ref,
  ) => (
    <TextField
      ref={ref}
      className={className}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      required={required}
      disabled={disabled}
      multiline
      minRows={4}
      fullWidth
      slotProps={{ htmlInput: { maxLength } }}
      sx={controlSx}
      {...(props as Record<string, unknown>)}
    />
  ),
);
Textarea.displayName = 'Textarea';

export function DateField({
  value,
  min,
  onValueChange,
  required,
}: {
  value: string;
  min?: string;
  onValueChange: (value: string) => void;
  required?: boolean;
}) {
  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <DatePicker
        value={value ? dayjs(value) : null}
        minDate={min ? dayjs(min) : undefined}
        onChange={(next) =>
          onValueChange(next?.isValid() ? next.format('YYYY-MM-DD') : '')
        }
        slotProps={{ textField: { fullWidth: true, required, sx: controlSx } }}
      />
    </LocalizationProvider>
  );
}

export function TimeField({
  value,
  onValueChange,
  required,
}: {
  value: string;
  onValueChange: (value: string) => void;
  required?: boolean;
}) {
  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <TimePicker
        value={value ? dayjs(`1970-01-01T${value}`) : null}
        onChange={(next) =>
          onValueChange(next?.isValid() ? next.format('HH:mm') : '')
        }
        slotProps={{ textField: { fullWidth: true, required, sx: controlSx } }}
      />
    </LocalizationProvider>
  );
}

export function Checkbox({
  label,
  description,
  checked,
  onCheckedChange,
  className,
}: {
  label: string;
  description?: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      aria-pressed={checked}
      onClick={() => onCheckedChange(!checked)}
      className={cn(
        'flex w-full items-center gap-3 rounded-xl border bg-white/75 p-3 text-left transition hover:border-primary/35 hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30',
        checked && 'border-primary/50 bg-primary/[0.055]',
        className,
      )}
    >
      <MuiCheckbox
        checked={checked}
        tabIndex={-1}
        disableRipple
        sx={{
          color: 'hsl(var(--muted-foreground))',
          '&.Mui-checked': { color: 'hsl(var(--primary))' },
          p: 0,
        }}
      />
      <span className="min-w-0">
        <span className="block text-sm font-semibold">{label}</span>
        {description && (
          <span className="mt-0.5 block text-xs leading-5 text-muted-foreground">
            {description}
          </span>
        )}
      </span>
    </button>
  );
}

export function ChoiceCard({
  label,
  description,
  selected,
  onSelect,
  children,
}: {
  label: string;
  description?: string;
  selected: boolean;
  onSelect: () => void;
  children?: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        'flex min-h-20 w-full items-start gap-3 rounded-xl border bg-white/80 p-4 text-left transition hover:border-primary/35 hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30',
        selected && 'border-primary bg-primary/[0.055] ring-1 ring-primary/30',
      )}
    >
      <span
        className={cn(
          'mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full border bg-white',
          selected && 'border-primary',
        )}
      >
        {selected && <span className="h-2.5 w-2.5 rounded-full bg-primary" />}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block font-semibold">{label}</span>
        {description && (
          <span className="mt-1 block text-xs leading-5 text-muted-foreground">
            {description}
          </span>
        )}
        {children}
      </span>
    </button>
  );
}
