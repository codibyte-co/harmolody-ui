import {
  Component,
  computed,
  forwardRef,
  input,
  signal,
  ChangeDetectionStrategy,
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { twMerge } from 'tailwind-merge';

export interface RadioOption {
  label: string;
  value: string | number;
  disabled?: boolean;
}

@Component({
  selector: 'hui-radio-group',
  template: `
    <div [attr.role]="'radiogroup'" [attr.aria-label]="ariaLabel()">
      @for (option of options(); track option.value) {
        <div class="flex items-center" [class]="inline() ? 'inline-flex mr-4' : 'mb-2'">
          <input
            [id]="id() + '-' + option.value"
            type="radio"
            [name]="name()"
            [value]="option.value"
            [checked]="value() === option.value"
            (change)="onChange(option.value)"
            (blur)="onTouched()"
            [disabled]="isDisabled() || option.disabled"
            [class]="radioClasses()"
          />
          <label
            [for]="id() + '-' + option.value"
            class="ml-2 block  text-text-primary"
            [class.text-muted-foreground]="option.disabled"
          >
            {{ option.label }}
          </label>
        </div>
      }
    </div>
  `,
  host: {
    '[class]': '"block"',
  },
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => RadioGroupComponent),
      multi: true,
    },
  ],
})
export class RadioGroupComponent implements ControlValueAccessor {
  id = input<string>('');
  name = input<string>('');
  options = input<RadioOption[]>([]);
  inline = input<boolean>(false);
  ariaLabel = input<string>('');
  class = input<string>('');

  protected readonly value = signal<string | number | null>(null);
  protected readonly isDisabled = signal<boolean>(false);

  protected readonly radioClasses = computed(() => {
    const baseClasses = 'h-4 w-4 text-blue-600 border-border';
    const customClasses = this.class();
    return twMerge(baseClasses, customClasses);
  });

  private onChangeFn: (value: string | number | null) => void = () => {};
  protected onTouched: () => void = () => {};

  protected onChange(value: string | number): void {
    this.value.set(value);
    this.onChangeFn(value);
  }

  writeValue(value: string | number | null): void {
    this.value.set(value);
  }

  registerOnChange(fn: (value: string | number | null) => void): void {
    this.onChangeFn = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.isDisabled.set(isDisabled);
  }
}
