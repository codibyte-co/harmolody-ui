import {
  Component,
  computed,
  DestroyRef,
  effect,
  inject,
  input,
  signal,
  ChangeDetectionStrategy,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl } from '@angular/forms';
import { FieldType } from '../../form-builder';
import { FormDescriptionComponent } from '../form-description/form-description';
import { FormErrorComponent } from '../form-error/form-error';
import { FormHelperComponent } from '../form-helper/form-helper';
import { FormHintComponent } from '../form-hint/form-hint';
import { FormLabelComponent } from '../form-label/form-label';
import { FormNoteComponent } from '../form-note/form-note';
import { getErrorMessage } from '../utils/form-errors';
import { LocalizationService } from '../../config/ui-localization';

@Component({
  selector: 'hui-form-field',
  imports: [
    FormLabelComponent,
    FormErrorComponent,
    FormHintComponent,
    FormHelperComponent,
    FormDescriptionComponent,
    FormNoteComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './form-field.html',
})
export class FormFieldComponent {
  private readonly destroyRef = inject(DestroyRef);
  protected readonly localization = inject(LocalizationService);

  label = input<string>('');
  hint = input<string>('');
  helper = input<string>('');
  description = input<string>('');
  layout = input<'column' | 'row' | 'stacked'>('column');
  note = input<string>('');
  noteVariant = input<'info' | 'warning' | 'success' | 'error' | 'neutral'>('info');
  noteClasses = input<string>('');
  required = input<boolean>(false);
  fieldName = input<string>('');
  validationStrategy = input<'touched' | 'submit'>('touched');
  formSubmitted = input<boolean>(false);
  inputId = input<string>(''); // Accept inputId from parent
  type = input<FieldType>('text');

  // Accept FormControl directly as input - renamed to avoid conflict with [formControl] directive
  control = input<FormControl | null>(null);

  // Generate unique ID once per component instance - only used as fallback
  private readonly uniqueId = Math.random().toString(36).substring(2, 11);

  // Expose fieldId - use provided inputId or generate one
  public readonly fieldId = computed(() => {
    const providedId = this.inputId();
    if (providedId) {
      return providedId;
    }
    const name = this.fieldName() || this.label().toLowerCase().replace(/\s+/g, '-');
    return `field-${name}-${this.uniqueId}`;
  });

  // Reactive signals for control state
  protected readonly controlTouched = signal<boolean>(false);
  protected readonly controlInvalid = signal<boolean>(false);
  protected readonly controlDisabled = signal<boolean>(false);
  protected readonly controlErrors = signal<any>(null);

  constructor() {
    // Subscribe to control state changes
    effect((onCleanup) => {
      const ctrl = this.control();

      if (!ctrl) {
        return;
      }

      // Set initial state immediately
      this.controlInvalid.set(ctrl.invalid);
      this.controlDisabled.set(ctrl.disabled);
      this.controlErrors.set(ctrl.errors);
      this.controlTouched.set(ctrl.touched);

      const subscription = ctrl.events.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => {
        this.controlInvalid.set(ctrl.invalid);
        this.controlDisabled.set(ctrl.disabled);
        this.controlErrors.set(ctrl.errors);
        this.controlTouched.set(ctrl.touched);
      });
      onCleanup(() => subscription.unsubscribe());
    });
  }

  // Generate unique IDs for accessibility - use the fieldId
  protected readonly computedInputId = computed(() => this.fieldId());

  protected readonly hintId = computed(() => `${this.computedInputId()}-hint`);
  protected readonly descriptionId = computed(() => `${this.computedInputId()}-description`);
  protected readonly errorId = computed(() => `${this.computedInputId()}-error`);

  // Check if the control is disabled - now using reactive signal
  protected readonly isDisabled = computed(() => this.controlDisabled());

  // Check if the control has errors and should show them - now using reactive signals
  // Made public so it can be accessed by parent components/templates
  public readonly showError = computed(() => {
    const invalid = this.controlInvalid();
    if (!invalid) return false;

    const strategy = this.validationStrategy();
    const submitted = this.formSubmitted();
    const touched = this.controlTouched();

    // Show errors based on strategy
    if (strategy === 'submit') {
      // Only show errors after form submission attempt
      return submitted;
    } else {
      // Default: show errors when field is touched
      return touched;
    }
  });

  // Get the error message for the control - now using reactive signals
  protected readonly errorMessage = computed(() => {
    if (!this.showError()) {
      return '';
    }
    const errors = this.controlErrors();
    return getErrorMessage(errors, this.fieldName() || this.label());
  });
}
