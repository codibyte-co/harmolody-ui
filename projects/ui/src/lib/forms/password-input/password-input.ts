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
  selector: 'hui-password-input',
  template: `
    <div class="relative">
      <input
        [id]="id()"
        [type]="showPassword() ? 'text' : 'password'"
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
      <button
        type="button"
        (click)="togglePasswordVisibility()"
        class="absolute inset-y-0 right-0 pr-3 flex items-center"
        [attr.aria-label]="showPassword() ? 'Hide password' : 'Show password'"
      >
        @if (showPassword()) {
          <svg
            class="h-5 w-5 text-muted-foreground"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
            />
          </svg>
        } @else {
          <svg
            class="h-5 w-5 text-muted-foreground"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
            />
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
            />
          </svg>
        }
      </button>
    </div>
  `,
  host: {
    '[class]': '"block w-full"',
  },
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => PasswordInputComponent),
      multi: true,
    },
  ],
})
export class PasswordInputComponent implements ControlValueAccessor {
  id = input<string>('');
  placeholder = input<string>('');
  ariaLabel = input<string>('');
  ariaDescribedby = input<string>('');
  displayInvalid = input<boolean>(false);

  protected readonly value = signal<string>('');
  protected readonly isDisabled = signal<boolean>(false);
  protected readonly showPassword = signal<boolean>(false);
  protected readonly isInvalid = computed(() => this.displayInvalid());

  protected readonly inputClasses = computed(() => {
    return buildFormControlClasses({
      invalid: this.isInvalid(),
      additionalClasses: 'pr-3',
    });
  });

  private onChange: (value: string) => void = () => {};
  protected onTouched: () => void = () => {};

  protected togglePasswordVisibility(): void {
    this.showPassword.update((show) => !show);
  }

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
