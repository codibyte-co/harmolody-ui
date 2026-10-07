import {
  Component,
  computed,
  effect,
  inject,
  input,
  OnDestroy,
  OnInit,
  output,
  signal,
  viewChildren,
  ChangeDetectionStrategy,
} from '@angular/core';
import { FormArray, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { DynamicFieldComponent } from './dynamic-field/dynamic-field';
import { FieldConfig, FormAction, FormConfig, FormFieldsetConfig } from '../models';
import { FieldResolverService, FormBuilderService } from '../services';
import { IconComponent } from '../../icon';
import { LocalizationService } from '../../config/ui-localization';
import { Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'hui-dynamic-form',
  templateUrl: './dynamic-form.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, DynamicFieldComponent, IconComponent],
})
export class DynamicFormComponent implements OnInit, OnDestroy {
  config = input.required<FormConfig>();
  initialValues = input<Record<string, any>>({});

  // Outputs
  formSubmit = output<any>();
  reset = output<void>();
  cancel = output<void>();
  valueChange = output<any>();
  /** Emits when form values change with full selected objects for autocomplete/select fields */
  fieldChange = output<{ values: any; selectedObjects: Record<string, any> }>();
  actionClick = output<{ action: FormAction; formValue: any; isValid: boolean }>();
  /** Emits when a field's action button is clicked (e.g., "Create New" button) */
  fieldActionClick = output<{ fieldKey: string; formValue: any }>();

  // View children to access dynamic field components
  private readonly dynamicFields = viewChildren(DynamicFieldComponent);

  private readonly formBuilder = inject(FormBuilderService);
  private readonly fieldResolver = inject(FieldResolverService);
  protected readonly localization = inject(LocalizationService);
  private readonly destroy$ = new Subject<void>();
  private isSubmitting = false;
  private initialized = false;

  protected readonly form = signal<FormGroup>(new FormGroup({}));
  protected readonly formValues = signal<Record<string, any>>({});
  protected readonly submitting = signal<boolean>(false);
  protected readonly submitted = signal<boolean>(false); // Track if form has been submitted
  protected readonly busy = computed(() => this.submitting() || this.form().disabled);

  constructor() {
    effect(() => {
      const config = this.config();
      if (this.initialized) this.addMissingControls(config);
    });
  }

  protected readonly visibleFields = computed(() => {
    const fields = this.config().fields;
    const values = this.formValues();

    return fields.filter((field) => this.fieldResolver.shouldShowField(field, values));
  });

  protected readonly visibleFieldsets = computed(() => {
    const visibleByKey = new Map(this.visibleFields().map((field) => [field.key, field]));

    return (this.config().fieldsets || [])
      .map((fieldset) => ({
        config: fieldset,
        fields: fieldset.fields
          .map((key) => visibleByKey.get(key))
          .filter((field): field is FieldConfig => field !== undefined),
      }))
      .filter((fieldset) => fieldset.fields.length > 0);
  });

  protected readonly ungroupedFields = computed(() => {
    const groupedKeys = new Set(
      (this.config().fieldsets || []).flatMap((fieldset) => fieldset.fields),
    );
    return this.visibleFields().filter((field) => !groupedKeys.has(field.key));
  });

  protected readonly layoutClass = computed(() => {
    const layout = this.config().layout || 'vertical';
    const columns = this.config().columns || 1;

    if (layout === 'grid') {
      return [
        'grid gap-4 grid-cols-1 md:grid-cols-1',
        'grid gap-4 grid-cols-1 md:grid-cols-2',
        'grid gap-4 grid-cols-1 md:grid-cols-3',
      ][Math.max(1, Math.min(columns, 3)) - 1];
    }

    return 'space-y-4';
  });

  /** Whether the form uses custom actions array */
  protected readonly hasCustomActions = computed(() => {
    const actions = this.config().actions;
    return actions && actions.length > 0;
  });

  /** Sorted and filtered actions */
  protected readonly sortedActions = computed(() => {
    const actions = this.config().actions || [];
    return actions
      .filter((action) => !action.hidden)
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  });

  protected getFieldColumnClass(field: any): string {
    const layout = this.config().layout || 'vertical';

    // If not grid layout, no special classes needed
    if (layout !== 'grid') {
      return '';
    }

    // Check if field should span full width
    if (field.fullWidth) {
      return 'col-span-full';
    }

    // Check if field has custom column span
    if (field.columnSpan) {
      return ['md:col-span-1', 'md:col-span-2', 'md:col-span-3'][
        Math.max(1, Math.min(field.columnSpan, this.config().columns || 1, 3)) - 1
      ];
    }

    return '';
  }

  protected getFieldsetClass(fieldset: FormFieldsetConfig): string {
    const base = 'rounded-xl border border-border bg-surface p-4 sm:p-6';
    return `${base} ${fieldset.cssClass || ''}`.trim();
  }

  ngOnInit(): void {
    this.initializeForm();
    this.initialized = true;
    this.addMissingControls(this.config());
    this.setupDependencies();
    this.setupValueChangeListener();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initializeForm(): void {
    const formGroup = this.formBuilder.buildForm(this.config());
    this.form.set(formGroup);

    // Set initial values if provided
    const initial = this.initialValues();
    if (Object.keys(initial).length > 0) {
      this.patchInitialValues(formGroup, initial);
    }

    // Initialize formValues signal
    this.formValues.set(formGroup.getRawValue());

    // Update validators for initially hidden fields
    this.updateHiddenFieldValidators();
  }

  private addMissingControls(config: FormConfig): void {
    const form = this.form();
    let added = false;
    for (const field of config.fields) {
      if (form.contains(field.key)) continue;
      const source = this.formBuilder.buildForm({ fields: [field] });
      const control = source.get(field.key);
      if (!control) continue;
      source.removeControl(field.key);
      form.addControl(field.key, control);
      added = true;
    }
    if (!added) return;
    this.formValues.set(form.getRawValue());
    this.updateHiddenFieldValidators();
  }

  private patchInitialValues(formGroup: FormGroup, initial: Record<string, unknown>): void {
    const scalarValues: Record<string, unknown> = { ...initial };
    for (const field of this.config().fields) {
      if (field.type !== 'array' || !field.arrayFields) continue;
      delete scalarValues[field.key];
      const values = initial[field.key];
      const formArray = formGroup.get(field.key) as FormArray | null;
      if (!formArray || !Array.isArray(values)) continue;
      formArray.clear();
      for (const value of values) {
        const itemGroup = this.formBuilder.createFormGroupFromFields(field.arrayFields);
        if (typeof value === 'object' && value !== null) itemGroup.patchValue(value);
        formArray.push(itemGroup);
      }
    }
    formGroup.patchValue(scalarValues);
  }

  private setupValueChangeListener(): void {
    this.form()
      .valueChanges.pipe(takeUntil(this.destroy$))
      .subscribe((values) => {
        this.formValues.set(this.form().getRawValue());
        this.valueChange.emit(values);

        // Emit field change event with selected objects if any field has emitSelectedObject enabled
        const hasEmitSelectedObjectFields = this.config().fields.some(
          (f) => (f.type === 'autocomplete' || f.type === 'select') && f.emitSelectedObject,
        );
        if (hasEmitSelectedObjectFields) {
          const selectedObjects = this.getSelectedObjects();
          this.fieldChange.emit({ values, selectedObjects });
        }

        this.updateHiddenFieldValidators();
      });
  }

  private updateHiddenFieldValidators(): void {
    const formValues = this.form().getRawValue();
    const fields = this.config().fields;

    for (const field of fields) {
      const control = this.form().get(field.key);
      if (!control) continue;

      const isVisible = this.fieldResolver.shouldShowField(field, formValues);

      if (!isVisible) {
        control.clearValidators();
        control.updateValueAndValidity({ emitEvent: false });
      } else {
        const validators = this.formBuilder.buildValidatorsFromConfig(field);
        control.setValidators(validators);
        control.updateValueAndValidity({ emitEvent: false });
      }
    }
  }

  private setupDependencies(): void {
    const dependencyMap = this.fieldResolver.getFieldsWithDependency(this.config().fields);

    // Watch for changes in fields that have dependents
    for (const [fieldKey, dependentFields] of dependencyMap.entries()) {
      const control = this.form().get(fieldKey);
      if (!control) continue;

      control.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(() => {
        for (const dependentField of dependentFields) {
          const dependencies = Array.isArray(dependentField.dependsOn)
            ? dependentField.dependsOn
            : [dependentField.dependsOn];

          for (const dep of dependencies) {
            if (dep && dep.field === fieldKey) {
              // Clear dependent field if configured
              if (dep && dep.clearOnChange) {
                const dependentControl = this.form().get(dependentField.key);
                dependentControl?.reset();
              }
            }
          }
        }
      });
    }
  }

  protected onSubmit(): void {
    // Mark form as submitted (for validation display)
    this.submitted.set(true);

    // Prevent double submission
    if (this.isSubmitting) {
      return;
    }

    if (this.form().invalid) {
      this.form().markAllAsTouched();
      return;
    }

    this.isSubmitting = true;
    this.submitting.set(true);

    const formValue = this.form().getRawValue();
    this.form().disable({ emitEvent: false });
    this.formSubmit.emit(formValue);
  }

  /**
   * Call this method to reset the submitting state and re-enable the form
   * Should be called from parent component after async operation completes
   */
  public finishSubmit(): void {
    this.isSubmitting = false;
    this.submitting.set(false);
    this.form().enable({ emitEvent: false });
    for (const field of this.config().fields) {
      if (field.disabled) this.form().get(field.key)?.disable({ emitEvent: false });
    }
  }

  public validate(): boolean {
    this.submitted.set(true);
    if (this.form().invalid) {
      this.form().markAllAsTouched();
      return false;
    }
    return true;
  }

  public getRawValue<T>(): T {
    return this.form().getRawValue() as T;
  }

  public onReset(): void {
    this.form().reset();
    this.reset.emit();
  }

  public onCancel(): void {
    this.cancel.emit();
  }

  /** Handle custom action button click */
  protected onActionClick(action: FormAction): void {
    // Handle built-in action types
    if (action.type === 'submit') {
      this.onSubmit();
      return;
    }

    if (action.type === 'reset') {
      this.onReset();
      return;
    }

    // Emit custom action event
    this.actionClick.emit({
      action,
      formValue: this.form().getRawValue(),
      isValid: this.form().valid,
    });
  }

  /** Check if an action button should be disabled */
  protected isActionDisabled(action: FormAction): boolean {
    if (action.disableOnSubmitting && this.submitting()) {
      return true;
    }
    if (action.disableOnInvalid && this.form().invalid) {
      return true;
    }
    return false;
  }

  /** Get CSS classes for an action button based on variant */
  protected getActionClass(action: FormAction): string {
    // Base classes for all buttons
    const baseClasses =
      'py-2 px-4 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed';

    // Variant-specific classes
    const variantClasses: Record<string, string> = {
      primary:
        'bg-linear-to-r from-purple-600 to-indigo-600 text-white hover:from-purple-700 hover:to-indigo-700 focus:ring-purple-500',
      secondary: 'bg-border text-text-secondary hover:bg-gray-300 focus:ring-gray-500',
      outline:
        'border border-border bg-transparent text-text-secondary hover:bg-surface-hover focus:ring-gray-500',
      danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500',
      success: 'bg-green-600 text-white hover:bg-green-700 focus:ring-green-500',
      link: 'bg-transparent text-purple-600 hover:text-purple-800 hover:underline focus:ring-purple-500',
    };

    const variant = action.variant || 'secondary';
    const variantClass = variantClasses[variant] || variantClasses['secondary'];

    // Combine base + variant + custom classes (custom classes can extend/override)
    const customClass = action.cssClass || '';
    return `${baseClasses} ${variantClass} ${customClass}`.trim();
  }

  /** Handle field action button click (e.g., "Create New" button on select/autocomplete) */
  protected onFieldActionClick(event: { fieldKey: string }): void {
    this.fieldActionClick.emit({
      fieldKey: event.fieldKey,
      formValue: this.form().getRawValue(),
    });
  }

  /**
   * Reload options for a specific field (useful after creating a new item via action button)
   * @param fieldKey The key of the field to reload options for
   */
  public reloadFieldOptions(fieldKey: string): void {
    const field = this.getField(fieldKey);
    if (field) {
      field.reloadOptions();
    }
  }

  /**
   * Reload options for a field and set the newly created value
   * @param fieldKey The key of the field to reload and set value for
   * @param newValue The value to set after reloading (e.g., the ID of the newly created item)
   */
  public reloadFieldOptionsAndSetValue(fieldKey: string, newValue: any): void {
    const field = this.getField(fieldKey);
    if (field) {
      field.reloadOptions();
      // Set the value after a small delay to allow options to load
      setTimeout(() => {
        this.form().get(fieldKey)?.setValue(newValue);
      }, 500);
    }
  }

  /** Get a dynamic field component by field key */
  public getField(fieldKey: string): DynamicFieldComponent | undefined {
    return this.dynamicFields().find((field) => field.field().key === fieldKey);
  }

  /**
   * Set value for a specific field
   * @param fieldKey The key of the field to set value for
   * @param value The value to set
   */
  public setFieldValue(fieldKey: string, value: any): void {
    this.form().get(fieldKey)?.setValue(value);
  }

  /**
   * Get selected objects for all autocomplete/select fields
   * @returns Record of field keys to their selected option objects
   */
  private getSelectedObjects(): Record<string, any> {
    const selectedObjects: Record<string, any> = {};
    const fields = this.dynamicFields();

    for (const field of fields) {
      const fieldConfig = field.field();
      if (
        (fieldConfig.type === 'autocomplete' || fieldConfig.type === 'select') &&
        fieldConfig.emitSelectedObject
      ) {
        const selectedOption = field.getSelectedOption();
        if (selectedOption) {
          selectedObjects[fieldConfig.key] = selectedOption;
        }
      }
    }

    return selectedObjects;
  }
}
