import {
  Component,
  ElementRef,
  input,
  signal,
  viewChild,
  ChangeDetectionStrategy,
} from '@angular/core';

type PopoverPosition = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';

@Component({
  selector: 'hui-form-helper',
  template: `
    <div class="relative flex ml-1">
      <button
        #triggerButton
        type="button"
        (click)="togglePopover()"
        (blur)="onBlur()"
        class="inline-flex items-center justify-center w-5 h-5 text-muted-foreground hover:text-text-muted focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-purple-500 rounded-full"
        [attr.aria-label]="'Help about ' + label()"
        [attr.aria-describedby]="isOpen() ? 'popover-' + id() : null"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          class="icon icon-tabler icons-tabler-outline icon-tabler-help-circle"
        >
          <path stroke="none" d="M0 0h24v24H0z" fill="none" />
          <path d="M3 12a9 9 0 1 0 18 0a9 9 0 0 0 -18 0" />
          <path d="M12 16v.01" />
          <path d="M12 13a2 2 0 0 0 .914 -3.782a1.98 1.98 0 0 0 -2.414 .483" />
        </svg>
      </button>

      @if (isOpen()) {
        <div
          [id]="'popover-' + id()"
          class="absolute z-50 w-64 p-3 bg-surface rounded-xl shadow-xl border border-border"
          [class]="getPopoverPositionClasses()"
          role="tooltip"
        >
          <div class=" text-text-secondary">
            <ng-content></ng-content>
          </div>
          <div
            class="absolute w-2 h-2 bg-surface border-border transform rotate-45"
            [class]="getArrowClasses()"
          ></div>
        </div>
      }
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class]': '"inline-block"',
  },
})
export class FormHelperComponent {
  id = input<string>('');
  label = input<string>('');

  protected readonly isOpen = signal<boolean>(false);
  protected readonly position = signal<PopoverPosition>('bottom-left');

  private readonly triggerButton = viewChild<ElementRef<HTMLButtonElement>>('triggerButton');

  protected togglePopover(): void {
    if (!this.isOpen()) {
      this.calculatePosition();
    }
    this.isOpen.update((open) => !open);
  }

  protected onBlur(): void {
    setTimeout(() => {
      this.isOpen.set(false);
    }, 200);
  }

  private calculatePosition(): void {
    const button = this.triggerButton()?.nativeElement;
    if (!button) {
      this.position.set('bottom-left');
      return;
    }

    const rect = button.getBoundingClientRect();
    const popoverWidth = 256;
    const popoverHeight = 100;
    const padding = 16;

    const spaceBelow = window.innerHeight - rect.bottom;
    const spaceAbove = rect.top;
    const spaceRight = window.innerWidth - rect.left;
    const spaceLeft = rect.right;

    const vertical = spaceBelow >= popoverHeight + padding ? 'bottom' : 'top';
    const horizontal = spaceRight >= popoverWidth + padding ? 'left' : 'right';

    this.position.set(`${vertical}-${horizontal}` as PopoverPosition);
  }

  protected getPopoverPositionClasses(): string {
    const pos = this.position();
    switch (pos) {
      case 'bottom-left':
        return 'left-0 top-full mt-2';
      case 'bottom-right':
        return 'right-0 top-full mt-2';
      case 'top-left':
        return 'left-0 bottom-full mb-2';
      case 'top-right':
        return 'right-0 bottom-full mb-2';
      default:
        return 'left-0 top-full mt-2';
    }
  }

  protected getArrowClasses(): string {
    const pos = this.position();
    switch (pos) {
      case 'bottom-left':
        return '-top-1 left-2 border-l border-t';
      case 'bottom-right':
        return '-top-1 right-2 border-l border-t';
      case 'top-left':
        return '-bottom-1 left-2 border-r border-b';
      case 'top-right':
        return '-bottom-1 right-2 border-r border-b';
      default:
        return '-top-1 left-2 border-l border-t';
    }
  }
}
