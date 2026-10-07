import { Component, input, ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'hui-form-description',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <p [id]="id()" class="mt-1  text-text-muted">
      <ng-content></ng-content>
    </p>
  `,
})
export class FormDescriptionComponent {
  id = input<string>('');
}
