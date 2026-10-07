import { ChangeDetectionStrategy, Component, forwardRef, input, signal } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

@Component({
  selector: 'hui-switch',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'inline-flex',
  },
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => SwitchComponent),
      multi: true,
    },
  ],
  template: `
    <button
      [id]="id()"
      type="button"
      role="switch"
      [attr.aria-checked]="checked()"
      [attr.aria-label]="ariaLabel()"
      [attr.aria-describedby]="ariaDescribedby() || null"
      [disabled]="disabled()"
      (click)="toggle()"
      (blur)="onTouched()"
      class="relative inline-flex h-6 w-11 shrink-0 items-center rounded-full border border-transparent p-0.5 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
      [class.bg-primary]="checked()"
      [class.bg-border]="!checked()"
    >
      <span
        aria-hidden="true"
        class="pointer-events-none block size-5 rounded-full bg-surface shadow-sm transition-transform"
        [class.translate-x-5]="checked()"
        [class.translate-x-0]="!checked()"
      ></span>
    </button>
  `,
})
export class SwitchComponent implements ControlValueAccessor {
  id = input<string>('');
  ariaLabel = input<string>('');
  ariaDescribedby = input<string>('');

  protected readonly checked = signal(false);
  protected readonly disabled = signal(false);
  private onChange: (value: boolean) => void = () => undefined;
  protected onTouched: () => void = () => undefined;

  protected toggle(): void {
    if (this.disabled()) return;
    this.checked.update((value) => !value);
    this.onChange(this.checked());
  }

  writeValue(value: boolean): void {
    this.checked.set(Boolean(value));
  }

  registerOnChange(fn: (value: boolean) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(disabled: boolean): void {
    this.disabled.set(disabled);
  }
}
