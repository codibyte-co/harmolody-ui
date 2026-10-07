import { CommonModule } from '@angular/common';
import { Component, computed, input, output, signal, ChangeDetectionStrategy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CheckboxComponent } from '../../forms';
import { TableColumn } from '../table.model';
import { twMerge } from 'tailwind-merge';

@Component({
  selector: 'hui-table-column-selector',
  templateUrl: './table-column-selector.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule, CheckboxComponent],
})
export class TableColumnSelectorComponent {
  // Inputs
  readonly allColumns = input.required<TableColumn[]>();
  readonly visibleColumnKeys = input.required<string[]>();
  readonly class = input<string>('');

  // Outputs
  readonly visibleColumnsChange = output<string[]>();

  // State
  protected readonly isOpen = signal(false);

  // Computed
  protected readonly hideableColumns = computed(() =>
    this.allColumns().filter((col) => col.hideable !== false),
  );

  protected readonly buttonClasses = computed(() => {
    const baseClasses =
      'inline-flex items-center gap-2 px-3 py-2  font-medium text-text-secondary bg-card rounded hover:bg-surface-hover focus:outline-none  focus:ring-offset-2 transition-colors border border-border';
    return twMerge(baseClasses, this.class());
  });

  protected readonly allSelected = computed(() => {
    const hideable = this.hideableColumns();
    const visible = this.visibleColumnKeys();
    return hideable.length > 0 && hideable.every((col) => visible.includes(col.key));
  });

  protected readonly someSelected = computed(() => {
    const hideable = this.hideableColumns();
    const visible = this.visibleColumnKeys();
    const selectedCount = hideable.filter((col) => visible.includes(col.key)).length;
    return selectedCount > 0 && selectedCount < hideable.length;
  });

  protected toggleDropdown(): void {
    this.isOpen.update((open) => !open);
  }

  protected closeDropdown(): void {
    this.isOpen.set(false);
  }

  protected isColumnVisible(key: string): boolean {
    return this.visibleColumnKeys().includes(key);
  }

  protected toggleColumn(key: string): void {
    const visible = [...this.visibleColumnKeys()];
    const index = visible.indexOf(key);

    if (index > -1) {
      // Don't allow hiding the last visible column
      if (visible.length <= 1) {
        return;
      }
      visible.splice(index, 1);
    } else {
      visible.push(key);
    }

    this.visibleColumnsChange.emit(visible);
  }

  protected onColumnVisibilityChange(key: string, checked: boolean): void {
    const currentlyVisible = this.isColumnVisible(key);

    if (checked === currentlyVisible) {
      return;
    }

    if (!checked && this.visibleColumnKeys().length <= 1) {
      return;
    }

    this.toggleColumn(key);
  }

  protected selectAll(): void {
    const allKeys = this.allColumns().map((col) => col.key);
    this.visibleColumnsChange.emit(allKeys);
  }

  protected deselectAll(): void {
    // Keep at least one column visible - keep the first hideable column
    const firstKey = this.hideableColumns()[0]?.key;
    if (firstKey) {
      const pinned = this.allColumns()
        .filter((col) => col.hideable === false)
        .map((col) => col.key);
      this.visibleColumnsChange.emit(pinned.length ? pinned : [firstKey]);
    }
  }

  protected resetToDefault(): void {
    // Reset to all columns visible
    const allKeys = this.allColumns().map((col) => col.key);
    this.visibleColumnsChange.emit(allKeys);
  }
}
