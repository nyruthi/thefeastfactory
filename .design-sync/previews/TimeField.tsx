import { Field, TimeField } from '@aranyam/ui';

export function Empty() {
  return (
    <Field label="Event start time">
      <TimeField value="" onValueChange={() => {}} />
    </Field>
  );
}

export function WithTime() {
  return (
    <Field label="Ceremony time">
      <TimeField value="18:30" onValueChange={() => {}} />
    </Field>
  );
}
