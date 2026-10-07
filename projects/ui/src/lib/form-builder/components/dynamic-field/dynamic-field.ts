import {
  Component,
  computed,
  DestroyRef,
  effect,
  forwardRef,
  inject,
  input,
  output,
  signal,
  ChangeDetectionStrategy,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { FormArrayFieldComponent } from '../form-array-field/form-array-field';
import { ConditionRule, FieldConfig, SelectOption } from '../../models';
import { OptionsLoaderService } from '../../services';
import { AutocompleteComponent } from '../../../forms/autocomplete/autocomplete';
import { CheckboxComponent } from '../../../forms/checkbox/checkbox';
import { ChoiceChipsComponent } from '../../../forms/choice-chips/choice-chips';
import { DateInputComponent } from '../../../forms/date-input/date-input';
import { EmailInputComponent } from '../../../forms/email-input/email-input';
import { FileInputComponent } from '../../../forms/file-input/file-input';
import { FormFieldComponent } from '../../../forms/form-field/form-field';
import { ImageSelectorInputComponent } from '../../../forms/image-selector-input/image-selector-input';
import { InputComponent } from '../../../forms/input/input';
import { NumberInputComponent } from '../../../forms/number-input/number-input';
import { PasswordInputComponent } from '../../../forms/password-input/password-input';
import { RadioGroupComponent } from '../../../forms/radio-group/radio-group';
import { SearchInputComponent } from '../../../forms/search-input/search-input';
import { SelectComponent } from '../../../forms/select/select';
import { SwitchComponent } from '../../../forms/switch/switch';
import { TelInputComponent } from '../../../forms/tel-input/tel-input';
import { TextareaComponent } from '../../../forms/textarea/textarea';
import { UrlInputComponent } from '../../../forms/url-input/url-input';
import { LocalizationService } from '../../../config/ui-localization';

@Component({
  selector: 'hui-dynamic-field',
  templateUrl: './dynamic-field.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    FormFieldComponent,
    forwardRef(() => FormArrayFieldComponent),
    InputComponent,
    EmailInputComponent,
    PasswordInputComponent,
    TextareaComponent,
    SelectComponent,
    CheckboxComponent,
    SwitchComponent,
    ChoiceChipsComponent,
    RadioGroupComponent,
    NumberInputComponent,
    TelInputComponent,
    UrlInputComponent,
    SearchInputComponent,
    AutocompleteComponent,
    DateInputComponent,
    ImageSelectorInputComponent,
    FileInputComponent,
  ],
})
export class DynamicFieldComponent {
  field = input.required<FieldConfig>();
  form = input.required<FormGroup>();
  fieldLayout = input<'column' | 'row' | 'stacked'>('column');
  apiConfig = input<{ baseUrl?: string; headers?: Record<string, string> }>();
  validationStrategy = input<'touched' | 'submit'>('touched');
  formSubmitted = input<boolean>(false);

  /** Emits when a field's action button is clicked, with the field key */
  actionClick = output<{ fieldKey: string }>();

  private readonly optionsLoader = inject(OptionsLoaderService);
  private readonly destroyRef = inject(DestroyRef);
  protected readonly localization = inject(LocalizationService);

  protected readonly options = signal<SelectOption[]>([]);
  protected readonly loading = signal(false);

  // Reactive control state tracking
  private readonly controlTouched = signal<boolean>(false);
  private readonly controlInvalid = signal<boolean>(false);

  // Generate unique ID for each field
  protected readonly fieldId = computed(() => {
    const fieldKey = this.field().key;
    const uniqueSuffix = Math.random().toString(36).substring(2, 11);
    return `field-${fieldKey}-${uniqueSuffix}`;
  });

  protected readonly control = computed(() => {
    return this.form().get(this.field().key) as FormControl;
  });

  // Compute whether to show error state on input
  protected readonly showError = computed(() => {
    const ctrl = this.control();
    if (!ctrl) return false;

    // Use reactive signals instead of direct property access
    const invalid = this.controlInvalid();
    const touched = this.controlTouched();

    if (!invalid) return false;

    const strategy = this.validationStrategy();
    const submitted = this.formSubmitted();

    // Show errors based on strategy
    if (strategy === 'submit') {
      return submitted;
    } else {
      // Default: show errors when field is touched
      return touched;
    }
  });

  // Track form changes to trigger visibility re-evaluation
  private readonly formChangeSignal = signal<number>(0);

  // Compute whether the field should be visible based on showWhen/hideWhen conditions
  protected readonly isVisible = computed(() => {
    // Trigger reactivity when form changes
    this.formChangeSignal();

    const field = this.field();
    const form = this.form();

    // If explicitly hidden, don't show
    if (field.hidden) {
      return false;
    }

    // Evaluate showWhen conditions
    if (field.showWhen) {
      const showConditions = Array.isArray(field.showWhen) ? field.showWhen : [field.showWhen];
      const shouldShow = showConditions.every((condition) =>
        this.evaluateCondition(condition, form),
      );

      if (!shouldShow) {
        return false;
      }
    }

    // Evaluate hideWhen conditions
    if (field.hideWhen) {
      const hideConditions = Array.isArray(field.hideWhen) ? field.hideWhen : [field.hideWhen];
      const shouldHide = hideConditions.some((condition) =>
        this.evaluateCondition(condition, form),
      );
      if (shouldHide) {
        return false;
      }
    }

    return true;
  });

  constructor() {
    // Track control state changes for reactive error display
    effect(() => {
      const ctrl = this.control();

      if (!ctrl) {
        return;
      }

      // Set initial state
      this.controlInvalid.set(ctrl.invalid);
      this.controlTouched.set(ctrl.touched);

      // Subscribe to status changes
      ctrl.statusChanges?.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => {
        this.controlInvalid.set(ctrl.invalid);
        this.controlTouched.set(ctrl.touched);
      });

      // Subscribe to events (includes touch events)
      ctrl.events?.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => {
        this.controlInvalid.set(ctrl.invalid);
        this.controlTouched.set(ctrl.touched);
      });
    });

    // Watch for form value changes to trigger visibility re-evaluation
    effect(() => {
      const form = this.form();

      // Subscribe to form value changes
      form.valueChanges?.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => {
        this.formChangeSignal.update((v) => v + 1);
      });
    });

    // Initial load when field signal changes
    effect(() => {
      const field = this.field();
      const form = this.form();

      // Load options on initial render if configured to do so
      const shouldLoadOnInit = field.optionsFromApi?.loadOnInit !== false;
      if (shouldLoadOnInit) {
        this.loadOptions();
      }

      // Set up dependency watchers
      if (field.dependsOn && field.optionsFromApi) {
        const dependencies = Array.isArray(field.dependsOn) ? field.dependsOn : [field.dependsOn];

        // Watch each dependency field for changes
        dependencies.forEach((dep) => {
          if (dep.refreshOn === 'change') {
            const dependentControl = form.get(dep.field);
            if (dependentControl) {
              dependentControl.valueChanges
                .pipe(takeUntilDestroyed(this.destroyRef))
                .subscribe(() => {
                  this.loadOptions();
                });
            }
          }
        });
      }
    });
  }

  // Evaluate a single condition
  private evaluateCondition(condition: ConditionRule, form: FormGroup): boolean {
    const control = form.get(condition.field);
    if (!control) {
      return false;
    }

    const fieldValue = control.value;
    const { operator, value, values } = condition;

    // Normalize empty values: treat empty strings, null, and undefined as equivalent
    const isFieldEmpty = fieldValue === null || fieldValue === undefined || fieldValue === '';
    const isConditionValueEmpty = value === null || value === undefined || value === '';

    switch (operator) {
      case 'eq':
        // Handle empty value comparisons
        if (isConditionValueEmpty) {
          return isFieldEmpty;
        }
        return fieldValue === value;
      case 'neq':
        // Handle empty value comparisons
        if (isConditionValueEmpty) {
          return !isFieldEmpty;
        }
        return fieldValue !== value;
      case 'in':
        return values ? values.includes(fieldValue) : false;
      case 'nin':
        return values ? !values.includes(fieldValue) : true;
      case 'gt':
        return fieldValue > value;
      case 'gte':
        return fieldValue >= value;
      case 'lt':
        return fieldValue < value;
      case 'lte':
        return fieldValue <= value;
      case 'contains':
        return typeof fieldValue === 'string' && typeof value === 'string'
          ? fieldValue.includes(value)
          : false;
      default:
        return false;
    }
  }

  protected loadOptions(searchQuery?: string): void {
    const field = this.field();

    // Use static options
    if (field.options && !searchQuery) {
      this.options.set(field.options);
      return;
    }

    // Load from API
    if (field.optionsFromApi) {
      this.loading.set(true);
      const formValues = this.form().getRawValue();

      this.optionsLoader
        .loadOptions(field.optionsFromApi, formValues, searchQuery, this.apiConfig())
        .subscribe({
          next: (options) => {
            this.options.set(options);
            this.loading.set(false);
          },
          error: (err) => {
            console.error('Failed to load options:', err);
            this.loading.set(false);
          },
        });
    }
  }

  protected onSearch(query: string): void {
    this.loadOptions(query);
  }

  protected onAutocompleteSelect(value: any): void {}

  /** Emit action click event with the field key */
  protected onFieldActionClick(): void {
    this.actionClick.emit({ fieldKey: this.field().key });
  }

  /** Reload options - can be called from parent component after creating new item */
  public reloadOptions(): void {
    this.loadOptions();
  }

  /** Get the selected option object for autocomplete/select fields */
  public getSelectedOption(): SelectOption | SelectOption[] | undefined {
    const field = this.field();
    if (field.type !== 'autocomplete' && field.type !== 'select') {
      return undefined;
    }

    const control = this.control();
    if (!control) return undefined;

    const selectedValue = control.value;
    if (!selectedValue) return undefined;

    const options = this.options();

    // Handle multiple selection
    if (field.multiple && Array.isArray(selectedValue)) {
      return selectedValue
        .map((val) => options.find((opt) => opt.value === val))
        .filter((opt): opt is SelectOption => !!opt);
    }

    // Handle single selection
    return options.find((opt) => opt.value === selectedValue);
  }
}
