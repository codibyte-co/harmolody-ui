import { Component, computed, inject, input, ChangeDetectionStrategy } from '@angular/core';
import { getIcon } from './icons';
import { HARMOLODY_UI_CONFIG } from '../config/ui-config';

@Component({
  selector: 'hui-icon',
  host: {
    '[class]': 'customClass()',
    '[attr.role]': 'ariaLabel() ? "img" : null',
    '[attr.aria-hidden]': 'ariaLabel() ? null : true',
    '[attr.aria-label]': 'ariaLabel() || null',
  },
  template: `
    @if (iconData()) {
      <svg
        [attr.width]="size()"
        [attr.height]="size()"
        [attr.viewBox]="iconData()?.viewBox || '0 0 24 24'"
        [attr.fill]="iconData()?.fill || 'none'"
        [attr.stroke]="iconData()?.stroke || 'currentColor'"
        [attr.stroke-width]="iconData()?.strokeWidth || 2"
        [attr.stroke-linecap]="iconData()?.stroke ? 'round' : undefined"
        [attr.stroke-linejoin]="iconData()?.stroke ? 'round' : undefined"
        xmlns="http://www.w3.org/2000/svg"
      >
        @if (paths(); as pathList) {
          @for (path of pathList; track $index) {
            <path [attr.d]="path" />
          }
        }
      </svg>
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: [
    `
      :host {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
      }
      svg {
        display: block;
      }
    `,
  ],
})
export class IconComponent {
  private readonly config = inject(HARMOLODY_UI_CONFIG);
  /** Icon name from the icons constant */
  name = input.required<string>();

  /** Size in pixels */
  size = input<number>(24);

  /** Custom CSS classes */
  customClass = input<string>('');

  /** Accessible label for the icon */
  ariaLabel = input<string>('');

  /** Get icon data from the icons constant */
  protected readonly iconData = computed(() => {
    return this.config.icons?.[this.name()] ?? getIcon(this.name());
  });

  /** Convert path to array for consistent handling */
  protected readonly paths = computed(() => {
    const icon = this.iconData();
    if (!icon) return null;
    return Array.isArray(icon.path) ? icon.path : [icon.path];
  });
}
