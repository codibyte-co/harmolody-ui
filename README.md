# Harmolody UI

Reusable Angular dynamic forms and data tables extracted from `harmolody_admin`. The sibling workspace is `harmolody_ui`; its publishable package is **`@harmolody/ui`**. Source repository: [codibyte-co/harmolody-ui](https://github.com/codibyte-co/harmolody-ui).

## Requirements

- Angular **22.2.1** or a compatible newer Angular 22 release; built with 22.2.1 (npm latest stable checked 7 October 2026).
- Node `^22.22.3 || ^24.15.0 || >=26.0.0`, npm 11+, Tailwind CSS 4.1+.
- Angular Reactive Forms and RxJS 7.8; no Harmolody backend, Firebase, Appwrite, or app-specific service dependencies.

This extraction retains the admin's Reactive Forms contract instead of changing existing consumers to Signal Forms. Components use standalone imports, signal inputs/outputs, and OnPush change detection.

## Run the example

```sh
npm ci
npm start
```

Open `http://localhost:4200`. Add an artist through the dynamic form, sort and paginate the table, select rows, choose visible columns, use row actions, and switch themes. The example imports the **compiled library** through `@harmolody/ui`, not source aliases.

```sh
npm run test          # Library and example unit tests, no watch
npm run build         # Production library and example builds
npm run pack          # artifacts/harmolody-ui-0.1.0.tgz
npm run verify        # Tests, builds, tarball
npx playwright install chromium
npm run test:e2e      # Real browser interactions and Tailwind/mobile checks
```

## Install from npm

```sh
npm install @harmolody/ui
npm install tailwindcss @tailwindcss/postcss postcss
```

Configure Tailwind and import the components as shown below. The package requires Angular 22.2.1 or a compatible Angular 22 release.

## Install a local tarball

```sh
# In this workspace
npm run pack

# In the consuming Angular project (adjust the relative path)
npm install ../harmolody_ui/artifacts/harmolody-ui-0.1.0.tgz
npm install tailwindcss @tailwindcss/postcss postcss
```

Add `.postcssrc.json` at the consuming project root:

```json
{ "plugins": { "@tailwindcss/postcss": {} } }
```

In `src/styles.css`:

```css
@import 'tailwindcss';
@import '@harmolody/ui/theme.css';
@source '../node_modules/@harmolody/ui';
```

The `@source` path is relative to **that CSS file**. It is required because Tailwind skips `node_modules` by default. If styles live elsewhere, adjust it. The package ships theme tokens and static utility classes; the consuming app compiles Tailwind once. It does not inject a global reset or a second generated Tailwind stylesheet. Host-provided dynamic class strings must also appear literally in scanned source or be safelisted with Tailwind 4 `@source inline()`.

```ts
import { ChangeDetectionStrategy, Component } from '@angular/core';
import {
  DynamicFormComponent,
  TableComponent,
  type FormConfig,
  type TableConfig,
} from '@harmolody/ui';

@Component({
  selector: 'app-example',
  imports: [DynamicFormComponent, TableComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <hui-dynamic-form
      #form
      [config]="formConfig"
      (formSubmit)="save($event); form.finishSubmit()"
    />
    <hui-table [config]="tableConfig" />
  `,
})
export class Example {
  readonly formConfig: FormConfig = {
    fields: [{ key: 'name', label: 'Name', type: 'text', required: true }],
    submitButton: { label: 'Save' },
  };
  readonly tableConfig: TableConfig<{ id: number; name: string }> = {
    rowKey: 'id',
    columns: [{ key: 'name', label: 'Name' }],
    data: [{ id: 1, name: 'May' }],
  };
  save(values: Record<string, unknown>): void {
    console.log(values);
  }
}
```

For async saves, call `finishSubmit()` in `finally` after the request completes. See the form guide for an example.

## Documentation

- [Dynamic form API and examples](projects/ui/docs/dynamic-form.md)
- [Table API and examples](projects/ui/docs/table.md)
- [Tailwind, themes, localization, icons, media adapters](projects/ui/docs/styling-and-adapters.md)
- [Adopting the library in Harmolody Admin](projects/ui/docs/admin-migration.md)
- [Package release checklist](projects/ui/docs/publishing.md)
- [Validation commands and package installation smoke test](projects/ui/docs/testing.md)

## Workspace

```text
harmolody_ui/
  projects/ui/             Publishable Angular library
    src/public-api.ts     Supported public imports
    src/lib/form-builder/ Dynamic form and configuration services
    src/lib/forms/        Supporting controls
    src/lib/table/        Table, custom cells, column selector
    src/lib/config/       Optional application adapters
    styles/theme.css      Tailwind theme entry point
  projects/showcase/       Example app consuming the built package
  projects/ui/docs/       Usage and release documentation
  e2e/                    Browser integration tests
  scripts/                Packed consumer verification
  dist/ui/                Angular Package Format output
  artifacts/              Installable npm tarballs
```

## Scope

The existing admin remains unchanged. This workspace provides the extracted package and a migration guide; switching all admin imports is a separate rollout. Admin media dialogs become an optional host adapter; implicit admin entity routes become explicit column `linkGenerator` callbacks. The unrelated audio waveform range control is outside this package. Existing flexible value contracts are retained for compatibility; schemas support dynamic values and are not end-to-end typed form models.

The source and package use `UNLICENSED`; no open-source license is granted. The root workspace is private. `npm run release:check` validates a release, and `npm run publish:npm` publishes the built package after those checks. See the release guide.

## References

- [Angular: creating and publishing libraries](https://angular.dev/tools/libraries/creating-libraries)
- [Tailwind: detecting classes and registering library sources](https://tailwindcss.com/docs/detecting-classes-in-source-files)
