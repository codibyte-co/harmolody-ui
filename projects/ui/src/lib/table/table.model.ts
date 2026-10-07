import { TemplateRef, Type } from '@angular/core';

export type ColumnAlign = 'left' | 'center' | 'right';
export type SortDirection = 'asc' | 'desc' | null;

export interface TableCellContext<T = unknown> {
  $implicit: unknown;
  row: T;
  index: number;
  column: TableColumn<T>;
}

export interface TableColumn<T = any> {
  key: string;
  label: string;
  sortable?: boolean;
  align?: ColumnAlign;
  headerAlign?: ColumnAlign;
  width?: string;
  type?: 'text' | 'image' | 'icon' | 'link' | 'component' | 'template';
  imageClass?: string;
  imageFallback?: string;
  icon?: string | ((value: any, row: T, index: number) => string);
  iconClass?: string | ((value: any, row: T, index: number) => string);
  iconLabel?: string | ((value: any, row: T, index: number) => string);
  iconSize?: number;
  linkGenerator?: (row: T) => string | null;
  linkTarget?: '_blank' | '_self';
  onClick?: (row: T) => void; // Click handler for links (works with linkGenerator for Angular routing)
  render?: (value: any, row: T, index: number) => string | null;
  component?: Type<any>; // Angular component to render
  componentInputs?: (row: T, value: any, index: number) => Record<string, any>; // Function to generate component inputs
  template?: TemplateRef<TableCellContext<T>>; // Template reference for custom rendering
  cellClass?: string | ((value: any, row: T) => string);
  hideable?: boolean; // Whether column can be hidden via column selector (default: true)
  hideOnScreens?: ('sm' | 'md' | 'lg' | 'xl')[]; // Hide column on specific screen sizes
}

export interface TableAction<T = any> {
  label: string;
  icon?: string;
  onClick?: (row: T, index: number) => void;
  disabled?: (row: T) => boolean;
  hidden?: (row: T) => boolean;
  variant?: 'primary' | 'secondary' | 'danger' | 'success';
  title?: string;
  submenu?: TableAction<T>[];
  divider?: boolean;
}

export interface TableSort {
  column: string;
  direction: SortDirection;
}

export interface TablePagination {
  layout?: 'stacked';
  page: number;
  pageSize: number;
  total: number;
  pageSizeOptions?: number[];
}

export interface TableSelection<T = any> {
  mode: 'none' | 'single' | 'multiple';
  selectedRows: T[];
  onSelectionChange?: (rows: T[]) => void;
}

export interface TableRowReorderEvent<T = any> {
  row: T;
  previousIndex: number;
  currentIndex: number;
  data: T[];
}

export interface TableRowReorder<T = any> {
  enabled: boolean;
  disabled?: (row: T, index: number) => boolean;
  onDisabledAttempt?: (row: T, index: number) => void;
  onReorder?: (event: TableRowReorderEvent<T>) => void;
}

export interface TableConfig<T = any> {
  columns: TableColumn<T>[];
  data: T[];
  rowKey?: keyof T | ((row: T) => string | number);
  actions?: TableAction<T>[];
  pagination?: TablePagination;
  selection?: TableSelection<T>;
  sort?: TableSort;
  loading?: boolean;
  emptyMessage?: string;
  headerAlign?: ColumnAlign;
  stickyHeader?: boolean;
  showHeader?: boolean;
  showHeaderOnlyOnScroll?: boolean;
  maxHeight?: string;
  rowReorder?: TableRowReorder<T>;
  bordered?: boolean;
  striped?: boolean;
  hoverable?: boolean;
  compact?: boolean;
  showRowNumbers?: boolean;
  onSort?: (sort: TableSort) => void;
  onPageChange?: (page: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
  onRowClick?: (row: T, index: number) => void;
  rowClass?: string | ((row: T, index: number) => string);
}
