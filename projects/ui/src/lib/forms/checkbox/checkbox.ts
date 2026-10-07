import {
  Component,
  computed,
  forwardRef,
  input,
  signal,
  ChangeDetectionStrategy,
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

@Component({
  selector: 'hui-checkbox',
  template: `
    <div [class]="containerClasses()">
      <input
        [id]="checkboxId()"
        type="checkbox"
        [checked]="value()"
        (change)="onChange($event)"
        (blur)="onTouched()"
        [disabled]="isDisabled()"
        [attr.aria-label]="ariaLabel()"
        [attr.aria-describedby]="ariaDescribedby()"
        [class]="checkboxClasses()"
      />
      @if (label()) {
        <label [for]="checkboxId()" [class]="labelClasses()">
          {{ label() }}
        </label>
      }
    </div>
  `,
  styles: `
    input[type='checkbox'] {
      appearance: none;
      -webkit-appearance: none;
      -moz-appearance: none;
      width: 1.35rem;
      height: 1.35rem;
      border: 2px solid rgba(99, 99, 99, 0.3);
      border-radius: 0.45rem;
      cursor: pointer;
      position: relative;
      transition: all 0.15s ease-in-out;
      flex-shrink: 0;
    }

    input[type='checkbox']:hover:not(:disabled) {
      box-shadow: 0 0 0 3px rgba(147, 51, 234, 0.1);
    }

    input[type='checkbox']:focus {
      outline: none;
      border-color: #9333ea;
    }

    input[type='checkbox']:checked {
      background-color: #9333ea;
      border-color: #9333ea;
    }

    input[type='checkbox']:checked::after {
      content: '';
      position: absolute;
      left: 0.35rem;
      top: 0.155rem;
      width: 0.375rem;
      height: 0.625rem;
      border: solid white;
      border-width: 0 2px 2px 0;
      transform: rotate(45deg);
    }

    input[type='checkbox']:indeterminate {
      background-color: #9333ea;
      border-color: #9333ea;
    }

    input[type='checkbox']:indeterminate::after {
      content: '';
      position: absolute;
      left: 50%;
      top: 50%;
      width: 0.5rem;
      height: 0.125rem;
      background-color: white;
      transform: translate(-50%, -50%);
    }

    input[type='checkbox']:disabled {
      opacity: 0.5;
      cursor: not-allowed;
      background-color: #f3f4f6;
    }

    input[type='checkbox']:disabled:checked {
      background-color: #d1d5db;
      border-color: #d1d5db;
    }
  `,
  host: {
    '[class]': '"block"',
  },
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => CheckboxComponent),
      multi: true,
    },
  ],
})
export class CheckboxComponent implements ControlValueAccessor {
  id = input<string>('');
  label = input<string>('');
  ariaLabel = input<string>('');
  ariaDescribedby = input<string>('');
  class = input<string>('');
  fullWidth = input<boolean>(false);

  protected readonly value = signal<boolean>(false);
  protected readonly isDisabled = signal<boolean>(false);

  // Generate unique ID if not provided
  protected readonly checkboxId = computed(() => {
    const providedId = this.id();
    return providedId || `checkbox-${Math.random().toString(36).substring(2, 11)}`;
  });

  protected readonly checkboxClasses = computed(() => {
    const customClasses = this.class();
    return customClasses || '';
  });

  protected readonly containerClasses = computed(() =>
    this.fullWidth() ? 'flex w-full items-center' : 'flex items-center',
  );

  protected readonly labelClasses = computed(() => {
    const baseClasses = `ml-2 block select-none text-text-primary ${this.fullWidth() ? 'flex-1' : ''}`;
    const cursorClass = this.isDisabled() ? 'cursor-not-allowed opacity-50' : 'cursor-pointer';
    return `${baseClasses} ${cursorClass}`;
  });

  private onChangeFn: (value: boolean) => void = () => {};
  protected onTouched: () => void = () => {};

  protected onChange(event: Event): void {
    const target = event.target as HTMLInputElement;
    const value = target.checked;
    this.value.set(value);
    this.onChangeFn(value);
  }

  writeValue(value: boolean): void {
    this.value.set(value ?? false);
  }

  registerOnChange(fn: (value: boolean) => void): void {
    this.onChangeFn = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.isDisabled.set(isDisabled);
  }
}
