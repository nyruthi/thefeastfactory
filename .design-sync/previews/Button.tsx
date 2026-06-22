import { Button } from '@aranyam/ui';

export function Default() {
  return <Button>Book now</Button>;
}

export function Secondary() {
  return <Button variant="secondary">Explore packages</Button>;
}

export function Outline() {
  return <Button variant="outline">View details</Button>;
}

export function Disabled() {
  return <Button disabled>Unavailable</Button>;
}
