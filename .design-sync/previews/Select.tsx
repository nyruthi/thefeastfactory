import { Field, Select } from '@aranyam/ui';

export function WithOptions() {
  return (
    <Field label="Occasion">
      <Select value="wedding">
        <option value="wedding">Wedding</option>
        <option value="birthday">Birthday party</option>
        <option value="corporate">Corporate event</option>
        <option value="anniversary">Anniversary</option>
      </Select>
    </Field>
  );
}

export function Empty() {
  return (
    <Field label="Package type">
      <Select value="">
        <option value="" disabled>Select a package</option>
        <option value="basic">Basic Feast</option>
        <option value="premium">Premium Feast</option>
        <option value="royal">Royal Feast</option>
      </Select>
    </Field>
  );
}

export function Disabled() {
  return (
    <Field label="Cuisine">
      <Select value="south-indian" disabled>
        <option value="south-indian">South Indian</option>
        <option value="north-indian">North Indian</option>
      </Select>
    </Field>
  );
}
