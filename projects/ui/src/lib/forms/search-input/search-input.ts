import {
  ChangeDetectionStrategy,
  Component,
  computed,
  ElementRef,
  forwardRef,
  inject,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { LocalizationService } from '../../config/ui-localization';
import { buildFormControlClasses } from '../utils/form-control-classes';
import { IconComponent } from '../../icon';

@Component({
  selector: 'hui-search-input',
  imports: [IconComponent],
  templateUrl: './search-input.html',
  styleUrl: './search-input.css',
  host: {
    class: 'block w-full',
  },
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => SearchInputComponent),
      multi: true,
    },
  ],
})
export class SearchInputComponent implements ControlValueAccessor {
  protected readonly localization = inject(LocalizationService);

  readonly id = input<string>('');
  readonly placeholder = input<string>('Search...');
  readonly showClear = input<boolean>(true);
  readonly clearLabel = input<string>('Clear search');
  readonly ariaLabel = input<string>('');
  readonly ariaDescribedby = input<string>('');
  readonly invalid = input<boolean>(false);
  readonly class = input<string>('');

  /** Emitted when Enter is pressed and after the clear action. */
  readonly search = output<string>();
  /** Emitted only when the clear action is used. */
  readonly cleared = output<void>();

  protected readonly inputElement = viewChild<ElementRef<HTMLInputElement>>('searchInput');
  protected readonly value = signal('');
  protected readonly isDisabled = signal(false);
  protected readonly hasValue = computed(() => this.value().length > 0);
  protected readonly accessibleLabel = computed(() =>
    this.localization.translate(this.ariaLabel() || this.placeholder()),
  );
  protected readonly inputClasses = computed(() =>
    buildFormControlClasses({
      invalid: this.invalid(),
      additionalClasses: 'border-border bg-surface pl-10 pr-3 shadow-none',
      customClasses: this.class(),
    }),
  );

  private onChangeFn: (value: string) => void = () => {};
  private onTouchedFn: () => void = () => {};

  protected onInput(event: Event): void {
    const nextValue = (event.target as HTMLInputElement).value;
    this.value.set(nextValue);
    this.onChangeFn(nextValue);
  }

  protected submitSearch(): void {
    this.search.emit(this.value());
  }

  protected clear(): void {
    if (this.isDisabled()) {
      return;
    }

    this.value.set('');
    this.onChangeFn('');
    this.onTouchedFn();
    this.cleared.emit();
    this.search.emit('');
    this.inputElement()?.nativeElement.focus();
  }

  protected markTouched(): void {
    this.onTouchedFn();
  }

  writeValue(value: string | null | undefined): void {
    this.value.set(value ?? '');
  }

  registerOnChange(fn: (value: string) => void): void {
    this.onChangeFn = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouchedFn = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.isDisabled.set(isDisabled);
  }
}
