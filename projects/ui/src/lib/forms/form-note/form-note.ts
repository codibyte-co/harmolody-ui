import { Component, computed, input, ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'hui-form-note',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div [id]="id()" [class]="noteClasses()">
      <div class="flex items-start">
        <svg class="w-5 h-5 mt-0.5 mr-2 shrink-0" fill="currentColor" viewBox="0 0 20 20">
          <path
            fill-rule="evenodd"
            d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
            clip-rule="evenodd"
          />
        </svg>
        <div>
          <ng-content></ng-content>
        </div>
      </div>
    </div>
  `,
})
export class FormNoteComponent {
  id = input<string>('');
  variant = input<'info' | 'warning' | 'success' | 'error' | 'neutral'>('info');
  customClasses = input<string>('');

  protected readonly noteClasses = computed(() => {
    const custom = this.customClasses();
    if (custom) {
      return `mt-2.5 p-2 rounded  ${custom}`;
    }

    const variant = this.variant();
    const variantClasses = {
      info: 'bg-blue-50 border border-blue-200 text-blue-800',
      warning: 'bg-yellow-50 border border-yellow-200 text-yellow-800',
      success: 'bg-green-50 border border-green-200 text-green-800',
      error: 'bg-red-50 border border-red-200 text-red-800',
      neutral: 'bg-muted border border-border text-text-secondary',
    };

    return `mt-2.5 p-2 rounded  ${variantClasses[variant]}`;
  });
}
