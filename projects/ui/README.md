# @harmolody/ui

Tailwind-first Angular 22.2 dynamic forms and data tables, extracted from Harmolody Admin. Built with standalone components, signal inputs/outputs, Reactive Forms, and OnPush change detection.

Install the package into a compatible Angular 22.2+ app. Source and full examples: [codibyte-co/harmolody-ui](https://github.com/codibyte-co/harmolody-ui).

```sh
npm install @harmolody/ui
npm install tailwindcss @tailwindcss/postcss postcss
```

Enable the PostCSS plugin in `.postcssrc.json`:

```json
{ "plugins": { "@tailwindcss/postcss": {} } }
```

In global `src/styles.css`:

```css
@import 'tailwindcss';
@import '@harmolody/ui/theme.css';
@source '../node_modules/@harmolody/ui';
```

Adjust `@source` relative to your CSS file. It is required to generate utilities used by the installed library.

```ts
import {
  DynamicFormComponent,
  TableComponent,
  type FormConfig,
  type TableConfig,
} from '@harmolody/ui';
```

```html
<hui-dynamic-form #form [config]="formConfig" (formSubmit)="save($event); form.finishSubmit()" />
<hui-table [config]="tableConfig" />
```

Import both components in the host's `imports`. For async submissions, call `finishSubmit()` after completion, including failure paths. Static forms require no providers. API-backed fields need `provideHttpClient()`; internal table links need `provideRouter(routes)`. The table emits sorting/pagination events; the host supplies sorted/page data. Use `TableCellDirective` and `huiTableCell` for custom cells, and `provideHarmolodyUi()` for optional translations, icon overrides, and media selection.

Theme variables use `--hui-*` (for example `--hui-primary`, `--hui-surface`, `--hui-border`). The workspace includes complete guides, a working showcase, and unit/browser/packed-consumer verification. Detailed guides ship under `docs/` in the package.

License: `UNLICENSED`; no open-source license is granted.
