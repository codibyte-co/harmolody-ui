import {
  Component,
  computed,
  forwardRef,
  input,
  signal,
  ChangeDetectionStrategy,
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { buildFormControlClasses } from '../utils/form-control-classes';

export type DateInputMode = 'date' | 'datetime-local' | 'month' | 'year';

@Component({
  selector: 'hui-date-input',
  template: `
    <input
      [id]="id()"
      [type]="inputType()"
      [placeholder]="placeholder()"
      [value]="value()"
      (input)="onInput($event)"
      (blur)="onTouched()"
      [disabled]="isDisabled()"
      [min]="min()"
      [max]="max()"
      [attr.aria-label]="ariaLabel()"
      [attr.aria-describedby]="ariaDescribedby()"
      [attr.aria-invalid]="isInvalid()"
      [class]="inputClasses()"
    />
  `,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => DateInputComponent),
      multi: true,
    },
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class]': '"block w-full"',
  },
})
export class DateInputComponent implements ControlValueAccessor {
  id = input<string>('');
  mode = input<DateInputMode>('date');
  placeholder = input<string>('');
  ariaLabel = input<string>('');
  ariaDescribedby = input<string>('');
  invalid = input<boolean>(false);
  class = input<string>('');
  min = input<string>('');
  max = input<string>('');

  protected readonly value = signal<string>('');
  protected readonly isDisabled = signal<boolean>(false);
  protected readonly isInvalid = computed(() => this.invalid());

  protected readonly inputType = computed(() => {
    const mode = this.mode();
    // For year mode, we use number input with custom handling
    if (mode === 'year') {
      return 'number';
    }
    return mode;
  });

  protected readonly inputClasses = computed(() => {
    return buildFormControlClasses({
      invalid: this.isInvalid(),
      customClasses: this.class(),
    });
  });

  private onChange: (value: string) => void = () => {};
  protected onTouched: () => void = () => {};

  protected onInput(event: Event): void {
    const target = event.target as HTMLInputElement;
    let value = target.value;

    // Handle year mode specially
    if (this.mode() === 'year' && value) {
      // Ensure year is 4 digits
      const year = parseInt(value, 10);
      if (year >= 1000 && year <= 9999) {
        value = year.toString();
      }
    }

    this.value.set(value);
    this.onChange(value);
  }

  // ControlValueAccessor implementation
  writeValue(value: string): void {
    this.value.set(value ?? '');
  }

  registerOnChange(fn: (value: string) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.isDisabled.set(isDisabled);
  }
}
