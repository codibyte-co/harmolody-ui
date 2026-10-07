import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
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
import { debounceTime, distinctUntilChanged, Subject } from 'rxjs';

export interface AutocompleteOption {
  label: string;
  value: any;
  disabled?: boolean;
  [key: string]: any;
}

/**
 * Configuration for an action button alongside the autocomplete
 */
export interface AutocompleteActionButton {
  /** Icon name from the icon set */
  icon: string;
  /** Aria label for accessibility */
  ariaLabel: string;
  /** Tooltip text (optional) */
  tooltip?: string;
}

@Component({
  selector: 'hui-autocomplete',
  imports: [IconComponent],
  templateUrl: './autocomplete.html',
  styleUrls: ['./autocomplete.css'],
  host: {
    '[class]': '"block w-full relative"',
    '(document:click)': 'onDocumentClick($event)',
    '(window:resize)': 'onViewportChange()',
    '(window:scroll)': 'onViewportChange()',
  },
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => AutocompleteComponent),
      multi: true,
    },
  ],
})
export class AutocompleteComponent implements ControlValueAccessor {
  private readonly elementRef = inject(ElementRef);
  protected readonly localization = inject(LocalizationService);
  private searchSubject = new Subject<string>();
  private readonly scrollParents: HTMLElement[] = [];
  private readonly onScrollParentChange = () => this.onViewportChange();

  // Inputs
  id = input<string>('');
  placeholder = input<string>('Search...');
  mode = input<'local' | 'server'>('local');
  options = input<AutocompleteOption[]>([]);
  serverResults = input<AutocompleteOption[]>([]);
  loading = input<boolean>(false);
  minChars = input<number>(1);
  debounce = input<number>(300);
  displayFn = input<((option: any) => string) | undefined>(undefined);
  ariaLabel = input<string>('');
  ariaDescribedby = input<string>('');
  invalid = input<boolean>(false);
  /** Enable multiple selection with checkboxes */
  multiple = input<boolean>(false);
  /** Action button configuration */
  action = input<AutocompleteActionButton | undefined>(undefined);

  // Outputs
  search = output<string>();
  select = output<any>();
  /** Emits when the action button is clicked */
  actionClick = output<void>();

  // State
  protected readonly inputValue = signal<string>('');
  protected readonly isOpen = signal<boolean>(false);
  protected readonly selectedIndex = signal<number>(-1);
  protected readonly value = signal<any>(null);
  protected readonly selectedValues = signal<any[]>([]);
  protected readonly isDisabled = signal<boolean>(false);
  protected readonly dropdownPlacement = signal<'up' | 'down'>('down');
  protected readonly dropdownMaxHeight = signal<number>(240);
  protected readonly isInvalid = computed(() => this.invalid());
  protected readonly hasAction = computed(() => !!this.action());
  protected readonly isMultiple = computed(() => this.multiple());

  /** Display text for multi-select showing count of selected items */
  protected readonly displayText = computed(() => {
    if (!this.isMultiple()) return this.inputValue();
    const selected = this.selectedValues();
    if (selected.length === 0) return '';
    if (selected.length === 1) {
      const option = this.findOption(selected[0]);
      return option?.label || String(selected[0]);
    }
    return `${selected.length} items selected`;
  });

  // View children
  protected readonly inputElement = viewChild<ElementRef>('inputEl');
  protected readonly dropdownElement = viewChild<ElementRef>('dropdown');

  // Computed
  protected readonly filteredOptions = computed(() => {
    const query = this.inputValue();
    const modeValue = this.mode();

    if (modeValue === 'server') {
      return this.serverResults();
    }

    // Local filtering
    if (!query || query.length < this.minChars()) {
      return this.options();
    }

    const lowerQuery = query.toLowerCase();
    return this.options().filter((option) => option.label.toLowerCase().includes(lowerQuery));
  });

  protected readonly inputClasses = computed(() => {
    return buildFormControlClasses({
      invalid: this.isInvalid(),
      additionalClasses: 'pl-3 pr-3',
    });
  });

  protected readonly dropdownClasses = computed(() => {
    const baseClasses =
      'absolute z-50 w-full bg-surface border border-border rounded-xl shadow-xl overflow-auto p-2 gap-1 flex flex-col';
    const placementClasses =
      this.dropdownPlacement() === 'up' ? 'bottom-full mb-1' : 'top-full mt-1';

    return `${baseClasses} ${placementClasses}`;
  });

  private onChange: (value: any) => void = () => {};
  protected onTouched: () => void = () => {};

  constructor() {
    // Setup debounced search
    this.searchSubject
      .pipe(debounceTime(this.debounce()), distinctUntilChanged())
      .subscribe((query) => {
        if (this.mode() === 'server' && query.length >= this.minChars()) {
          this.search.emit(query);
        }
      });

    // Watch for serverResults changes to update display value when options are loaded
    effect(() => {
      const results = this.serverResults();
      const currentValue = this.value();

      // If we have a value but the display is showing the raw ID (not a label),
      // try to find the matching option and update the display
      if (currentValue && results.length > 0) {
        const option = results.find((opt) => opt.value === currentValue);
        if (option && this.inputValue() !== option.label) {
          // Only update if the current input value looks like an ID (not a label)
          const currentInput = this.inputValue();
          const isShowingId = currentInput === String(currentValue) || currentInput === '';
          if (isShowingId) {
            this.inputValue.set(option.label);
          }
        }
      }
    });

    effect(() => {
      if (this.isOpen()) {
        this.registerScrollParents();
        setTimeout(() => this.updateDropdownPlacement());
        return;
      }

      this.unregisterScrollParents();
    });
  }

  ngOnDestroy(): void {
    this.unregisterScrollParents();
    this.searchSubject.complete();
  }

  protected onInput(event: Event): void {
    const target = event.target as HTMLInputElement;
    const query = target.value;
    this.inputValue.set(query);
    this.isOpen.set(true);
    this.updateDropdownPlacement();
    this.selectedIndex.set(-1);

    if (!this.isMultiple()) {
      // Clear the value when user types to ensure form stays in sync
      // Only emit null if there was a previous value
      if (this.value() !== null) {
        this.value.set(null);
        this.onChange(null);
      }
    }

    // Emit search for server mode
    if (this.mode() === 'server') {
      this.searchSubject.next(query);
    }
  }

  protected onKeyDown(event: KeyboardEvent): void {
    const options = this.filteredOptions();

    if (this.isOpen()) {
      this.updateDropdownPlacement();
    }

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        this.selectedIndex.update((i) => Math.min(i + 1, options.length - 1));
        this.scrollToSelected();
        break;

      case 'ArrowUp':
        event.preventDefault();
        this.selectedIndex.update((i) => Math.max(i - 1, -1));
        this.scrollToSelected();
        break;

      case 'Enter':
        event.preventDefault();
        const index = this.selectedIndex();
        if (index >= 0 && options[index]) {
          this.selectOption(options[index]);
        }
        break;

      case 'Escape':
        event.preventDefault();
        this.isOpen.set(false);
        this.selectedIndex.set(-1);
        break;

      case 'Tab':
        this.isOpen.set(false);
        break;
    }
  }

  protected onFocus(): void {
    // Always open dropdown on focus if there are options or we're in server mode
    const hasOptions = this.mode() === 'server' || this.options().length > 0;
    if (hasOptions) {
      this.isOpen.set(true);
      this.updateDropdownPlacement();

      // If in server mode and (input is empty OR multi-select mode), trigger initial search
      if (this.mode() === 'server' && (this.inputValue().length === 0 || this.isMultiple())) {
        this.search.emit('');
      }
    }
  }

  protected onBlur(): void {
    this.onTouched();
    // Delay to allow click on option
    setTimeout(() => {
      this.isOpen.set(false);
    }, 200);
  }

  protected selectOption(option: AutocompleteOption): void {
    if (option.disabled) return;

    if (this.isMultiple()) {
      // Toggle selection for multi-select
      const currentValues = this.selectedValues();
      const index = currentValues.indexOf(option.value);

      if (index >= 0) {
        // Deselect
        const newValues = currentValues.filter((v) => v !== option.value);
        this.selectedValues.set(newValues);
        this.onChange(newValues);
      } else {
        // Select
        const newValues = [...currentValues, option.value];
        this.selectedValues.set(newValues);
        this.onChange(newValues);
      }
      this.select.emit(this.selectedValues());
      this.inputValue.set('');
      if (this.mode() === 'server') {
        this.search.emit('');
      }
      // Keep dropdown open for multi-select
    } else {
      // Single select
      this.value.set(option.value);
      this.inputValue.set(option.label);
      this.onChange(option.value);
      this.select.emit(option.value);
      this.isOpen.set(false);
      this.selectedIndex.set(-1);
    }
  }

  protected clearSelection(): void {
    if (this.isMultiple()) {
      this.selectedValues.set([]);
      this.onChange([]);
    } else {
      this.value.set(null);
      this.onChange(null);
    }
    this.inputValue.set('');
    this.isOpen.set(false);
    this.inputElement()?.nativeElement.focus();
  }

  protected onActionClick(): void {
    this.actionClick.emit();
  }

  protected onDocumentClick(event: MouseEvent): void {
    if (!this.elementRef.nativeElement.contains(event.target)) {
      this.isOpen.set(false);
    }
  }

  protected onViewportChange(): void {
    if (!this.isOpen()) {
      return;
    }

    this.updateDropdownPlacement();
  }

  private updateDropdownPlacement(): void {
    const inputElement = this.inputElement()?.nativeElement as HTMLElement | undefined;
    if (!inputElement) {
      return;
    }

    const viewportPadding = 12;
    const preferredHeight = 240;
    const minimumHeight = 120;
    const rect = inputElement.getBoundingClientRect();
    const clippingParent = this.findClippingParent(inputElement);
    const clippingRect = clippingParent?.getBoundingClientRect();
    const boundaryTop = Math.max(viewportPadding, clippingRect?.top ?? viewportPadding);
    const boundaryBottom = Math.min(
      window.innerHeight - viewportPadding,
      clippingRect?.bottom ?? window.innerHeight - viewportPadding,
    );

    const spaceBelow = boundaryBottom - rect.bottom;
    const spaceAbove = rect.top - boundaryTop;
    const shouldOpenUp = spaceBelow < minimumHeight && spaceAbove > spaceBelow;
    const availableSpace = shouldOpenUp ? spaceAbove : spaceBelow;

    this.dropdownPlacement.set(shouldOpenUp ? 'up' : 'down');
    this.dropdownMaxHeight.set(Math.max(minimumHeight, Math.min(preferredHeight, availableSpace)));
  }

  private findClippingParent(element: HTMLElement): HTMLElement | null {
    let parent = element.parentElement;

    while (parent) {
      const styles = window.getComputedStyle(parent);
      const overflowY = styles.overflowY;
      const overflowX = styles.overflowX;
      const isClippingY = overflowY === 'auto' || overflowY === 'scroll' || overflowY === 'hidden';
      const isClippingX = overflowX === 'auto' || overflowX === 'scroll' || overflowX === 'hidden';

      if (isClippingY || isClippingX) {
        return parent;
      }

      parent = parent.parentElement;
    }

    return null;
  }

  private registerScrollParents(): void {
    this.unregisterScrollParents();

    const inputElement = this.inputElement()?.nativeElement as HTMLElement | undefined;
    if (!inputElement) {
      return;
    }

    let parent = inputElement.parentElement;
    while (parent) {
      const styles = window.getComputedStyle(parent);
      const overflowY = styles.overflowY;
      const overflowX = styles.overflowX;
      const isScrollableY = overflowY === 'auto' || overflowY === 'scroll';
      const isScrollableX = overflowX === 'auto' || overflowX === 'scroll';

      if (isScrollableY || isScrollableX) {
        parent.addEventListener('scroll', this.onScrollParentChange, { passive: true });
        this.scrollParents.push(parent);
      }

      parent = parent.parentElement;
    }
  }

  private unregisterScrollParents(): void {
    for (const parent of this.scrollParents) {
      parent.removeEventListener('scroll', this.onScrollParentChange);
    }

    this.scrollParents.length = 0;
  }

  private scrollToSelected(): void {
    setTimeout(() => {
      this.updateDropdownPlacement();
      const dropdown = this.dropdownElement()?.nativeElement;
      const selectedElement = dropdown?.querySelector('.selected');
      selectedElement?.scrollIntoView({ block: 'nearest' });
    });
  }

  private getDisplayValue(value: any): string {
    const displayFunc = this.displayFn();
    if (displayFunc) {
      return displayFunc(value);
    }

    // Find option by value
    const allOptions = this.mode() === 'server' ? this.serverResults() : this.options();
    const option = allOptions.find((opt) => opt.value === value);
    return option?.label || String(value);
  }

  // ControlValueAccessor implementation
  writeValue(value: any): void {
    if (this.isMultiple()) {
      const values = Array.isArray(value) ? value : value ? [value] : [];
      this.selectedValues.set(values);
      this.inputValue.set('');
    } else {
      this.value.set(value);
      if (value) {
        const displayValue = this.getDisplayValue(value);
        this.inputValue.set(displayValue);
      } else {
        this.inputValue.set('');
      }
    }
  }

  registerOnChange(fn: (value: any) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.isDisabled.set(isDisabled);
  }

  /** Check if an option is selected (for multi-select) */
  protected isOptionSelected(option: AutocompleteOption): boolean {
    if (!this.isMultiple()) return false;
    return this.selectedValues().includes(option.value);
  }

  /** Find option by value in all available options */
  private findOption(value: any): AutocompleteOption | undefined {
    const allOptions = this.mode() === 'server' ? this.serverResults() : this.options();
    return allOptions.find((opt) => opt.value === value);
  }

  /** Get all selected option objects (for multi-select) */
  public getSelectedOptions(): AutocompleteOption[] {
    if (!this.isMultiple()) {
      const val = this.value();
      const option = val ? this.findOption(val) : undefined;
      return option ? [option] : [];
    }
    return this.selectedValues()
      .map((v) => this.findOption(v))
      .filter((opt): opt is AutocompleteOption => !!opt);
  }
}
