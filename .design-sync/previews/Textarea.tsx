import { Field, Textarea } from '@aranyam/ui';

export function Default() {
  return (
    <Field label="Message to the chef">
      <Textarea placeholder="Any special instructions or requests…" />
    </Field>
  );
}

export function WithValue() {
  return (
    <Field label="Event description">
      <Textarea value="Wedding reception for 250 guests. Prefer South Indian cuisine with a live counter for dosas." />
    </Field>
  );
}

export function Disabled() {
  return (
    <Field label="Notes">
      <Textarea placeholder="Not available for editing" disabled />
    </Field>
  );
}
