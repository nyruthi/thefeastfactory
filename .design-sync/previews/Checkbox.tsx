import { Checkbox } from '@aranyam/ui';

export function Unchecked() {
  return (
    <Checkbox
      label="Veg-only menu"
      description="All dishes will be vegetarian"
      checked={false}
      onCheckedChange={() => {}}
    />
  );
}

export function Checked() {
  return (
    <Checkbox
      label="Veg-only menu"
      description="All dishes will be vegetarian"
      checked={true}
      onCheckedChange={() => {}}
    />
  );
}

export function WithoutDescription() {
  return (
    <Checkbox
      label="I agree to the terms and conditions"
      checked={false}
      onCheckedChange={() => {}}
    />
  );
}
