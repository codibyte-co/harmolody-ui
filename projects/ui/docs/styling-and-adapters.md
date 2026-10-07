# Styling and application adapters

## Tailwind 4

Use these imports in the consumer's global `src/styles.css`:

```css
@import 'tailwindcss';
@import '@harmolody/ui/theme.css';
@source '../node_modules/@harmolody/ui';
```

Install `tailwindcss`, `@tailwindcss/postcss`, `postcss` and enable the PostCSS plugin as shown in the root README. The library is intentionally Tailwind-first. The package includes an uncompiled theme entry point and utility classes in its compiled Angular templates; your app generates the utilities. Importing only the theme will not generate all the classes unless the package source is registered.

## Theme tokens

Override `--hui-*` CSS variables on `:root` or on a container surrounding the components:

```css
:root {
  --hui-primary: #2563eb;
  --hui-primary-foreground: #ffffff;
  --hui-background: #f8fafc;
  --hui-surface: #ffffff;
  --hui-border: #cbd5e1;
}
[data-theme='dark'] {
  --hui-background: #0e0b16;
  --hui-surface: #151225;
  --hui-surface-hover: #1f1b2e;
  --hui-foreground: #f9fafb;
  --hui-text-secondary: #cbd5e1;
  --hui-text-muted: #94a3b8;
  --hui-muted: #1f1b2e;
  --hui-border: #2a2540;
  color-scheme: dark;
}
```

Available tokens: `background`, `background-soft`, `surface`, `surface-hover`, `foreground`, `primary`, `primary-foreground`, `primary-soft`, `muted`, `text-secondary`, `text-muted`, `text-disabled`, `border`, `destructive`, all prefixed `--hui-`. Semantic utilities such as `bg-surface`, `text-primary`, `border-border` resolve through these tokens. Theme imports define global semantic utility names; review overlaps with an existing app theme. Some extracted controls retain explicit violet utility classes from the admin; token overrides do not recolor every legacy control. Extend with host classes where necessary. The package does not switch dark mode automatically.

## Optional providers

Basic static forms and tables work without `provideHarmolodyUi()`. English labels and built-in icons are defaults. Configure application integrations in `app.config.ts`:

```ts
import { provideHarmolodyUi } from '@harmolody/ui';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter } from '@angular/router';

providers: [
  provideHttpClient(), // Required only for API-backed options
  provideRouter(routes), // Required for internal table links
  provideHarmolodyUi({
    translate: (text, parameters) => myTranslator.translate(text, parameters),
    icons: {
      'custom-star': {
        path: 'M12 2l3 7 7 1-5 5 1 7-6-4-6 4 1-7-5-5 7-1z',
        fill: 'currentColor',
        stroke: 'none',
      },
    },
    selectMedia: async ({ mediaType, allowUpload }) => {
      const result = await myMediaDialog.open({ mediaType, allowUpload });
      return result.confirmed ? result.fileUrl : undefined;
    },
  }),
];
```

These are example host services, not imports provided by the package. Create the adapter inside a provider factory if your application integration needs Angular `inject()`; do not call `inject()` later inside an async callback outside an injection context.

Localization receives the original label and optional interpolation parameters. Without an adapter, `{count}` style placeholders are interpolated. Translation callbacks should read the host's language signal if labels need to react to language changes.

Icon overrides use the built-in `SvgIcon` structure (`path`, `viewBox?`, `stroke?`, `fill?`, `strokeWidth?`). Icons without an explicit `ariaLabel` are decorative and hidden from assistive technology; supply `ariaLabel` for meaningful standalone icons. Definitions override same-name built-ins; missing names yield no SVG. Avoid accepting untrusted SVG definitions as configuration.

Media selection returns a URL string for selection, `null` for clearing, and `undefined` for cancellation. The Browse button is disabled without a media adapter; `editableInput: true` supports direct URL entry. Storage, uploads, authentication, and dialogs belong to the host project.
