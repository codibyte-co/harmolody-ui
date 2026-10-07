import {
  ChangeDetectionStrategy,
  Component,
  computed,
  forwardRef,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { LocalizationService } from '../../config/ui-localization';
import type { SelectOption } from '../../form-builder/models';
import { IconComponent } from '../../icon';

export type ChoiceChipsLayout = 'inline' | 'wrap';
export type ChoiceChipsValue = unknown | unknown[] | null;

export interface ChoiceChipsActionButton {
  icon: string;
  ariaLabel: string;
  tooltip?: string;
}

let nextChoiceChipsId = 0;

@Component({
  selector: 'hui-choice-chips',
  imports: [IconComponent],
  templateUrl: './choice-chips.html',
  host: {
    class: 'block',
  },
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => ChoiceChipsComponent),
      multi: true,
    },
  ],
})
export class ChoiceChipsComponent implements ControlValueAccessor {
  protected readonly localization = inject(LocalizationService);

  readonly id = input<string>('');
  readonly options = input<SelectOption[]>([]);
  readonly multiple = input<boolean>(false);
  readonly layout = input<ChoiceChipsLayout>('wrap');
  readonly ariaLabel = input<string>('');
  readonly ariaDescribedby = input<string>('');
  readonly invalid = input<boolean>(false);
  readonly action = input<ChoiceChipsActionButton | undefined>(undefined);

  readonly actionClick = output<void>();

  private readonly generatedId = `hui-choice-chips-${nextChoiceChipsId++}`;
  protected readonly value = signal<ChoiceChipsValue>(null);
  protected readonly isDisabled = signal(false);
  protected readonly controlId = computed(() => this.id() || this.generatedId);
  protected readonly groupClasses = computed(() =>
    this.layout() === 'inline'
      ? 'flex min-w-0 flex-1 flex-nowrap gap-2 overflow-x-auto py-0.5'
      : 'flex flex-1 flex-wrap gap-2 py-0.5',
  );

  private onChangeFn: (value: ChoiceChipsValue) => void = () => {};
  private onTouchedFn: () => void = () => {};

  protected optionId(index: number): string {
    return `${this.controlId()}-option-${index}`;
  }

  protected isSelected(option: SelectOption): boolean {
    const currentValue = this.value();
    const selectedValues = Array.isArray(currentValue)
      ? currentValue
      : currentValue === null || currentValue === ''
        ? []
        : [currentValue];

    return selectedValues.some((selectedValue) => Object.is(selectedValue, option.value));
  }

  protected optionClasses(option: SelectOption): string {
    const selectedClasses = this.isSelected(option)
      ? 'border-primary bg-primary/10 text-primary'
      : this.invalid()
        ? 'border-destructive bg-surface text-foreground hover:bg-surface-hover'
        : 'border-border bg-surface text-foreground hover:bg-surface-hover';
    const disabledClasses =
      this.isDisabled() || option.disabled
        ? 'cursor-not-allowed opacity-50'
        : 'cursor-pointer focus-within:ring-2 focus-within:ring-primary focus-within:ring-offset-2';

    return `inline-flex shrink-0 select-none items-center gap-1.5 rounded-full border px-3 py-2 font-medium transition-colors ${selectedClasses} ${disabledClasses}`;
  }

  protected selectOption(option: SelectOption): void {
    if (this.isDisabled() || option.disabled) {
      return;
    }

    if (this.multiple()) {
      const currentValue = this.value();
      const selectedValues = Array.isArray(currentValue) ? currentValue : [];
      const nextValue = this.isSelected(option)
        ? selectedValues.filter((selectedValue) => !Object.is(selectedValue, option.value))
        : [...selectedValues, option.value];

      this.value.set(nextValue);
      this.onChangeFn(nextValue);
    } else {
      this.value.set(option.value);
      this.onChangeFn(option.value);
    }

    this.onTouchedFn();
  }

  protected onBlur(): void {
    this.onTouchedFn();
  }

  protected onActionClick(): void {
    this.actionClick.emit();
  }

  writeValue(value: ChoiceChipsValue | undefined): void {
    if (this.multiple()) {
      this.value.set(Array.isArray(value) ? value : value == null || value === '' ? [] : [value]);
      return;
    }

    this.value.set(Array.isArray(value) ? (value[0] ?? null) : (value ?? null));
  }

  registerOnChange(fn: (value: ChoiceChipsValue) => void): void {
    this.onChangeFn = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouchedFn = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.isDisabled.set(isDisabled);
  }
}
