import { Field, DateField } from '@aranyam/ui';

export function Empty() {
  return (
    <Field label="Event date">
      <DateField value="" onValueChange={() => {}} />
    </Field>
  );
}

export function WithDate() {
  return (
    <Field label="Event date">
      <DateField value="2025-12-20" onValueChange={() => {}} />
    </Field>
  );
}

export function Required() {
  return (
    <Field label="Booking date">
      <DateField value="" onValueChange={() => {}} required />
    </Field>
  );
}
