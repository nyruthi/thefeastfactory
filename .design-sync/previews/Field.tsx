import { Field, Input } from '@aranyam/ui';

export function Basic() {
  return (
    <Field label="Full name">
      <Input placeholder="Enter your name" />
    </Field>
  );
}

export function WithHint() {
  return (
    <Field label="Phone number" hint="Include country code (e.g. +91)">
      <Input placeholder="+91 98765 43210" type="tel" />
    </Field>
  );
}

export function Optional() {
  return (
    <Field label="Special requests" optional hint="Dietary needs, seating preferences…">
      <Input placeholder="E.g. vegetarian, high chair" />
    </Field>
  );
}
