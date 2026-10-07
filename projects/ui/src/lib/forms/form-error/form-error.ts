import { Component, input, ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'hui-form-error',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (show()) {
      <p [id]="id()" class="mt-2  text-red-600" role="alert">
        <ng-content></ng-content>
      </p>
    }
  `,
})
export class FormErrorComponent {
  show = input<boolean>(true);
  id = input<string>('');
}
