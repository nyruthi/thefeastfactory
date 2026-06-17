'use client';

import FormControl from '@mui/material/FormControl';
import MenuItem from '@mui/material/MenuItem';
import MuiSelect from '@mui/material/Select';
import TextField from '@mui/material/TextField';
import * as React from 'react';
import { cn } from '../../lib/utils';

const controlSx = {
  '& .MuiOutlinedInput-root': {
    borderRadius: '10px',
    backgroundColor: '#fff',
    fontSize: '0.875rem',
    '& fieldset': { borderColor: 'hsl(var(--border))' },
    '&:hover fieldset': { borderColor: 'hsl(var(--primary) / 0.45)' },
    '&.Mui-focused fieldset': { borderColor: 'hsl(var(--primary))', borderWidth: '1px' },
  },
};

export function Field({
  label,
  children,
  optional,
  className,
}: {
  label: string;
  children: React.ReactNode;
  optional?: boolean;
  className?: string;
}) {
  return (
    <label className={cn('block', className)}>
      <span className="mb-2 flex items-center justify-between gap-3 text-sm font-semibold">
        <span>{label}</span>
        {optional && <span className="text-xs font-medium text-muted-foreground">Optional</span>}
      </span>
      {children}
    </label>
  );
}

export const Select = React.forwardRef<HTMLDivElement, React.SelectHTMLAttributes<HTMLSelectElement>>(
  ({ className, children, value, onChange, required, disabled, ...props }, ref) => {
    const items = React.Children.map(children, (child) => {
      if (!React.isValidElement<{ value?: string; children?: React.ReactNode; disabled?: boolean }>(child)) return null;
      return (
        <MenuItem value={child.props.value ?? ''} disabled={child.props.disabled}>
          {child.props.children}
        </MenuItem>
      );
    });

    return (
      <FormControl fullWidth required={required} disabled={disabled} className={className} ref={ref}>
        <MuiSelect
          displayEmpty
          value={String(value ?? '')}
          onChange={onChange as never}
          sx={{ ...controlSx, height: 40 }}
          {...(props as Record<string, unknown>)}
        >
          {items}
        </MuiSelect>
      </FormControl>
    );
  },
);
Select.displayName = 'Select';

export const Textarea = React.forwardRef<HTMLDivElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ className, value, onChange, placeholder, required, disabled, maxLength, ...props }, ref) => (
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
