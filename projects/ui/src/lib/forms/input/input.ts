import {
  ChangeDetectionStrategy,
  Component,
  computed,
  forwardRef,
  input,
  signal,
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { buildFormControlClasses } from '../utils/form-control-classes';

@Component({
  selector: 'hui-input',
  template: `
    <input
      [id]="id()"
      [type]="type()"
      [placeholder]="placeholder()"
      [value]="value()"
      (input)="onInput($event)"
      (blur)="onTouched()"
      [disabled]="isDisabled()"
      [attr.aria-label]="ariaLabel()"
      [attr.aria-describedby]="ariaDescribedby()"
      [attr.aria-invalid]="isInvalid()"
      [class]="inputClasses()"
    />
  `,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => InputComponent),
      multi: true,
    },
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class]': '"block w-full"',
  },
})
export class InputComponent implements ControlValueAccessor {
  id = input<string>('');
  type = input<string>('text');
  placeholder = input<string>('');
  ariaLabel = input<string>('');
  ariaDescribedby = input<string>('');
  invalid = input<boolean>(false);
  class = input<string>('');

  protected readonly value = signal<string>('');
  protected readonly isDisabled = signal<boolean>(false);
  protected readonly isInvalid = computed(() => this.invalid());

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
    const value = target.value;
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
