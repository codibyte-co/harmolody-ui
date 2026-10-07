# Dynamic form

```ts
import { DynamicFormComponent, type FormConfig, type FieldConfig } from '@harmolody/ui';
```

Import `DynamicFormComponent` in a standalone component and render `<hui-dynamic-form>`. `config` is required; `initialValues` is an optional object applied when the component is created. Treat a form instance as one schema and one edit session: recreate it for a different record or substantially different schema. Adding fields to `config` is supported without losing existing values; deleting controls or replacing validators through a new schema is not a general schema reconciliation API.

## Fields

Supported types: `text`, `email`, `password`, `number`, `tel`, `url`, `textarea`, `select`, `radio`, `checkbox`, `switch`, `autocomplete`, `search`, `date`, `datetime`, `month`, `year`, `file`, `image-selector`, `array`.

| Property                                                     | Meaning                                                                                                      |
| ------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------ |
| `key`, `label`, `type`                                       | Stable flat control key, accessible label, control type                                                      |
| `defaultValue`, `required`, `disabled`, `hidden`             | Initial state; disabled values still appear in submitted raw values                                          |
| `placeholder`, `hint`, `helper`, `description`, `note`       | Supporting text; notes support `noteVariant`                                                                 |
| `validation`                                                 | `required`, `email`, `minLength`, `maxLength`, `min`, `max`, `pattern`, `custom` rules                       |
| `options`                                                    | `{label, value, disabled?}` items for choices                                                                |
| `multiple`, `searchable`, `optionPresentation`, `chipLayout` | Multiple choices, dropdown search, dropdown/chips, inline/wrap chips                                         |
| `optionsFromApi`                                             | GET/POST option source; needs host `provideHttpClient()`                                                     |
| `dependsOn`                                                  | `{field, clearOnChange?, refreshOn?}` or an array of dependencies                                            |
| `showWhen`, `hideWhen`                                       | `{field, operator, value?, values?}` or an array; `showWhen` conditions combine with AND, `hideWhen` with OR |
| `fullWidth`, `columnSpan`, `containerClass`, `cssClass`      | Grid positioning and custom classes; grid supports 1–3 columns                                               |
| `min`, `max`, `step`, `rows`, `minDate`, `maxDate`           | Number, textarea, date constraints                                                                           |
| `accept`, `multiple`, `maxSize`, `maxFiles`                  | File selection constraints; values are local file metadata, uploading belongs to the host                    |
| `arrayFields`, `minItems`, `maxItems`, `itemLabel`           | Repeating groups and bounds; `itemLabel` accepts `{index}`                                                   |

Email and numeric fields get corresponding validators automatically. Register custom validators before rendering via `inject(FormBuilderService).registerCustomValidator('uniqueName', validatorFn)` and reference the name in `{type: 'custom', validator: 'uniqueName'}`. Rule `message` is retained in the model but the current field error display uses the built-in error formatter; custom rule messages are not a guaranteed override.

```ts
const config: FormConfig = {
  layout: 'grid',
  columns: 2,
  fieldLayout: 'column',
  validationStrategy: 'submit',
  fieldsets: [{ key: 'profile', legend: 'Profile', fields: ['name', 'genre'] }],
  fields: [
    { key: 'name', label: 'Name', type: 'text', required: true },
    { key: 'genre', label: 'Genre', type: 'select', options: [{ label: 'Folk', value: 'folk' }] },
    { key: 'active', label: 'Active', type: 'switch', defaultValue: false },
    {
      key: 'website',
      label: 'Website',
      type: 'url',
      required: true,
      showWhen: { field: 'active', operator: 'eq', value: true },
    },
    {
      key: 'credits',
      label: 'Credits',
      type: 'array',
      maxItems: 5,
      arrayFields: [{ key: 'name', label: 'Credit name', type: 'text', required: true }],
    },
  ],
  submitButton: { label: 'Save' },
  showCancelButton: { hidden: true },
};
```

`fieldLayout: 'row'` places labels beside controls on wider screens. Fieldsets group presentation while values remain flat. Fields outside fieldsets appear afterwards. Hidden fields keep their values and have validation suspended; visible fields regain validators.

## Inputs, outputs, methods

| API                                         | Payload / behavior                                                                          |
| ------------------------------------------- | ------------------------------------------------------------------------------------------- |
| `config`, `initialValues`                   | Form schema and initial record                                                              |
| `formSubmit`                                | Valid raw values; disables form and holds submit state until `finishSubmit()`               |
| `valueChange`                               | Current enabled control values                                                              |
| `fieldChange`                               | `{values, selectedObjects}` when a choice field has `emitSelectedObject: true`              |
| `reset`, `cancel`                           | Void events                                                                                 |
| `actionClick`                               | `{action, formValue, isValid}` for a custom button action                                   |
| `fieldActionClick`                          | `{fieldKey, formValue}` for a choice field action                                           |
| `finishSubmit()`                            | Releases submission lock, restores configured disabled controls                             |
| `validate()`                                | Shows errors and returns validity                                                           |
| `getRawValue<T>()`                          | Reads all values, including disabled controls                                               |
| `setFieldValue(key, value)`                 | Programmatic field update                                                                   |
| `getField(key)`                             | Gets a rendered dynamic field                                                               |
| `reloadFieldOptions(key)`                   | Reloads a field's API options; set `cache: false` for fresh requests                        |
| `reloadFieldOptionsAndSetValue(key, value)` | Legacy convenience method; uses a 500ms delay and should not be relied on for slow requests |

```ts
async save(values: Record<string, unknown>): Promise<void> {
  try {
    await this.repository.save(values);
  } finally {
    this.form().finishSubmit();
  }
}
```

Built-in Cancel, Reset, Submit buttons appear unless individually hidden. The default Submit button is disabled while invalid. Use a custom submit action without `disableOnInvalid` to allow users to attempt submission and display validation errors. `actions` replaces them with buttons ordered by `order`; `type: 'submit'` and `'reset'` use the standard handlers. Other buttons emit `actionClick`. Variants: `primary`, `secondary`, `outline`, `danger`, `success`, `link`. The reset method clears current values; it does not restore the original record.

## API-backed options

```ts
// Host application providers
provideHttpClient()

// FormConfig
apiConfig: { baseUrl: 'https://api.example.com' },
fields: [{
  key: 'artistId', label: 'Artist', type: 'autocomplete',
  optionsFromApi: {
    url: '/artists', method: 'GET', searchParam: 'query', cache: false,
    map: { data: 'items', label: 'name', value: 'id' },
    dynamicFilters: [{ field: 'genreId', operator: 'eq', valueFrom: 'genreId', whenNotEmpty: true }],
  },
  dependsOn: { field: 'genreId', clearOnChange: true },
}]
```

Use host HTTP interceptors for authentication. Field `baseUrl` overrides the form URL. GET filters become query parameters; POST filters stay in a `filters` array. Request/response transform callbacks support other backend shapes. Cache keys include API configuration, headers, and mapping; `OptionsLoaderService.clearCache(url?)` clears all or matching URL entries. Failed requests currently produce empty options and log an error; the host owns notifications and retry policy. Static forms require no HTTP provider.

Nested arrays inside `arrayFields` are not supported as a recursive array builder. Most initial schema properties are construction-time settings. Properties such as named `onChange`/`onBlur` strings are legacy metadata; handle the emitted Angular events instead. Per-field `emitSelectedObject` controls `fieldChange`; do not rely on the legacy global `emitSelectedObjects` flag alone.
