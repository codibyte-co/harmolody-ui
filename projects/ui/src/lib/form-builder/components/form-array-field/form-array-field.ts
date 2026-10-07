import {
  Component,
  computed,
  effect,
  inject,
  input,
  signal,
  ChangeDetectionStrategy,
} from '@angular/core';
import { FormArray, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { FieldConfig } from '../../models';
import { FormBuilderService } from '../../services';
import { FormHelperComponent } from '../../../forms/form-helper/form-helper';
import { IconComponent } from '../../../icon';
import { LocalizationService } from '../../../config/ui-localization';
import { FormArrayItemComponent } from './form-array-item';

@Component({
  selector: 'hui-form-array-field',
  templateUrl: './form-array-field.html',
  styleUrls: ['./form-array-field.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, IconComponent, FormArrayItemComponent, FormHelperComponent],
})
export class FormArrayFieldComponent {
  field = input.required<FieldConfig>();
  form = input.required<FormGroup>();
  fieldLayout = input<'column' | 'row' | 'stacked'>('column');
  apiConfig = input<{ baseUrl?: string; headers?: Record<string, string> }>();
  validationStrategy = input<'touched' | 'submit'>('touched');
  formSubmitted = input<boolean>(false);

  private readonly formBuilder = inject(FormBuilderService);
  protected readonly localization = inject(LocalizationService);

  protected readonly expandedItems = signal<Set<number>>(new Set([0])); // First item expanded by default
  protected readonly arrayLength = signal<number>(0);

  protected readonly formArray = computed(() => {
    return this.form().get(this.field().key) as FormArray;
  });

  protected readonly items = computed(() => {
    const length = this.arrayLength();
    return Array.from({ length }, (_, i) => i);
  });

  constructor() {
    // Sync array length whenever the form or field changes
    effect(() => {
      const array = this.formArray();
      if (array) {
        this.arrayLength.set(array.length);
      }
    });
  }

  protected readonly canAddMore = computed(() => {
    const field = this.field();
    const maxItems = field.maxItems;
    const currentLength = this.arrayLength();
    return maxItems === undefined || currentLength < maxItems;
  });

  protected readonly canRemove = computed(() => {
    const field = this.field();
    const minItems = field.minItems || 0;
    const currentLength = this.arrayLength();
    const canRemoveAll = field.canRemoveAll !== false;

    if (!canRemoveAll && currentLength === 1) {
      return false;
    }

    return currentLength > minItems;
  });

  protected readonly addButtonLabel = computed(() => {
    return this.localization.translate(this.field().addButtonLabel || 'Add Item');
  });

  protected readonly removeButtonLabel = computed(() => {
    return this.localization.translate(this.field().removeButtonLabel || 'Remove');
  });

  protected readonly itemLabel = computed(() => {
    return (index: number): string => {
      const template = this.field().itemLabel || 'Item {index}';
      return this.localization
        .translate(template, { index: index + 1 })
        .replace('{index}', String(index + 1));
    };
  });

  protected getItemGroup(index: number): FormGroup {
    const array = this.formArray();
    return array.at(index) as FormGroup;
  }

  protected addItem(): void {
    if (!this.canAddMore()) return;

    const field = this.field();
    const array = this.formArray();

    if (!field.arrayFields || !array) return;

    const newGroup = this.formBuilder.createFormGroupFromFields(field.arrayFields);
    array.push(newGroup);

    // Update length signal
    this.arrayLength.set(array.length);

    // Expand the newly added item
    const newIndex = array.length - 1;
    this.expandedItems.update((set) => {
      set.add(newIndex);
      return new Set(set);
    });
  }

  protected removeItem(index: number): void {
    if (!this.canRemove()) return;

    const array = this.formArray();
    if (!array) return;

    array.removeAt(index);
    this.arrayLength.set(array.length);

    // Update expanded items indices
    this.expandedItems.update((set) => {
      const newSet = new Set<number>();
      set.forEach((i) => {
        if (i < index) {
          newSet.add(i);
        } else if (i > index) {
          newSet.add(i - 1);
        }
      });
      return newSet;
    });
  }

  protected toggleItem(index: number): void {
    this.expandedItems.update((set) => {
      const newSet = new Set(set);
      if (newSet.has(index)) {
        newSet.delete(index);
      } else {
        newSet.add(index);
      }
      return newSet;
    });
  }

  protected isExpanded(index: number): boolean {
    return this.expandedItems().has(index);
  }

  protected getArrayLayoutClass(): string {
    const field = this.field();
    const layout = field.arrayLayout || 'vertical';
    const columns = field.arrayColumns || 1;

    if (layout === 'grid' && columns > 1) {
      return [
        'grid gap-2 grid-cols-1 md:grid-cols-1',
        'grid gap-2 grid-cols-1 md:grid-cols-2',
        'grid gap-2 grid-cols-1 md:grid-cols-3',
      ][Math.max(1, Math.min(columns, 3)) - 1];
    }

    return 'space-y-4';
  }
}
