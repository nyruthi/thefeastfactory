import { ChoiceCard } from '@aranyam/ui';

export function Unselected() {
  return (
    <ChoiceCard
      label="Dine-in"
      description="Guest come to the venue; we handle everything on-site"
      selected={false}
      onSelect={() => {}}
    />
  );
}

export function Selected() {
  return (
    <ChoiceCard
      label="Catering at your venue"
      description="Our team sets up and serves at your location"
      selected={true}
      onSelect={() => {}}
    />
  );
}

export function TwoOptions() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <ChoiceCard
        label="Basic Feast"
        description="Up to 100 guests · 3-course meal · Standard setup"
        selected={false}
        onSelect={() => {}}
      />
      <ChoiceCard
        label="Royal Feast"
        description="Up to 500 guests · 5-course meal · Premium décor"
        selected={true}
        onSelect={() => {}}
      />
    </div>
  );
}
