# Adopt in Harmolody Admin

The extraction leaves `harmolody_admin` unchanged. Migrate one feature first, then replace imports gradually. The current admin starts at Angular 22.1.x; this library targets 22.2.1, so align its Angular/CLI/compiler versions before installing.

1. Build and pack this workspace: `npm run pack`.
2. In the admin, install `../harmolody_ui/artifacts/harmolody-ui-0.1.0.tgz`.
3. Add `@source '../node_modules/@harmolody/ui';` in the admin's global CSS. If retaining the existing semantic Tailwind theme, map existing colors to `--hui-*` variables or integrate the library's theme carefully to avoid duplicate semantic definitions.
4. Replace shared component imports with package imports. Keep config names and Reactive Forms behavior. Rename selectors and the cell directive.
5. Supply localization/media adapters using host services in a provider factory; configure explicit table link generators.
6. Run the admin's existing tests and production build, inspect real dialogs and data pages, then remove old shared files only after all consumers migrate.

| Old                                       | Package equivalent                              |
| ----------------------------------------- | ----------------------------------------------- |
| `@shared/components/form-builder`         | `@harmolody/ui`                                 |
| `@shared/components/table`                | `@harmolody/ui`                                 |
| `@shared/components/forms`                | Supporting control exports from `@harmolody/ui` |
| `<app-dynamic-form>`                      | `<hui-dynamic-form>`                            |
| `<app-table>`                             | `<hui-table>`                                   |
| `appTableCell`                            | `huiTableCell`                                  |
| `<app-table-column-selector>`             | `<hui-table-column-selector>`                   |
| Implicit artist/user/etc. route discovery | Column `linkGenerator` callback                 |
| Built-in admin media dialog               | Host `selectMedia` adapter                      |

For Angular DI integrations:

```ts
import { inject } from '@angular/core';
import { HARMOLODY_UI_CONFIG, HARMOLODY_MEDIA_SELECTOR } from '@harmolody/ui';

providers: [
  {
    provide: HARMOLODY_UI_CONFIG,
    useFactory: () => {
      const localization = inject(LocalizationService); // Your admin service
      return {
        translate: (text: string, params?: Record<string, string | number>) =>
          localization.translate(text, params),
      };
    },
  },
  {
    provide: HARMOLODY_MEDIA_SELECTOR,
    useFactory: () => {
      const dialog = inject(DialogService); // Your admin service
      return async (request: MediaSelectorRequest) => {
        const result = await dialog.open(MediaSelectorDialogComponent, dialogOptions, request);
        return result.action === 'confirm' ? result.data.fileUrl : undefined;
      };
    },
  },
];
```

The example assumes your existing dialog contract and imports; adapt options to the admin implementation. Do not additionally call `provideHarmolodyUi()` after these token providers because it would replace them.

Behavior changes to review: validation is restored when conditional required fields reappear; submission remains locked until `finishSubmit()`; configured disabled fields stay disabled afterwards; column selector bulk actions preserve pinned columns. These fixes live only in the extracted package. Initial record replacement and general schema removal still require a new form instance.
