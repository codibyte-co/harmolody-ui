import { CommonModule, NgComponentOutlet } from '@angular/common';
import {
  Component,
  computed,
  contentChildren,
  effect,
  inject,
  input,
  output,
  signal,
  ChangeDetectionStrategy,
  TemplateRef,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { CheckboxComponent } from '../forms';
import { IconComponent } from '../icon';
import { LocalizationService } from '../config/ui-localization';
import { TableCellDirective } from './table-cell.directive';
import {
  type TableAction,
  ColumnAlign,
  SortDirection,
  TableCellContext,
  TableColumn,
  TableConfig,
  TableRowReorderEvent,
  TableSort,
} from './table.model';

@Component({
  selector: 'hui-table',
  host: { '(keydown.escape)': 'closeAllDropdowns()' },
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    CheckboxComponent,
    IconComponent,
    NgComponentOutlet,
  ],
  templateUrl: './table.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrls: ['./table.css', './table-dropdown.css'],
})
export class TableComponent<T = any> {
  protected readonly localization = inject(LocalizationService);
  protected readonly instanceId = `hui-table-${Math.random().toString(36).slice(2, 11)}`;

  // Inputs
  readonly config = input.required<TableConfig<T>>();

  // Outputs
  readonly sortChange = output<TableSort>();
  readonly pageChange = output<number>();
  readonly pageSizeChange = output<number>();
  readonly selectionChange = output<T[]>();
  readonly rowReorder = output<TableRowReorderEvent<T>>();

  private readonly customCellTemplates = contentChildren<TableCellDirective<T>>(TableCellDirective);
  private inputDataReference: T[] | undefined;

  // Math helper for template
  protected readonly Math = Math;

  constructor() {
    effect(() => {
      const data = this.config().data || [];
      if (data !== this.inputDataReference) {
        this.inputDataReference = data;
        this.tableRows.set([...data]);
      }
    });

    effect(() => {
      const sort = this.config().sort;
      if (!sort) return;
      const current = this.currentSort();
      if (current.column !== sort.column || current.direction !== sort.direction) {
        this.currentSort.set(sort);
      }
    });

    // Sync internal selection state with external config
    effect(() => {
      const selection = this.config().selection;
      if (selection?.selectedRows) {
        const newSelectedKeys = new Set<string | number>();
        const data = this.config().data;

        selection.selectedRows.forEach((selectedRow) => {
          const index = data.indexOf(selectedRow);
          if (index !== -1) {
            const rowKey = this.getRowKey(selectedRow, index);
            newSelectedKeys.add(rowKey);
          }
        });

        this.selectedRows.set(newSelectedKeys);
      }
    });

    effect((onCleanup) => {
      if (this.openDropdowns().size === 0) return;
      const closeDropdowns = () => this.closeAllDropdowns();
      const onScroll = (event: Event): void => {
        if (event.target instanceof Element && event.target.closest('.table-dropdown-menu')) return;
        closeDropdowns();
      };
      const timer = setTimeout(() => {
        document.addEventListener('click', closeDropdowns);
        window.addEventListener('scroll', onScroll, true);
        window.addEventListener('resize', closeDropdowns);
      });
      onCleanup(() => {
        clearTimeout(timer);
        document.removeEventListener('click', closeDropdowns);
        window.removeEventListener('scroll', onScroll, true);
        window.removeEventListener('resize', closeDropdowns);
      });
    });
  }

  // Internal state
  protected readonly selectedRows = signal<Set<string | number>>(new Set());
  protected readonly currentSort = signal<TableSort>({ column: '', direction: null });
  protected readonly openDropdowns = signal<Set<string>>(new Set());
  protected readonly tableRows = signal<T[]>([]);
  protected readonly draggedRowIndex = signal<number | null>(null);
  protected readonly dragOverRowIndex = signal<number | null>(null);
  protected readonly isTableScrolled = signal(false);
  protected readonly dropdownPosition = signal<{
    top: number | null;
    bottom: number | null;
    left: number;
  }>({ top: null, bottom: null, left: 0 });

  // Computed
  protected readonly hasActions = computed(() => {
    const actions = this.config().actions;
    return actions && actions.length > 0;
  });

  protected readonly hasSelection = computed(() => {
    const selection = this.config().selection;
    return selection && selection.mode !== 'none';
  });

  protected readonly isMultiSelect = computed(() => {
    return this.config().selection?.mode === 'multiple';
  });

  protected readonly showRowNumbers = computed(() => {
    return this.config().showRowNumbers || false;
  });

  protected readonly hasStickyHeader = computed(
    () => this.config().stickyHeader !== false || Boolean(this.config().maxHeight),
  );

  protected readonly shouldRenderHeader = computed(
    () => this.config().showHeader !== false || Boolean(this.config().showHeaderOnlyOnScroll),
  );

  protected readonly isHeaderVisible = computed(() =>
    this.config().showHeaderOnlyOnScroll
      ? this.isTableScrolled()
      : this.config().showHeader !== false,
  );

  protected readonly tableMaxHeight = computed(() => {
    if (!this.hasStickyHeader()) return null;
    return this.config().maxHeight || '600px';
  });

  protected readonly hasRowReordering = computed(() => Boolean(this.config().rowReorder?.enabled));

  protected readonly allRowsSelected = computed(() => {
    const data = this.displayedData();
    if (!data.length) return false;
    return data.every((row) => this.isRowSelected(row));
  });

  protected readonly someRowsSelected = computed(() => {
    const data = this.displayedData();
    if (!data.length) return false;
    const selected = data.filter((row) => this.isRowSelected(row));
    return selected.length > 0 && selected.length < data.length;
  });

  protected readonly displayedData = computed(() => {
    return this.tableRows();
  });

  protected readonly totalPages = computed(() => {
    const pagination = this.config().pagination;
    if (!pagination) return 0;
    return Math.ceil(pagination.total / pagination.pageSize);
  });

  protected readonly pageNumbers = computed(() => {
    const total = this.totalPages();
    const current = this.config().pagination?.page || 1;
    const delta = 2;
    const range: number[] = [];
    const rangeWithDots: (number | string)[] = [];
    let l: number | undefined;

    for (let i = 1; i <= total; i++) {
      if (i === 1 || i === total || (i >= current - delta && i <= current + delta)) {
        range.push(i);
      }
    }

    for (const i of range) {
      if (l) {
        if (i - l === 2) {
          rangeWithDots.push(l + 1);
        } else if (i - l !== 1) {
          rangeWithDots.push('...');
        }
      }
      rangeWithDots.push(i);
      l = i;
    }

    return rangeWithDots;
  });

  // Methods
  protected getRowKey(row: T, index: number): string | number {
    const rowKey = this.config().rowKey;
    if (typeof rowKey === 'function') {
      return rowKey(row);
    }
    if (rowKey) {
      return row[rowKey] as string | number;
    }
    return index;
  }

  protected getCellValue(row: T, column: any, index: number): any {
    const keys = column.key.split('.');
    let value: any = row;

    for (const key of keys) {
      value = value?.[key];
      if (value === undefined || value === null) break;
    }

    if (column.render) {
      // If the nested value is null/undefined, pass the whole row to the
      // renderer as some renderers expect the full row (legacy usage).
      const renderArg = value === undefined || value === null ? row : value;
      try {
        return column.render(renderArg, row, index);
      } catch (e) {
        // Fallback: if renderer throws, try calling with the raw value.
        try {
          return column.render(value, row, index);
        } catch (err) {
          return '-';
        }
      }
    }

    return value === '' || value === null || value === undefined ? '-' : value;
  }

  protected getCellTemplate(column: TableColumn<T>): TemplateRef<TableCellContext<T>> | undefined {
    return (
      column.template ??
      this.customCellTemplates().find((cell) => cell.columnKey() === column.key)?.templateRef
    );
  }

  protected getCellIcon(row: T, column: TableColumn<T>, index: number): string {
    return this.resolveColumnValue(column.icon, row, column, index) || '';
  }

  protected getCellIconClass(row: T, column: TableColumn<T>, index: number): string {
    return this.resolveColumnValue(column.iconClass, row, column, index) || '';
  }

  protected getCellIconLabel(row: T, column: TableColumn<T>, index: number): string {
    return this.resolveColumnValue(column.iconLabel, row, column, index) || column.label;
  }

  private resolveColumnValue(
    configValue: string | ((value: any, row: T, index: number) => string) | undefined,
    row: T,
    column: TableColumn<T>,
    index: number,
  ): string | undefined {
    return typeof configValue === 'function'
      ? configValue(this.getCellValue(row, column, index), row, index)
      : configValue;
  }

  protected getCellClass(row: T, column: any): string {
    if (typeof column.cellClass === 'function') {
      return column.cellClass(this.getCellValue(row, column, 0), row);
    }
    return column.cellClass || '';
  }

  protected getRowClass(row: T, index: number): string {
    const rowClass = this.config().rowClass;
    if (typeof rowClass === 'function') {
      return rowClass(row, index);
    }
    return rowClass || '';
  }

  protected onSort(columnKey: string): void {
    const column = this.config().columns.find((col) => col.key === columnKey);
    if (!column?.sortable) return;

    const current = this.currentSort();
    let direction: SortDirection = 'asc';

    if (current.column === columnKey) {
      if (current.direction === 'asc') {
        direction = 'desc';
      } else if (current.direction === 'desc') {
        direction = null;
      }
    }

    const newSort = { column: direction ? columnKey : '', direction };
    this.currentSort.set(newSort);
    this.sortChange.emit(newSort);

    if (this.config().onSort) {
      this.config().onSort!(newSort);
    }
  }

  protected getSortIcon(columnKey: string): string {
    const current = this.currentSort();
    if (current.column !== columnKey || !current.direction) {
      return 'M7 10l5 5 5-5H7z';
    }
    if (current.direction === 'asc') {
      return 'M7 14l5-5 5 5H7z';
    }
    return 'M7 10l5 5 5-5H7z';
  }

  protected isSorted(columnKey: string): boolean {
    return this.currentSort().column === columnKey;
  }

  protected isRowSelected(row: T): boolean {
    const data = this.displayedData();
    const index = data.indexOf(row);
    const key = this.getRowKey(row, index !== -1 ? index : 0);
    return this.selectedRows().has(key);
  }

  protected toggleRowSelection(row: T, index: number): void {
    const key = this.getRowKey(row, index);
    const selected = new Set(this.selectedRows());

    if (this.isMultiSelect()) {
      if (selected.has(key)) {
        selected.delete(key);
      } else {
        selected.add(key);
      }
    } else {
      if (selected.has(key)) {
        selected.clear();
      } else {
        selected.clear();
        selected.add(key);
      }
    }

    this.selectedRows.set(selected);
    this.emitSelection();
  }

  protected toggleAllRows(): void {
    const data = this.displayedData();
    const selected = new Set(this.selectedRows());

    if (this.allRowsSelected()) {
      selected.clear();
    } else {
      data.forEach((row, index) => {
        const key = this.getRowKey(row, index);
        selected.add(key);
      });
    }

    this.selectedRows.set(selected);
    this.emitSelection();
  }

  private emitSelection(): void {
    const data = this.displayedData();
    const selected = data.filter((row) => this.isRowSelected(row));
    this.selectionChange.emit(selected);

    const selection = this.config().selection;
    if (selection?.onSelectionChange) {
      selection.onSelectionChange(selected);
    }
  }

  protected isRowReorderDisabled(row: T, index: number): boolean {
    return this.config().rowReorder?.disabled?.(row, index) ?? false;
  }

  protected onRowReorderHandleClick(row: T, index: number, event: Event): void {
    event.stopPropagation();
    if (this.isRowReorderDisabled(row, index)) {
      this.config().rowReorder?.onDisabledAttempt?.(row, index);
    }
  }

  protected onRowDragStart(event: DragEvent, index: number): void {
    const row = this.displayedData()[index];
    if (!row || this.isRowReorderDisabled(row, index)) {
      event.preventDefault();
      if (row) this.config().rowReorder?.onDisabledAttempt?.(row, index);
      return;
    }

    this.draggedRowIndex.set(index);
    event.dataTransfer?.setData('text/plain', String(this.getRowKey(row, index)));
    if (event.dataTransfer) event.dataTransfer.effectAllowed = 'move';
  }

  protected onRowDragOver(event: DragEvent, index: number): void {
    const draggedIndex = this.draggedRowIndex();
    const row = this.displayedData()[index];
    if (draggedIndex === null || !row || this.isRowReorderDisabled(row, index)) return;

    event.preventDefault();
    if (event.dataTransfer) event.dataTransfer.dropEffect = 'move';
    this.dragOverRowIndex.set(index);
  }

  protected onRowDrop(event: DragEvent, currentIndex: number): void {
    event.preventDefault();
    const previousIndex = this.draggedRowIndex();
    const targetRow = this.displayedData()[currentIndex];
    if (!targetRow || this.isRowReorderDisabled(targetRow, currentIndex)) {
      this.clearRowDragState();
      return;
    }
    if (previousIndex === null || previousIndex === currentIndex) {
      this.clearRowDragState();
      return;
    }

    const data = [...this.displayedData()];
    const [row] = data.splice(previousIndex, 1);
    if (!row) {
      this.clearRowDragState();
      return;
    }

    data.splice(currentIndex, 0, row);
    this.tableRows.set(data);

    const reorderEvent: TableRowReorderEvent<T> = {
      row,
      previousIndex,
      currentIndex,
      data: [...data],
    };
    this.rowReorder.emit(reorderEvent);
    this.config().rowReorder?.onReorder?.(reorderEvent);
    this.clearRowDragState();
  }

  protected clearRowDragState(): void {
    this.draggedRowIndex.set(null);
    this.dragOverRowIndex.set(null);
  }

  protected onPageChange(page: number | string): void {
    if (typeof page === 'string') return;

    this.pageChange.emit(page);

    const config = this.config();
    if (config.onPageChange) {
      config.onPageChange(page);
    }
  }

  protected onPageSizeChange(event: Event): void {
    const target = event.target as HTMLSelectElement;
    const pageSize = parseInt(target.value, 10);

    this.pageSizeChange.emit(pageSize);

    const config = this.config();
    if (config.onPageSizeChange) {
      config.onPageSizeChange(pageSize);
    }
  }

  protected getVisibleActions(row: T): TableAction<T>[] {
    const collect = (actions: TableAction<T>[], parentDisabled = false): TableAction<T>[] =>
      actions.flatMap((action) => {
        if (action.hidden?.(row)) return [];
        const disabled = parentDisabled || Boolean(action.disabled?.(row));
        if (action.submenu?.length) return collect(action.submenu, disabled);
        return [
          { ...action, icon: action.icon || 'arrow-narrow-right-dashed', disabled: () => disabled },
        ];
      });
    const items = collect(this.config().actions ?? []).filter(
      (action, index, actions) =>
        !action.divider || (index > 0 && index < actions.length - 1 && !actions[index - 1].divider),
    );
    if (!items.some((action) => !action.divider)) return [];
    return [
      { label: 'More actions', title: 'More actions', icon: 'more-vertical', submenu: items },
    ];
  }

  protected isActionDisabled(action: TableAction<T>, row: T): boolean {
    return action.disabled ? action.disabled(row) : false;
  }

  protected getActionVariantClass(variant?: string): string {
    switch (variant) {
      case 'primary':
        return 'bg-primary/12 text-primary hover:bg-primary/20';
      case 'secondary':
        return 'bg-secondary/12 text-secondary hover:bg-secondary/20';
      case 'danger':
        return 'bg-destructive/12 text-destructive hover:bg-destructive/20';
      case 'success':
        return 'bg-success-500/12 text-success-600 hover:bg-success-500/20';
      default:
        return 'bg-surface text-text-secondary hover:bg-surface-hover';
    }
  }

  protected getActionSubmenuVariantClass(variant?: string): string {
    switch (variant) {
      case 'primary':
        return 'hover:bg-primary/12 text-primary';
      case 'secondary':
        return 'hover:bg-secondary/12 text-secondary';
      case 'danger':
        return 'text-destructive hover:bg-destructive/12';
      case 'success':
        return 'hover:bg-success-500/12 text-success-600';
      default:
        return 'hover:bg-surface-hover text-text-secondary';
    }
  }

  protected getAlignClass(align?: string): string {
    switch (align) {
      case 'center':
        return 'text-center';
      case 'right':
        return 'text-right';
      default:
        return 'text-left';
    }
  }

  protected getHeaderAlign(column: TableColumn<T>): ColumnAlign {
    return column.headerAlign ?? this.config().headerAlign ?? column.align ?? 'left';
  }

  protected getHeaderContentAlignClass(column: TableColumn<T>): string {
    switch (this.getHeaderAlign(column)) {
      case 'center':
        return 'justify-center';
      case 'right':
        return 'justify-end';
      default:
        return 'justify-start';
    }
  }

  protected onTableScroll(event: Event): void {
    this.isTableScrolled.set((event.currentTarget as HTMLElement).scrollTop > 0);
  }

  protected getResponsiveHideClass(column: any): string {
    if (!column.hideOnScreens || column.hideOnScreens.length === 0) {
      return '';
    }

    const classes: string[] = [];

    for (const screen of column.hideOnScreens) {
      switch (screen) {
        case 'sm':
          classes.push('max-sm:hidden');
          break;
        case 'md':
          classes.push('max-md:hidden');
          break;
        case 'lg':
          classes.push('max-lg:hidden');
          break;
        case 'xl':
          classes.push('max-xl:hidden');
          break;
      }
    }

    return classes.join(' ');
  }

  protected getRowNumber(index: number): number {
    const pagination = this.config().pagination;
    if (pagination) {
      return (pagination.page - 1) * pagination.pageSize + index + 1;
    }
    return index + 1;
  }

  protected getComponentInputs(row: T, column: any, index: number): Record<string, any> {
    if (!column.componentInputs) {
      return {};
    }
    const value = this.getCellValue(row, column, index);
    return column.componentInputs(row, value, index);
  }

  protected getLinkUrl(row: T, column: TableColumn<T>): string | null {
    if (column.linkGenerator) {
      return column.linkGenerator(row);
    }
    if (column.type && !['text', 'link'].includes(column.type)) return null;
    return null;
  }

  protected onRowClick(row: T, index: number, event: Event): void {
    // Don't trigger row click if clicking on interactive elements
    const target = event.target as HTMLElement;
    if (target.closest('input, button, a')) {
      return;
    }

    const config = this.config();
    if (config.onRowClick) {
      config.onRowClick(row, index);
    }
  }

  protected onLinkClick(row: T, column: any, event: Event): void {
    event.stopPropagation();
    // Call onClick handler if present (navigation will happen via routerLink)
    if (column.onClick) {
      column.onClick(row);
    }
  }

  protected toggleDropdown(
    rowIndex: number,
    actionIndex: number,
    buttonElement?: HTMLElement,
  ): void {
    const dropdownKey = `${rowIndex}-${actionIndex}`;
    const dropdowns = new Set(this.openDropdowns());

    if (dropdowns.has(dropdownKey)) {
      dropdowns.delete(dropdownKey);
    } else {
      dropdowns.clear(); // Close all other dropdowns
      dropdowns.add(dropdownKey);

      // Calculate and store position when opening
      if (buttonElement) {
        this.dropdownPosition.set(this.calculateDropdownPosition(buttonElement));
      }
    }

    this.openDropdowns.set(dropdowns);
  }

  protected isDropdownOpen(rowIndex: number, actionIndex: number): boolean {
    const dropdownKey = `${rowIndex}-${actionIndex}`;
    return this.openDropdowns().has(dropdownKey);
  }

  protected closeAllDropdowns(): void {
    this.openDropdowns.set(new Set());
  }

  protected hasSubmenu(action: any): boolean {
    return action.submenu && action.submenu.length > 0;
  }

  protected handleActionClick(action: any, row: T, index: number, event: Event): void {
    event.stopPropagation();

    if (this.hasSubmenu(action)) {
      return; // Dropdown toggle is handled separately
    }

    if (action.onClick && !this.isActionDisabled(action, row)) {
      action.onClick(row, index);
    }
  }

  protected getDropdownId(rowIndex: number, actionIndex: number): string {
    return `${this.instanceId}-dropdown-${rowIndex}-${actionIndex}`;
  }

  private calculateDropdownPosition(buttonElement: HTMLElement): {
    top: number | null;
    bottom: number | null;
    left: number;
  } {
    if (!buttonElement) {
      return { top: null, bottom: null, left: 0 };
    }

    const rect = buttonElement.getBoundingClientRect();
    const dropdownWidth = 224; // w-56 = 14rem = 224px
    const dropdownHeight = 200; // approximate height for determining direction
    const viewportHeight = window.innerHeight;
    const viewportWidth = window.innerWidth;
    const spacing = 8;

    // Determine vertical position (below or above button)
    const spaceBelow = viewportHeight - rect.bottom;
    const showAbove = spaceBelow < dropdownHeight + spacing && rect.top > dropdownHeight + spacing;

    // Use bottom positioning when showing above (more reliable than estimating height)
    const top = showAbove ? null : rect.bottom + spacing;
    const bottom = showAbove ? viewportHeight - rect.top + spacing : null;

    // Determine horizontal position (align right edge with button, but keep in viewport)
    let left = rect.right - dropdownWidth;
    if (left < spacing) {
      left = spacing;
    }
    if (left + dropdownWidth > viewportWidth - spacing) {
      left = viewportWidth - dropdownWidth - spacing;
    }

    return { top, bottom, left };
  }
}
