# The Feast Factory UI — conventions for the design agent

## No wrapping provider needed
Components work standalone. No ThemeProvider or context wrapper is required. CSS custom properties are defined in `_ds_bundle.css` (imported by `styles.css`) and are available globally.

## Styling idiom — two layers

**1. Component props (preferred for the 9 components):** pass `className` Tailwind classes for spacing/layout; use `variant` on `Button`. Do not invent class names that are not listed below.

**2. CSS custom properties for your own layout glue:** the design system defines these tokens in `:root` — use them via `style={{}}` or in a `<style>` block for any surfaces, text, or borders you add outside of the components:

| Token | Value | Use |
|---|---|---|
| `--primary` | `352 59% 30%` | Deep maroon — brand primary, CTAs |
| `--primary-foreground` | `0 0% 100%` | White text on primary |
| `--accent` | `41 56% 51%` | Gold — secondary actions, highlights |
| `--accent-foreground` | `0 0% 8%` | Dark text on accent |
| `--background` | `39 44% 97%` | Warm cream page background |
| `--foreground` | `0 0% 10%` | Body text |
| `--card` | `0 0% 100%` | White card surface |
| `--card-foreground` | `0 0% 10%` | Text on cards |
| `--muted` | `37 28% 93%` | Muted/input backgrounds |
| `--muted-foreground` | `0 0% 43%` | Placeholder and hint text |
| `--border` | `35 22% 87%` | Warm grey borders |

Usage: `style={{ background: 'hsl(var(--background))', color: 'hsl(var(--foreground))' }}`

**Tailwind classes shipped in the bundle** (safe to use):
- Color: `bg-primary`, `bg-accent`, `bg-muted`, `text-primary`, `text-accent`, `text-muted`, `ring-primary`
- Layout: `surface-card` (rounded card with border and shadow), `page-shell` (max-width page wrapper), `eyebrow` (small-caps accent label in gold)

Do NOT use `bg-card`, `bg-background`, `border-border`, `text-foreground`, or other Tailwind tokens not listed above — they are not in the compiled bundle and will produce unstyled output.

## Form control pattern — always wrap in Field
Every form control should be placed inside a `<Field label="…">` wrapper. `Field` adds the label, optional hint, and "Optional" badge. Compose like this:

```jsx
import { Field, Input, Select, Checkbox } from '@aranyam/ui';

function BookingForm() {
  return (
    <div className="surface-card" style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
      <Field label="Event date">
        <DateField value="" onValueChange={() => {}} />
      </Field>
      <Field label="Occasion">
        <Select value="wedding">
          <option value="wedding">Wedding</option>
          <option value="corporate">Corporate event</option>
        </Select>
      </Field>
      <Field label="Guest count" hint="Minimum 50 guests">
        <Input placeholder="e.g. 150" type="number" />
      </Field>
      <Checkbox
        label="Veg-only menu"
        description="All dishes will be vegetarian"
        checked={false}
        onCheckedChange={() => {}}
      />
      <Button>Confirm booking</Button>
    </div>
  );
}
```

## Where to read the truth
- Token definitions: `_ds_bundle.css` (`:root` block, ~line 964)
- Per-component props: `components/general/<Name>/<Name>.d.ts`
- Per-component usage: `components/general/<Name>/<Name>.prompt.md`
