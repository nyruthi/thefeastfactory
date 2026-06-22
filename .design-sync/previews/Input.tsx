import { Input } from '@aranyam/ui';

export function Default() {
  return <Input placeholder="Enter your name" />;
}

export function WithValue() {
  return <Input defaultValue="Ananya Reddy" readOnly />;
}

export function Disabled() {
  return <Input placeholder="Not available" disabled />;
}
