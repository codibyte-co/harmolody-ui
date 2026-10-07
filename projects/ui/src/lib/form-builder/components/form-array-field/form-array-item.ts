import { Component, forwardRef, input, ChangeDetectionStrategy } from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { FieldConfig } from '../../models';
import { DynamicFieldComponent } from '../dynamic-field/dynamic-field';

/**
 * Wrapper component to break circular dependency between FormArrayFieldComponent and DynamicFieldComponent
 */
@Component({
  selector: 'hui-form-array-item',
  template: `
    <div [class]="layoutClass()">
      @for (childField of fields(); track childField.key) {
        <hui-dynamic-field
          [field]="childField"
          [form]="form()"
          [fieldLayout]="fieldLayout()"
          [apiConfig]="apiConfig()"
          [validationStrategy]="validationStrategy()"
          [formSubmitted]="formSubmitted()"
        />
      }
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, forwardRef(() => DynamicFieldComponent)],
})
export class FormArrayItemComponent {
  fields = input.required<FieldConfig[]>();
  form = input.required<FormGroup>();
  fieldLayout = input<'column' | 'row' | 'stacked'>('column');
  apiConfig = input<{ baseUrl?: string; headers?: Record<string, string> }>();
  validationStrategy = input<'touched' | 'submit'>('touched');
  formSubmitted = input<boolean>(false);
  layoutClass = input<string>('space-y-4');
}
