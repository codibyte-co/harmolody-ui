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
  selector: 'hui-email-input',
  template: `
    <input
      [id]="id()"
      type="email"
      [placeholder]="placeholder()"
      [value]="value()"
      (input)="onInput($event)"
      (blur)="onTouched()"
      [disabled]="isDisabled()"
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
      useExisting: forwardRef(() => EmailInputComponent),
      multi: true,
    },
  ],
})
export class EmailInputComponent implements ControlValueAccessor {
  id = input<string>('');
  placeholder = input<string>('you@example.com');
  ariaLabel = input<string>('');
  ariaDescribedby = input<string>('');
  displayInvalid = input<boolean>(false);

  protected readonly value = signal<string>('');
  protected readonly isDisabled = signal<boolean>(false);
  protected readonly isInvalid = computed(() => this.displayInvalid());

  protected readonly inputClasses = computed(() => {
    return buildFormControlClasses({ invalid: this.isInvalid() });
  });

  private onChange: (value: string) => void = () => {};
  protected onTouched: () => void = () => {};

  protected onInput(event: Event): void {
    const target = event.target as HTMLInputElement;
    const value = target.value;
    this.value.set(value);
    this.onChange(value);
  }

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
