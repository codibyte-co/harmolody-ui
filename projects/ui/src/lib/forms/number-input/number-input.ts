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

@Component({
  selector: 'hui-number-input',
  template: `
    <input
      [id]="id()"
      type="number"
      [placeholder]="placeholder()"
      [value]="value()"
      (input)="onInput($event)"
      (blur)="onTouched()"
      [disabled]="isDisabled()"
      [min]="min()"
      [max]="max()"
      [step]="step()"
      [attr.aria-label]="ariaLabel()"
      [attr.aria-describedby]="ariaDescribedby()"
      [attr.aria-invalid]="isInvalid() || null"
      [class]="inputClasses()"
    />
  `,
  host: {
    '[class]': '"block w-full"',
  },
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => NumberInputComponent),
      multi: true,
    },
  ],
})
export class NumberInputComponent implements ControlValueAccessor {
  id = input<string>('');
  placeholder = input<string>('');
  min = input<number | undefined>(undefined);
  max = input<number | undefined>(undefined);
  step = input<number>(1);
  ariaLabel = input<string>('');
  ariaDescribedby = input<string>('');
  invalid = input<boolean>(false);

  protected readonly value = signal<number | null>(null);
  protected readonly isDisabled = signal<boolean>(false);
  protected readonly isInvalid = computed(() => this.invalid());

  protected readonly inputClasses = computed(() => {
    return buildFormControlClasses({ invalid: this.isInvalid() });
  });

  private onChange: (value: number | null) => void = () => {};
  protected onTouched: () => void = () => {};

  protected onInput(event: Event): void {
    const target = event.target as HTMLInputElement;
    const value = target.value === '' ? null : parseFloat(target.value);
    this.value.set(value);
    this.onChange(value);
  }

  writeValue(value: number | null): void {
    this.value.set(value);
  }

  registerOnChange(fn: (value: number | null) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.isDisabled.set(isDisabled);
  }
}
