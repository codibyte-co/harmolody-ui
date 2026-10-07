import { TestBed } from '@angular/core/testing';
import { TableColumnSelectorComponent } from './table-column-selector';

describe('Column selector', () => {
  it('keeps pinned columns during select-all, deselect-all, and reset', async () => {
    const fixture = TestBed.createComponent(TableColumnSelectorComponent);
    fixture.componentRef.setInput('allColumns', [
      { key: 'id', label: 'ID', hideable: false },
      { key: 'name', label: 'Name' },
      { key: 'email', label: 'Email' },
    ]);
    fixture.componentRef.setInput('visibleColumnKeys', ['id', 'name']);
    await fixture.whenStable();
    const changed = vi.fn();
    fixture.componentInstance.visibleColumnsChange.subscribe(changed);
    (fixture.nativeElement as HTMLElement).querySelector('button')!.click();
    await fixture.whenStable();
    const buttons = Array.from((fixture.nativeElement as HTMLElement).querySelectorAll('button'));
    buttons.find((button) => button.textContent?.includes('Select All'))!.click();
    expect(changed).toHaveBeenLastCalledWith(['id', 'name', 'email']);
    buttons.find((button) => button.textContent?.includes('Deselect All'))!.click();
    expect(changed).toHaveBeenLastCalledWith(['id']);
    buttons.find((button) => button.textContent?.includes('Reset'))!.click();
    expect(changed).toHaveBeenLastCalledWith(['id', 'name', 'email']);
  });
});
