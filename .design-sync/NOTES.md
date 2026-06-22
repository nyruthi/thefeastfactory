# Design Sync Notes — The Feast Factory UI

## Setup quirks

- **No standalone library package**: Components live in `apps/customer-web/components/ui/`, not a dedicated `packages/ui`. The converter is driven with an explicit `--entry apps/customer-web/components/ui/ds-entry.ts` that excludes Next.js-dependent components.
- **PKG_DIR resolves to `apps/customer-web`**: The converter walks up from the entry file and finds `apps/customer-web/package.json`. All config paths (`tsconfig`, `cssEntry`, `componentSrcMap`) are relative to that directory.
- **`tsconfig.json` path**: Must be `"tsconfig.json"` (relative to `apps/customer-web`), NOT `"apps/customer-web/tsconfig.json"`.
- **`cssEntry` path**: Must be `.ds-ui.css` (inside `apps/customer-web/`, within `PKG_DIR` bounds). Rebuild it before re-syncing: `npx --prefix apps/customer-web tailwindcss -i apps/customer-web/app/globals.css -o apps/customer-web/.ds-ui.css --config apps/customer-web/tailwind.config.ts --content "apps/customer-web/components/ui/*.tsx"`.
- **No `.d.ts` files**: The package has no dist. All component types are provided via `dtsPropsFor` in config. If component signatures change, update `dtsPropsFor` too.
- **`StatePanel` and `AuthRequiredPanel` excluded**: They import `next/link`, which can't bundle outside Next.js. They are nulled in `componentSrcMap`.
- **Playwright installed in `.ds-sync/`**: Chromium is in `~/.cache/ms-playwright/`. Re-running on a fresh machine requires `npx playwright install chromium` inside `.ds-sync/`.
- **MUI Select children pattern**: The `Select` component takes `<option>` elements as children — it maps them to MUI `MenuItem` internally. Always provide children with `value` props, or the select renders blank.

## Re-sync command

```bash
# 1. Recompile Tailwind CSS (if components changed)
npx --prefix apps/customer-web tailwindcss -i apps/customer-web/app/globals.css -o apps/customer-web/.ds-ui.css --config apps/customer-web/tailwind.config.ts --content "apps/customer-web/components/ui/*.tsx"

# 2. Re-stage scripts (always — stale .ds-sync/ runs old converter)
cp -r "<skill-base-dir>"/{package-build,package-validate,package-capture,resync}.mjs "<skill-base-dir>"/lib "<skill-base-dir>"/storybook .ds-sync/

# 3. Fetch remote anchor
# (DesignSync get_file _ds_sync.json → .design-sync/.cache/remote-sync.json)

# 4. Run resync driver
node .ds-sync/resync.mjs --config .design-sync/config.json --node-modules ./node_modules \
  --entry ./apps/customer-web/components/ui/ds-entry.ts --out ./ds-bundle \
  --remote .design-sync/.cache/remote-sync.json
```

## Known render warns

- `DateField` — "Required" and "Empty" variants render identically (required flag is not visually distinct in the MUI date picker). Single-look component — intentional.

## Re-sync risks

- **`dtsPropsFor` in config can drift**: If component props change in the source `.tsx` files, the `dtsPropsFor` entries in `config.json` won't update automatically. Check them on any re-sync after an API change.
- **Authored previews tied to component API**: `.design-sync/previews/*.tsx` use specific props. If a component's API changes (e.g., `Select` switches from `<option>` children to a different pattern), previews will fail to build.
- **MUI emotion styles**: MUI injects styles at runtime via emotion. If MUI version changes or emotion breaks, previews may render unstyled — the render check will catch it.
- **CSS custom properties are the only styling bridge for layout**: The Tailwind content scope covers only the 9 UI component files. Utility classes like `bg-card`, `text-foreground`, `border-border` are NOT in the bundle CSS. Use `var(--*)` custom properties for layout glue in designs.
- **`ds-entry.ts` must be kept in sync with added components**: If new components are added to `components/ui/`, add them to `ds-entry.ts` AND to `componentSrcMap` in config, and author a preview.
