# Table

```ts
import {
  TableComponent,
  TableCellDirective,
  TableColumnSelectorComponent,
  type TableConfig,
  type TableColumn,
  type TableSort,
} from '@harmolody/ui';
```

`<hui-table [config]="config()" />` renders the supplied rows. **The table emits sorting and pagination requests; the host sorts, fetches, and slices data.** It does not silently paginate or sort the provided array. The showcase demonstrates client-side handling; server-driven projects can pass a page returned by their API.

```ts
interface Artist {
  id: string;
  name: string;
  active: boolean;
}
const config: TableConfig<Artist> = {
  rowKey: 'id',
  columns: [
    { key: 'name', label: 'Artist', sortable: true },
    { key: 'active', label: 'Status', type: 'template' },
  ],
  data: [{ id: '1', name: 'May', active: true }],
  pagination: { page: 1, pageSize: 10, total: 48, pageSizeOptions: [10, 20, 50] },
  selection: { mode: 'multiple', selectedRows: [] },
  actions: [{ label: 'Edit', icon: 'edit', onClick: (row) => console.log(row.id) }],
  stickyHeader: true,
  maxHeight: '480px',
  hoverable: true,
};
```

## Custom cells

```html
<hui-table [config]="config()">
  <ng-template huiTableCell="active" let-value let-row="row" let-index="index" let-column="column">
    <span>{{ row.active ? 'Active' : 'Draft' }}</span>
  </ng-template>
</hui-table>
```

Import `TableCellDirective` alongside the table. Template context: `$implicit` cell value, `row`, `index`, `column`. You can also supply `column.template` or render a standalone component with `type: 'component'`, `component`, and `componentInputs`.

## Configuration

| Property                                                        | Behavior                                                                                  |
| --------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| `columns`, `data`                                               | Visible columns and currently displayed rows                                              |
| `rowKey`                                                        | Stable property or `(row) => string \| number`; always provide it for selection/reorder   |
| `sort`                                                          | Controlled `{column, direction: 'asc' \| 'desc' \| null}`                                 |
| `pagination`                                                    | 1-based page, page size, total record count                                               |
| `selection`                                                     | `none`, `single`, `multiple`; selected row objects from current page                      |
| `actions`                                                       | Label/icon/callback, `hidden(row)`, `disabled(row)`, variant, submenu, divider            |
| `loading`, `emptyMessage`                                       | Loading and empty states                                                                  |
| `stickyHeader`, `maxHeight`                                     | Sticky header, 600px default max height; disable sticky for natural page layout           |
| `showHeader`, `showHeaderOnlyOnScroll`                          | Header visibility options                                                                 |
| `bordered`, `striped`, `hoverable`, `compact`, `showRowNumbers` | Presentation                                                                              |
| `rowReorder`                                                    | `{enabled, disabled?, onDisabledAttempt?, onReorder?}`; emits reordered current-page rows |
| `rowClass`, `onRowClick`                                        | Custom row classes and click handler                                                      |

Column options: dotted `key` lookup (e.g. `profile.name`), `label`, `sortable`, `align`, `headerAlign`, `width`, `type` (`text`, `image`, `icon`, `link`, `component`, `template`), `render(value, row, index)`, `cellClass`, `hideable`, `hideOnScreens`. Image columns support fallback and classes; icon columns accept static or callback names/classes/labels. Render callbacks produce text, not raw HTML.

Links are explicit: use `linkGenerator(row)`, optional `linkTarget`, and `onClick(row)`. Internal links use Angular Router; configure `provideRouter(routes)` in the host when using them. The extracted library no longer guesses Harmolody entity routes from column names.

## Events

| Output            | Payload                                                      |
| ----------------- | ------------------------------------------------------------ |
| `sortChange`      | `{column, direction}`; cycles ascending, descending, cleared |
| `pageChange`      | Requested 1-based page                                       |
| `pageSizeChange`  | Requested size; host resets page to 1                        |
| `selectionChange` | Selected displayed row objects                               |
| `rowReorder`      | `{row, previousIndex, currentIndex, data}`                   |

Equivalent config callbacks are also supported (`onSort`, `onPageChange`, `onPageSizeChange`, selection `onSelectionChange`, reorder `onReorder`). Choose outputs or callbacks for a given action to avoid duplicate API requests. Update config and data immutably because components use OnPush and signals. Selection is page-local; manage cross-page selection in the host. Sorting headers support Enter/Space and expose `aria-sort`.

## Column selector

```html
<hui-table-column-selector
  [allColumns]="columns"
  [visibleColumnKeys]="visibleKeys()"
  (visibleColumnsChange)="visibleKeys.set($event)"
/>
```

Filter the table's `columns` using `visibleKeys`. `hideable: false` pins a column. The component never persists preferences automatically; the host may save keys in its user settings.
