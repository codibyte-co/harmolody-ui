import { CommonModule } from '@angular/common';
import {
  Component,
  computed,
  effect,
  input,
  output,
  signal,
  ChangeDetectionStrategy,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CheckboxComponent } from '../checkbox/checkbox';
import { IconComponent } from '../../icon';

export interface CheckboxDropdownOption {
  label: string;
  value: string | boolean;
  checked?: boolean;
}

@Component({
  selector: 'hui-checkbox-dropdown',
  imports: [CommonModule, FormsModule, IconComponent, CheckboxComponent],
  templateUrl: './checkbox-dropdown.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrls: ['./checkbox-dropdown.css'],
})
export class CheckboxDropdownComponent {
  // Inputs
  readonly label = input<string>('Filters');
  readonly options = input.required<CheckboxDropdownOption[]>();
  readonly buttonClass = input<string>('');
  readonly icon = input<string>('checks');

  // Outputs
  readonly selectionChange = output<CheckboxDropdownOption[]>();

  // State
  protected readonly isOpen = signal<boolean>(false);
  protected readonly selectedOptions = signal<CheckboxDropdownOption[]>([]);

  // Computed
  protected readonly selectedCount = computed(() => this.selectedOptions().length);
  protected readonly displayLabel = computed(() => {
    const count = this.selectedCount();
    return count > 0 ? `${this.label()} (${count})` : this.label();
  });

  constructor() {
    // Initialize selected options from input
    effect(() => {
      const opts = this.options().filter((opt) => opt.checked);
      this.selectedOptions.set(opts);
    });
  }

  protected toggleDropdown(): void {
    this.isOpen.update((open) => !open);
  }

  protected closeDropdown(): void {
    this.isOpen.set(false);
  }

  protected onCheckboxChange(option: CheckboxDropdownOption, checked: boolean): void {
    const selected = this.selectedOptions();
    if (checked) {
      if (selected.some((opt) => opt.value === option.value)) {
        return;
      }
      this.selectedOptions.set([...selected, option]);
    } else {
      this.selectedOptions.set(selected.filter((opt) => opt.value !== option.value));
    }
    this.selectionChange.emit(this.selectedOptions());
  }

  protected isChecked(option: CheckboxDropdownOption): boolean {
    return this.selectedOptions().some((opt) => opt.value === option.value);
  }

  protected clearAll(): void {
    this.selectedOptions.set([]);
    this.selectionChange.emit([]);
  }
}
