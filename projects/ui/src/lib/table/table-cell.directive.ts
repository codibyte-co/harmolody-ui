import { Directive, inject, input, TemplateRef } from '@angular/core';
import { TableCellContext } from './table.model';

@Directive({
  selector: 'ng-template[huiTableCell]',
})
export class TableCellDirective<T = unknown> {
  readonly columnKey = input.required<string>({ alias: 'huiTableCell' });
  readonly templateRef = inject(TemplateRef<TableCellContext<T>>);
}
