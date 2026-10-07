import { Injectable, inject } from '@angular/core';
import { FormBuilder, FormGroup, ValidatorFn, Validators } from '@angular/forms';
import { FieldConfig, FormConfig } from '../models';

@Injectable({ providedIn: 'root' })
export class FormBuilderService {
  private readonly fb = inject(FormBuilder);
  private customValidators = new Map<string, ValidatorFn>();

  buildForm(config: FormConfig): FormGroup {
    const group: Record<string, any> = {};

    // Sort fields by order if specified
    const sortedFields = [...config.fields].sort((a, b) => {
      const orderA = a.order ?? Number.MAX_VALUE;
      const orderB = b.order ?? Number.MAX_VALUE;
      return orderA - orderB;
    });

    for (const field of sortedFields) {
      if (field.type === 'array' && field.arrayFields) {
        // Handle FormArray
        const minItems = field.minItems || 0;
        const arrayControls: FormGroup[] = [];

        // Create initial items based on minItems or defaultValue
        const initialCount = Array.isArray(field.defaultValue)
          ? field.defaultValue.length
          : Math.max(minItems, minItems > 0 ? minItems : 0);

        for (let i = 0; i < initialCount; i++) {
          const itemGroup = this.createFormGroupFromFields(field.arrayFields);

          // If there's a defaultValue array, populate it
          if (Array.isArray(field.defaultValue) && field.defaultValue[i]) {
            itemGroup.patchValue(field.defaultValue[i]);
          }

          arrayControls.push(itemGroup);
        }

        group[field.key] = this.fb.array(arrayControls);
      } else {
        // Handle regular controls
        const validators = this.buildValidators(field);
        const defaultValue = field.defaultValue ?? this.getDefaultValue(field);

        group[field.key] = [{ value: defaultValue, disabled: field.disabled || false }, validators];
      }
    }

    return this.fb.group(group);
  }

  /**
   * Create a FormGroup from an array of field configurations
   * Used for creating array item groups
   */
  createFormGroupFromFields(fields: FieldConfig[]): FormGroup {
    const group: Record<string, any> = {};

    for (const field of fields) {
      const validators = this.buildValidators(field);
      const defaultValue = field.defaultValue ?? this.getDefaultValue(field);

      group[field.key] = [{ value: defaultValue, disabled: field.disabled || false }, validators];
    }

    return this.fb.group(group);
  }

  registerCustomValidator(name: string, validator: ValidatorFn): void {
    this.customValidators.set(name, validator);
  }

  getCustomValidator(name: string): ValidatorFn | undefined {
    return this.customValidators.get(name);
  }

  buildValidatorsFromConfig(field: FieldConfig): ValidatorFn[] {
    return this.buildValidators(field);
  }

  private buildValidators(field: FieldConfig): ValidatorFn[] {
    const validators: ValidatorFn[] = [];

    // Required validator
    if (field.required) {
      validators.push(Validators.required);
    }

    // Email validator for email type
    if (field.type === 'email') {
      validators.push(Validators.email);
    }

    // Number validators
    if (field.type === 'number') {
      if (field.min !== undefined) {
        validators.push(Validators.min(field.min));
      }
      if (field.max !== undefined) {
        validators.push(Validators.max(field.max));
      }
    }

    // Custom validation rules
    if (field.validation) {
      for (const rule of field.validation) {
        switch (rule.type) {
          case 'required':
            validators.push(Validators.required);
            break;
          case 'email':
            validators.push(Validators.email);
            break;
          case 'minLength':
            if (rule.value !== undefined) {
              validators.push(Validators.minLength(rule.value));
            }
            break;
          case 'maxLength':
            if (rule.value !== undefined) {
              validators.push(Validators.maxLength(rule.value));
            }
            break;
          case 'min':
            if (rule.value !== undefined) {
              validators.push(Validators.min(rule.value));
            }
            break;
          case 'max':
            if (rule.value !== undefined) {
              validators.push(Validators.max(rule.value));
            }
            break;
          case 'pattern':
            if (rule.value) {
              validators.push(Validators.pattern(rule.value));
            }
            break;
          case 'custom':
            if (rule.validator) {
              const customValidator = this.customValidators.get(rule.validator);
              if (customValidator) {
                validators.push(customValidator);
              } else {
                console.warn(`Custom validator '${rule.validator}' not found`);
              }
            }
            break;
        }
      }
    }

    return validators;
  }

  private getDefaultValue(field: FieldConfig): any {
    if (field.multiple) {
      return [];
    }

    switch (field.type) {
      case 'checkbox':
        return false;
      case 'number':
        return null;
      case 'array':
        return [];
      default:
        return '';
    }
  }
}
