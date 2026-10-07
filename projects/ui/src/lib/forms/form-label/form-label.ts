import { Component, input, ChangeDetectionStrategy } from '@angular/core';
import { FieldType } from '../../form-builder';

@Component({
  selector: 'hui-form-label',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <label
      [for]="type() === 'checkbox' || type() === 'radio' || type() === 'array' ? null : htmlFor()"
      [class]="'block  font-medium text-text-secondary ' + class()"
    >
      <ng-content></ng-content>
      @if (required()) {
        <span class="text-red-500" aria-label="required">*</span>
      }
    </label>
  `,
})
export class FormLabelComponent {
  htmlFor = input<string>('');
  required = input<boolean>(false);
  class = input<string>('');
  type = input<FieldType>('text');
}
