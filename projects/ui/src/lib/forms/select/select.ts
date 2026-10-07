import {
  ChangeDetectionStrategy,
  Component,
  computed,
  ElementRef,
  forwardRef,
  inject,
  input,
  OnDestroy,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { LocalizationService } from '../../config/ui-localization';
import { buildFormControlClasses } from '../utils/form-control-classes';
import { IconComponent } from '../../icon';

export type SelectValue = string | number;
export type SelectControlValue = SelectValue | SelectValue[] | null;
export type SelectDropdownAlign = 'left' | 'right';
export type SelectDropdownPlacement = 'top' | 'bottom';
export type SelectDropdownWidth = 'trigger' | 'content';

export interface SelectOption {
  label: string;
  value: SelectValue;
  disabled?: boolean;
}

/** Configuration for an action button alongside the select. */
export interface SelectActionButton {
  /** Icon name from the icon set. */
  icon: string;
  /** Aria label for accessibility. */
  ariaLabel: string;
  /** Tooltip text. */
  tooltip?: string;
}

let nextSelectId = 0;

@Component({
  selector: 'hui-select',
  imports: [IconComponent],
  templateUrl: './select.html',
  styleUrl: './select.css',
  host: {
    class: 'block',
  },
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => SelectComponent),
      multi: true,
    },
  ],
})
export class SelectComponent implements ControlValueAccessor, OnDestroy {
  protected readonly localization = inject(LocalizationService);

  readonly id = input<string>('');
  readonly placeholder = input<string>('');
  readonly options = input<SelectOption[]>([]);
  readonly ariaLabel = input<string>('');
  readonly ariaDescribedby = input<string>('');
  readonly invalid = input<boolean>(false);
  readonly class = input<string>('');
  /** Allows the control to emit an array and keep the dropdown open while selecting. */
  readonly multiple = input<boolean>(false);
  /** Horizontal edge used to anchor the dropdown panel. */
  readonly dropdownAlign = input<SelectDropdownAlign>('left');
  /** Matches the trigger width by default, or expands to fit option content. */
  readonly dropdownWidth = input<SelectDropdownWidth>('trigger');
  /** Maximum height for the scrollable options area before viewport constraints are applied. */
  readonly maxDropdownHeight = input<number>(256);
  /** Space retained between the dropdown and the viewport edge. */
  readonly viewportPadding = input<number>(12);
  /** Prevents compact layouts and short values from collapsing the control. */
  readonly minWidth = input<string>('12rem');
  /** Action button configuration. */
  readonly action = input<SelectActionButton | undefined>(undefined);

  /** Emits when the action button is clicked. */
  readonly actionClick = output<void>();

  private readonly generatedId = `hui-select-${nextSelectId++}`;
  private typeaheadQuery = '';
  private typeaheadTimer: ReturnType<typeof setTimeout> | undefined;
  private placementTimer: ReturnType<typeof setTimeout> | undefined;
  private viewportListenersRegistered = false;
  private dropdownResizeObserver: ResizeObserver | undefined;
  private readonly onViewportChange = () => this.scheduleDropdownPlacementUpdate();

  protected readonly triggerElement = viewChild<ElementRef<HTMLButtonElement>>('trigger');
  protected readonly dropdownElement = viewChild<ElementRef<HTMLElement>>('dropdown');
  protected readonly dropdownHeaderElement = viewChild<ElementRef<HTMLElement>>('dropdownHeader');
  protected readonly optionsViewportElement = viewChild<ElementRef<HTMLElement>>('optionsViewport');
  protected readonly value = signal<SelectControlValue>(null);
  protected readonly isOpen = signal(false);
  protected readonly activeIndex = signal(-1);
  protected readonly isDisabled = signal(false);
  protected readonly dropdownPlacement = signal<SelectDropdownPlacement>('bottom');
  protected readonly availableOptionsHeight = signal(256);
  protected readonly isInvalid = computed(() => this.invalid());
  protected readonly hasAction = computed(() => !!this.action());
  protected readonly controlId = computed(() => this.id() || this.generatedId);
  protected readonly listboxId = computed(() => `${this.controlId()}-listbox`);

  protected readonly selectedValues = computed<SelectValue[]>(() => {
    const currentValue = this.value();
    const values = Array.isArray(currentValue)
      ? currentValue
      : currentValue === null
        ? []
        : [currentValue];

    // An empty string is the conventional unselected form value unless an option owns it.
    return values.filter((selectedValue) => selectedValue !== '' || !!this.findOption(''));
  });

  protected readonly selectedCount = computed(() => this.selectedValues().length);
  protected readonly hasSelection = computed(() => this.selectedCount() > 0);
  protected readonly displayLabel = computed(() => {
    const selected = this.selectedValues();
    if (selected.length === 0) {
      return this.localization.translate(
        this.placeholder() || (this.multiple() ? 'Select options' : 'Select an option'),
      );
    }

    if (this.multiple() && selected.length > 1) {
      return this.localization.translate('{count} items selected', { count: selected.length });
    }

    const option = this.findOption(selected[0]);
    return this.localization.translate(option?.label ?? String(selected[0]));
  });

  protected readonly panelLabel = computed(() =>
    this.localization.translate(
      this.placeholder() || (this.multiple() ? 'Select options' : 'Select an option'),
    ),
  );

  protected readonly triggerClasses = computed(() =>
    buildFormControlClasses({
      invalid: this.isInvalid(),
      additionalClasses:
        'flex min-h-10 items-center justify-between gap-3 bg-surface pr-3 text-left shadow-none',
      customClasses: this.class(),
    }),
  );

  protected readonly dropdownClasses = computed(() => {
    const alignmentClass = this.dropdownAlign() === 'right' ? 'right-0' : 'left-0';
    const placementClass =
      this.dropdownPlacement() === 'top' ? 'bottom-full mb-1' : 'top-full mt-1';
    const widthClass =
      this.dropdownWidth() === 'content' ? 'w-max min-w-full max-w-[calc(100vw-1.5rem)]' : 'w-full';

    return `absolute z-30 overflow-hidden rounded-xl border border-border bg-surface shadow-xl ${alignmentClass} ${placementClass} ${widthClass}`;
  });

  private onChangeFn: (value: SelectControlValue) => void = () => {};
  private onTouchedFn: () => void = () => {};

  protected toggleDropdown(): void {
    if (this.isDisabled()) {
      return;
    }

    if (this.isOpen()) {
      this.closeDropdown();
      return;
    }

    this.openDropdown();
  }

  protected closeDropdown(markTouched = true): void {
    if (!this.isOpen()) {
      return;
    }

    this.isOpen.set(false);
    this.activeIndex.set(-1);
    this.resetTypeahead();
    this.stopDropdownPositionTracking();
    if (markTouched) {
      this.onTouchedFn();
    }
  }

  protected selectOption(option: SelectOption): void {
    if (option.disabled || this.isDisabled()) {
      return;
    }

    if (this.multiple()) {
      const selected = this.selectedValues();
      const nextValue = this.includesValue(selected, option.value)
        ? selected.filter((value) => !Object.is(value, option.value))
        : [...selected, option.value];

      this.value.set(nextValue);
      this.onChangeFn(nextValue);
      this.scheduleDropdownPlacementUpdate();
      return;
    }

    this.value.set(option.value);
    this.onChangeFn(option.value);
    this.closeDropdown();
    this.triggerElement()?.nativeElement.focus();
  }

  protected clearAll(event: MouseEvent): void {
    event.stopPropagation();
    this.value.set([]);
    this.onChangeFn([]);
    this.activeIndex.set(this.findNextEnabledIndex(-1, 1));
    this.scheduleDropdownPlacementUpdate();
  }

  protected onTriggerKeydown(event: KeyboardEvent): void {
    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        if (!this.isOpen()) {
          this.openDropdown(1);
        } else {
          this.moveActiveOption(1);
        }
        break;
      case 'ArrowUp':
        event.preventDefault();
        if (!this.isOpen()) {
          this.openDropdown(-1);
        } else {
          this.moveActiveOption(-1);
        }
        break;
      case 'Home':
        if (this.isOpen()) {
          event.preventDefault();
          this.activeIndex.set(this.findNextEnabledIndex(-1, 1));
          this.scrollActiveOptionIntoView();
        }
        break;
      case 'End':
        if (this.isOpen()) {
          event.preventDefault();
          this.activeIndex.set(this.findNextEnabledIndex(this.options().length, -1));
          this.scrollActiveOptionIntoView();
        }
        break;
      case 'Enter':
      case ' ':
        event.preventDefault();
        if (!this.isOpen()) {
          this.openDropdown();
        } else {
          const option = this.options()[this.activeIndex()];
          if (option) {
            this.selectOption(option);
          }
        }
        break;
      case 'Escape':
        if (this.isOpen()) {
          event.preventDefault();
          this.closeDropdown(false);
        }
        break;
      case 'Tab':
        this.closeDropdown();
        break;
      default:
        if (event.key.length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey) {
          this.handleTypeahead(event.key);
        }
    }
  }

  protected isOptionSelected(option: SelectOption): boolean {
    return this.includesValue(this.selectedValues(), option.value);
  }

  protected optionId(index: number): string {
    return `${this.listboxId()}-option-${index}`;
  }

  protected optionClasses(option: SelectOption, index: number): string {
    const stateClasses = this.isOptionSelected(option)
      ? 'bg-primary/10 text-primary'
      : index === this.activeIndex()
        ? 'bg-muted'
        : '';

    return `mb-1 flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-foreground transition-colors last:mb-0 hover:bg-surface-hover disabled:cursor-not-allowed disabled:opacity-50 ${stateClasses}`;
  }

  protected onActionClick(): void {
    this.actionClick.emit();
  }

  writeValue(value: SelectControlValue | undefined): void {
    if (this.multiple()) {
      const multipleValue = Array.isArray(value) ? value : value == null ? [] : [value];
      this.value.set(multipleValue);
      return;
    }

    this.value.set(Array.isArray(value) ? (value[0] ?? null) : (value ?? null));
  }

  registerOnChange(fn: (value: SelectControlValue) => void): void {
    this.onChangeFn = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouchedFn = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.isDisabled.set(isDisabled);
    if (isDisabled) {
      this.closeDropdown(false);
    }
  }

  ngOnDestroy(): void {
    this.resetTypeahead();
    this.stopDropdownPositionTracking();
  }

  private openDropdown(direction: 1 | -1 = 1): void {
    if (this.options().length === 0) {
      this.isOpen.set(true);
      this.activeIndex.set(-1);
      this.startDropdownPositionTracking();
      return;
    }

    this.isOpen.set(true);
    const selectedIndex = this.options().findIndex(
      (option) => !option.disabled && this.isOptionSelected(option),
    );
    this.activeIndex.set(
      selectedIndex >= 0
        ? selectedIndex
        : this.findNextEnabledIndex(direction > 0 ? -1 : this.options().length, direction),
    );
    this.startDropdownPositionTracking();
    this.scrollActiveOptionIntoView();
  }

  private startDropdownPositionTracking(): void {
    if (!this.viewportListenersRegistered) {
      window.addEventListener('resize', this.onViewportChange);
      document.addEventListener('scroll', this.onViewportChange, true);
      window.visualViewport?.addEventListener('resize', this.onViewportChange);
      window.visualViewport?.addEventListener('scroll', this.onViewportChange);
      this.viewportListenersRegistered = true;
    }

    this.scheduleDropdownPlacementUpdate();
  }

  private stopDropdownPositionTracking(): void {
    if (this.placementTimer) {
      clearTimeout(this.placementTimer);
      this.placementTimer = undefined;
    }

    this.dropdownResizeObserver?.disconnect();
    this.dropdownResizeObserver = undefined;

    if (!this.viewportListenersRegistered) {
      return;
    }

    window.removeEventListener('resize', this.onViewportChange);
    document.removeEventListener('scroll', this.onViewportChange, true);
    window.visualViewport?.removeEventListener('resize', this.onViewportChange);
    window.visualViewport?.removeEventListener('scroll', this.onViewportChange);
    this.viewportListenersRegistered = false;
  }

  private scheduleDropdownPlacementUpdate(): void {
    if (!this.isOpen()) {
      return;
    }

    if (this.placementTimer) {
      clearTimeout(this.placementTimer);
    }

    this.placementTimer = setTimeout(() => {
      this.placementTimer = undefined;
      this.updateDropdownPlacement();
    });
  }

  private updateDropdownPlacement(): void {
    const trigger = this.triggerElement()?.nativeElement;
    const dropdown = this.dropdownElement()?.nativeElement;
    const header = this.dropdownHeaderElement()?.nativeElement;
    const optionsViewport = this.optionsViewportElement()?.nativeElement;
    if (!trigger || !dropdown || !header || !optionsViewport) {
      return;
    }

    const triggerRect = trigger.getBoundingClientRect();
    const placementViewport = this.getPlacementViewport(trigger);
    const gap = 4;
    const padding = Math.max(0, this.viewportPadding());
    const availableBelow = Math.max(
      0,
      placementViewport.bottom - triggerRect.bottom - padding - gap,
    );
    const availableAbove = Math.max(0, triggerRect.top - placementViewport.top - padding - gap);
    const headerHeight = header.getBoundingClientRect().height;
    const preferredOptionsHeight = Math.min(
      Math.max(0, this.maxDropdownHeight()),
      optionsViewport.scrollHeight,
    );
    const preferredPanelHeight = headerHeight + preferredOptionsHeight;
    const placement: SelectDropdownPlacement =
      availableBelow < preferredPanelHeight && availableAbove > availableBelow ? 'top' : 'bottom';
    const availablePanelHeight = placement === 'top' ? availableAbove : availableBelow;
    const nextOptionsHeight = Math.max(
      0,
      Math.min(preferredOptionsHeight, availablePanelHeight - headerHeight),
    );

    this.dropdownPlacement.set(placement);
    this.availableOptionsHeight.set(nextOptionsHeight);

    if (!this.dropdownResizeObserver && typeof ResizeObserver !== 'undefined') {
      this.dropdownResizeObserver = new ResizeObserver(() =>
        this.scheduleDropdownPlacementUpdate(),
      );
    }

    this.dropdownResizeObserver?.observe(dropdown);
    this.dropdownResizeObserver?.observe(optionsViewport);
    placementViewport.containers.forEach((container) =>
      this.dropdownResizeObserver?.observe(container),
    );
  }

  private getPlacementViewport(trigger: HTMLElement): {
    top: number;
    bottom: number;
    containers: HTMLElement[];
  } {
    const visualViewport = window.visualViewport;
    const viewportTop = visualViewport?.offsetTop ?? 0;
    const viewportHeight = visualViewport?.height ?? window.innerHeight;
    let top = viewportTop;
    let bottom = viewportTop + viewportHeight;
    const containers: HTMLElement[] = [];
    let ancestor = trigger.parentElement;

    while (ancestor && ancestor !== document.documentElement) {
      const overflowY = window.getComputedStyle(ancestor).overflowY;
      if (['auto', 'scroll', 'hidden', 'clip', 'overlay'].includes(overflowY)) {
        const rect = ancestor.getBoundingClientRect();
        const containerTop = rect.top + ancestor.clientTop;
        const containerBottom = containerTop + ancestor.clientHeight;
        top = Math.max(top, containerTop);
        bottom = Math.min(bottom, containerBottom);
        containers.push(ancestor);
      }

      ancestor = ancestor.parentElement;
    }

    return { top, bottom: Math.max(top, bottom), containers };
  }

  private moveActiveOption(direction: 1 | -1): void {
    const nextIndex = this.findNextEnabledIndex(this.activeIndex(), direction);
    if (nextIndex >= 0) {
      this.activeIndex.set(nextIndex);
      this.scrollActiveOptionIntoView();
    }
  }

  private findNextEnabledIndex(startIndex: number, direction: 1 | -1): number {
    const options = this.options();
    let index = startIndex + direction;

    while (index >= 0 && index < options.length) {
      if (!options[index].disabled) {
        return index;
      }
      index += direction;
    }

    return -1;
  }

  private handleTypeahead(key: string): void {
    this.typeaheadQuery += key.toLocaleLowerCase();
    if (this.typeaheadTimer) {
      clearTimeout(this.typeaheadTimer);
    }
    this.typeaheadTimer = setTimeout(() => this.resetTypeahead(), 500);

    const matchIndex = this.options().findIndex(
      (option) =>
        !option.disabled && option.label.toLocaleLowerCase().startsWith(this.typeaheadQuery),
    );
    if (matchIndex < 0) {
      return;
    }

    if (!this.isOpen()) {
      this.isOpen.set(true);
      this.startDropdownPositionTracking();
    }
    this.activeIndex.set(matchIndex);
    this.scrollActiveOptionIntoView();
  }

  private resetTypeahead(): void {
    this.typeaheadQuery = '';
    if (this.typeaheadTimer) {
      clearTimeout(this.typeaheadTimer);
      this.typeaheadTimer = undefined;
    }
  }

  private scrollActiveOptionIntoView(): void {
    setTimeout(() => {
      document
        .getElementById(this.optionId(this.activeIndex()))
        ?.scrollIntoView?.({ block: 'nearest' });
    });
  }

  private findOption(value: SelectValue): SelectOption | undefined {
    return this.options().find((option) => Object.is(option.value, value));
  }

  private includesValue(values: SelectValue[], value: SelectValue): boolean {
    return values.some((selectedValue) => Object.is(selectedValue, value));
  }
}
