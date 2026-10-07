import {
  Component,
  computed,
  forwardRef,
  inject,
  input,
  signal,
  ChangeDetectionStrategy,
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { HARMOLODY_MEDIA_SELECTOR } from '../../config/ui-config';
import { buildFormControlClasses } from '../utils/form-control-classes';
import { IconComponent } from '../../icon';

@Component({
  selector: 'hui-image-selector-input',
  template: `
    <div class="space-y-2">
      <!-- Image Preview (Optional) -->
      @if (showPreview() && value()) {
        <div class="relative group">
          <div
            class="relative w-full h-48 bg-surface rounded-lg overflow-hidden border-2 border-border"
          >
            <img
              [src]="value()!"
              [alt]="altText() || 'Selected image'"
              class="w-full h-full object-cover"
              (error)="onImageError()"
            />
            <!-- Hover Overlay -->
            <div
              class="absolute inset-0 bg-black/50 bg-opacity-0 group-hover:bg-opacity-40 transition-all duration-200 flex items-center justify-center"
            >
              <button
                type="button"
                (click)="clearSelection()"
                [disabled]="isDisabled()"
                class="opacity-0 group-hover:opacity-100 transition-opacity bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span class="flex items-center gap-2">
                  <hui-icon name="trash" class="w-4 h-4" />
                  Remove
                </span>
              </button>
            </div>
          </div>
        </div>
      }

      <!-- Input Field + Browse Button -->
      <div class="flex gap-2">
        <div class="flex-1 relative">
          <input
            [id]="id()"
            type="text"
            [value]="value() || ''"
            [placeholder]="placeholder() || 'Select or enter image URL'"
            [readonly]="!editableInput()"
            [disabled]="isDisabled()"
            (input)="onInputChange($event)"
            (blur)="onTouched()"
            [attr.aria-label]="ariaLabel()"
            [attr.aria-describedby]="ariaDescribedby()"
            [attr.aria-invalid]="isInvalid() || null"
            [class]="inputClasses()"
          />
        </div>

        <button
          type="button"
          (click)="openMediaSelector()"
          [disabled]="isDisabled() || !mediaSelector"
          [class]="browseButtonClasses()"
          [attr.title]="'Browse images'"
        >
          <hui-icon name="library-photo" [size]="20" />
        </button>

        @if (value() && !isDisabled()) {
          <button
            type="button"
            (click)="clearSelection()"
            [class]="clearButtonClasses()"
            [attr.title]="'Clear selection'"
          >
            <hui-icon name="trash" [size]="20" />
          </button>
        }
      </div>

      <!-- Error State Message -->
      @if (imageError()) {
        <div class=" text-red-600 flex items-center gap-1">
          <hui-icon name="exclamation-circle" class="w-4 h-4" />
          Failed to load image
        </div>
      }
    </div>
  `,
  host: {
    '[class]': '"block w-full"',
  },
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => ImageSelectorInputComponent),
      multi: true,
    },
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [IconComponent],
})
export class ImageSelectorInputComponent implements ControlValueAccessor {
  protected readonly mediaSelector = inject(HARMOLODY_MEDIA_SELECTOR);

  id = input<string>('');
  placeholder = input<string>('');
  ariaLabel = input<string>('');
  ariaDescribedby = input<string>('');
  invalid = input<boolean>(false);
  altText = input<string>('');

  // Configuration inputs for media selector
  mediaType = input<string>('Cover');
  allowUpload = input<boolean>(true);
  selectionMode = input<'single' | 'multiple'>('single');

  // Display options
  showPreview = input<boolean>(true);
  editableInput = input<boolean>(false);

  protected readonly value = signal<string | null>(null);
  protected readonly isDisabled = signal<boolean>(false);
  protected readonly imageError = signal<boolean>(false);
  protected readonly isInvalid = computed(() => this.invalid());

  protected readonly inputClasses = computed(() => {
    const readonlyClasses = this.editableInput() ? '' : 'bg-muted cursor-pointer';
    return buildFormControlClasses({
      invalid: this.isInvalid(),
      additionalClasses: readonlyClasses,
    });
  });

  protected readonly browseButtonClasses = computed(() => {
    const baseClasses =
      'w-10 h-10 border rounded-lg shadow-sm focus:outline-none focus:ring-1 transition-colors flex items-center justify-center bg-surface';
    const disabledClasses = 'disabled:opacity-50 disabled:cursor-not-allowed';
    const errorClasses =
      'border-red-300 focus:ring-red-500 focus:border-red-500 text-red-700 hover:bg-red-50';
    const normalClasses =
      'border-border focus:ring-purple-500 focus:border-purple-500 hover:bg-surface-hover text-text-secondary';

    return `${baseClasses} ${disabledClasses} ${this.isInvalid() ? errorClasses : normalClasses}`;
  });

  protected readonly clearButtonClasses = computed(() => {
    return 'px-3 py-2 border border-border rounded-lg shadow-sm hover:bg-surface-hover text-text-secondary transition-colors flex items-center justify-center focus:outline-none focus:ring-1 focus:ring-purple-500';
  });

  private onChange: (value: string | null) => void = () => {};
  protected onTouched: () => void = () => {};

  protected async openMediaSelector(): Promise<void> {
    if (this.isDisabled()) return;

    const select = this.mediaSelector;
    if (!select) return;
    const url = await select({
      mediaType: this.mediaType(),
      allowUpload: this.allowUpload(),
      selectionMode: this.selectionMode(),
    });
    if (url !== undefined) this.setImage(url);
    this.onTouched();
  }

  protected clearSelection(): void {
    this.setImage(null);
    this.imageError.set(false);
  }

  protected onImageError(): void {
    this.imageError.set(true);
  }

  protected onInputChange(event: Event): void {
    if (!this.editableInput()) return;

    const target = event.target as HTMLInputElement;
    const url = target.value.trim() || null;
    this.setImage(url);
  }

  private setImage(url: string | null): void {
    this.value.set(url);
    this.onChange(url);
    this.imageError.set(false);
  }

  writeValue(value: string | null): void {
    this.value.set(value ?? null);
    this.imageError.set(false);
  }

  registerOnChange(fn: (value: string | null) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.isDisabled.set(isDisabled);
  }
}
