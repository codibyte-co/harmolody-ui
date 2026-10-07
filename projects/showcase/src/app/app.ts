import { ChangeDetectionStrategy, Component, computed, signal, viewChild } from '@angular/core';
import { JsonPipe } from '@angular/common';
import {
  DynamicFormComponent,
  TableComponent,
  TableCellDirective,
  TableColumnSelectorComponent,
  type FormConfig,
  type TableConfig,
  type TableColumn,
  type TableSort,
} from '@harmolody/ui';

interface Artist {
  id: number;
  name: string;
  email: string;
  genre: string;
  active: boolean;
}

@Component({
  selector: 'app-root',
  imports: [
    DynamicFormComponent,
    TableComponent,
    TableCellDirective,
    TableColumnSelectorComponent,
    JsonPipe,
  ],
  templateUrl: './app.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class App {
  readonly form = viewChild.required(DynamicFormComponent);
  readonly saved = signal<Record<string, unknown> | null>(null);
  readonly rows = signal<Artist[]>([
    { id: 1, name: 'May', email: 'may@example.com', genre: 'Folk', active: true },
    { id: 2, name: 'Noah', email: 'noah@example.com', genre: 'Pop', active: true },
    { id: 3, name: 'Mia', email: 'mia@example.com', genre: 'Gospel', active: false },
    { id: 4, name: 'James', email: 'james@example.com', genre: 'Folk', active: true },
    { id: 5, name: 'Lily', email: 'lily@example.com', genre: 'Pop', active: false },
    { id: 6, name: 'Daniel', email: 'daniel@example.com', genre: 'Gospel', active: true },
  ]);
  readonly selected = signal<Artist[]>([]);
  readonly page = signal(1);
  readonly pageSize = signal(3);
  readonly sort = signal<TableSort>({ column: '', direction: null });
  readonly notice = signal('');
  readonly dark = signal(false);
  readonly columns: TableColumn<Artist>[] = [
    { key: 'name', label: 'Artist', sortable: true, hideable: false },
    { key: 'email', label: 'Email', sortable: true },
    { key: 'genre', label: 'Genre', sortable: true },
    { key: 'active', label: 'Status', type: 'template' },
  ];
  readonly visibleColumnKeys = signal(this.columns.map((column) => column.key));
  readonly formConfig: FormConfig = {
    layout: 'grid',
    columns: 2,
    validationStrategy: 'submit',
    fieldsets: [
      {
        key: 'profile',
        legend: 'Artist profile',
        description: 'These fields come from a reusable form configuration.',
        fields: ['name', 'email', 'genre', 'active'],
      },
      { key: 'details', legend: 'More details', fields: ['website', 'bio', 'links'] },
    ],
    fields: [
      {
        key: 'name',
        label: 'Artist name',
        type: 'text',
        required: true,
        placeholder: 'Artist name',
        validation: [{ type: 'minLength', value: 2 }],
      },
      {
        key: 'email',
        label: 'Email',
        type: 'email',
        required: true,
        placeholder: 'artist@example.com',
      },
      {
        key: 'genre',
        label: 'Genre',
        type: 'select',
        required: true,
        options: [
          { label: 'Folk', value: 'Folk' },
          { label: 'Pop', value: 'Pop' },
          { label: 'Gospel', value: 'Gospel' },
        ],
      },
      { key: 'active', label: 'Active artist', type: 'switch', defaultValue: true },
      {
        key: 'website',
        label: 'Website',
        type: 'url',
        placeholder: 'https://example.com',
        showWhen: { field: 'active', operator: 'eq', value: true },
      },
      { key: 'bio', label: 'Biography', type: 'textarea', rows: 3, fullWidth: true },
      {
        key: 'links',
        label: 'Social links',
        type: 'array',
        maxItems: 3,
        fullWidth: true,
        itemLabel: 'Link {index}',
        arrayFields: [{ key: 'url', label: 'URL', type: 'url', required: true }],
      },
    ],
    showCancelButton: { hidden: true },
    actions: [
      {
        key: 'reset',
        label: 'Reset',
        type: 'reset',
        variant: 'outline',
        icon: 'reload',
        disableOnSubmitting: true,
      },
      {
        key: 'submit',
        label: 'Add artist',
        type: 'submit',
        variant: 'primary',
        icon: 'check',
        disableOnSubmitting: true,
      },
    ],
  };
  readonly tableConfig = computed<TableConfig<Artist>>(() => {
    const sort = this.sort();
    const rows = [...this.rows()];
    if (sort.direction) {
      rows.sort((a, b) => {
        const key = sort.column as keyof Artist;
        return String(a[key]).localeCompare(String(b[key])) * (sort.direction === 'asc' ? 1 : -1);
      });
    }
    const start = (this.page() - 1) * this.pageSize();
    return {
      columns: this.columns.filter((column) => this.visibleColumnKeys().includes(column.key)),
      data: rows.slice(start, start + this.pageSize()),
      rowKey: 'id',
      sort,
      hoverable: true,
      striped: true,
      showRowNumbers: true,
      maxHeight: '420px',
      pagination: {
        page: this.page(),
        pageSize: this.pageSize(),
        total: rows.length,
        pageSizeOptions: [3, 5, 10],
      },
      selection: { mode: 'multiple', selectedRows: this.selected() },
      actions: [
        {
          label: 'View artist',
          icon: 'eye',
          onClick: (row) => this.notice.set(`Viewing ${row.name}`),
        },
      ],
    };
  });

  save(value: Record<string, unknown>): void {
    this.saved.set(value);
    this.rows.update((rows) => [
      ...rows,
      {
        id: Math.max(0, ...rows.map((row) => row.id)) + 1,
        name: String(value['name']),
        email: String(value['email']),
        genre: String(value['genre']),
        active: Boolean(value['active']),
      },
    ]);
    this.form().finishSubmit();
    this.notice.set('Artist added. The table now includes your entry.');
  }

  changeSort(sort: TableSort): void {
    this.sort.set(sort);
    this.page.set(1);
  }
  changePageSize(size: number): void {
    this.pageSize.set(size);
    this.page.set(1);
  }
}
