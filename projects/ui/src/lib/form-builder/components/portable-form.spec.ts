import { TestBed } from '@angular/core/testing';
import { DynamicFormComponent } from './dynamic-form';
import type { FormConfig } from '../models';

describe('Portable dynamic form', () => {
  it('validates conditional required fields when they become visible again', async () => {
    const fixture = TestBed.createComponent(DynamicFormComponent);
    fixture.componentRef.setInput('config', {
      fields: [
        { key: 'enabled', label: 'Enabled', type: 'switch', defaultValue: false },
        {
          key: 'name',
          label: 'Name',
          type: 'text',
          required: true,
          showWhen: { field: 'enabled', operator: 'eq', value: true },
        },
      ],
    } satisfies FormConfig);
    await fixture.whenStable();
    expect(fixture.componentInstance.validate()).toBe(true);
    fixture.componentInstance.setFieldValue('enabled', true);
    await fixture.whenStable();
    expect(fixture.componentInstance.validate()).toBe(false);
    fixture.componentInstance.setFieldValue('name', 'May');
    expect(fixture.componentInstance.validate()).toBe(true);
  });

  it('blocks repeat submissions until the consumer finishes and preserves disabled fields', async () => {
    const fixture = TestBed.createComponent(DynamicFormComponent);
    fixture.componentRef.setInput('config', {
      fields: [{ key: 'id', label: 'ID', type: 'text', disabled: true, defaultValue: 'artist-1' }],
    } satisfies FormConfig);
    await fixture.whenStable();
    const submitted = vi.fn();
    fixture.componentInstance.formSubmit.subscribe(submitted);
    const form = (fixture.nativeElement as HTMLElement).querySelector('form')!;
    form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    expect(submitted).toHaveBeenCalledTimes(1);
    expect(submitted).toHaveBeenCalledWith({ id: 'artist-1' });
    fixture.componentInstance.finishSubmit();
    await fixture.whenStable();
    expect((fixture.nativeElement as HTMLElement).querySelector('input')!.disabled).toBe(true);
    form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    expect(submitted).toHaveBeenCalledTimes(2);
  });
});
