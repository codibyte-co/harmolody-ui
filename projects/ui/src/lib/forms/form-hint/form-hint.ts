import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'hui-form-hint',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <p [id]="id()" class="mt-2  text-muted-foreground">
      <ng-content></ng-content>
    </p>
  `,
})
export class FormHintComponent {
  id = input<string>('');
}
