import { TestBed } from '@angular/core/testing';
import { DynamicFormComponent } from './dynamic-form';
import type { FormConfig } from '../models';

describe('DynamicFormComponent initial values', () => {
  it('aligns default dialog actions to the end and retains cancel/reset/submit behavior', async () => {
    const fixture = TestBed.createComponent(DynamicFormComponent);
    fixture.componentRef.setInput('config', {
      fields: [{ key: 'name', label: 'Name', type: 'text' }],
      submitButton: { label: 'Create mapping' },
    } satisfies FormConfig);
    fixture.componentRef.setInput('initialValues', { name: 'Original' });
    await fixture.whenStable();
    const buttons = Array.from((fixture.nativeElement as HTMLElement).querySelectorAll('button'));
    expect(buttons.map((button) => button.textContent?.trim())).toEqual([
      'Cancel',
      'Reset',
      'Create mapping',
    ]);
    expect(buttons[0].parentElement?.classList.contains('justify-end')).toBe(true);
    expect(buttons.every((button) => button.querySelector('hui-icon'))).toBe(true);
    const cancel = vi.fn();
    fixture.componentInstance.cancel.subscribe(cancel);
    buttons[0].click();
    expect(cancel).toHaveBeenCalledOnce();
    fixture.componentInstance.setFieldValue('name', 'Edited');
    buttons[1].click();
    expect(fixture.componentInstance.getRawValue<{ name: string | null }>().name).toBeNull();
    fixture.destroy();
  });
  it('creates form-array controls for initial relationship rows', async () => {
    const fixture = TestBed.createComponent(DynamicFormComponent);
    const config: FormConfig = {
      fields: [
        {
          key: 'genres',
          label: 'Genres',
          type: 'array',
          arrayFields: [{ key: 'genreId', label: 'Genre', type: 'text', required: true }],
        },
      ],
      showCancelButton: { hidden: true },
      resetButton: { label: 'Reset', hidden: true },
      submitButton: { label: 'Submit', hidden: true },
    };
    fixture.componentRef.setInput('config', config);
    fixture.componentRef.setInput('initialValues', {
      genres: [{ genreId: 'genre-1' }, { genreId: 'genre-2' }],
    });

    await fixture.whenStable();

    expect(fixture.componentInstance.getRawValue<{ genres: Array<{ genreId: string }> }>()).toEqual(
      {
        genres: [{ genreId: 'genre-1' }, { genreId: 'genre-2' }],
      },
    );
    expect(fixture.componentInstance.validate()).toBe(true);
  });

  it('hides the built-in cancel button when custom actions are configured', async () => {
    const fixture = TestBed.createComponent(DynamicFormComponent);
    const config: FormConfig = {
      fields: [{ key: 'query', label: 'Query', type: 'text' }],
      actions: [
        {
          key: 'apply',
          label: 'Apply filters',
          type: 'button',
          icon: 'search',
        },
      ],
    };
    fixture.componentRef.setInput('config', config);

    await fixture.whenStable();

    const element = fixture.nativeElement as HTMLElement;
    const buttonLabels = Array.from(element.querySelectorAll('button')).map((button) =>
      button.textContent?.trim(),
    );
    expect(buttonLabels).toEqual(['Apply filters']);
  });

  it('adds controls from a later config without losing existing values', async () => {
    const fixture = TestBed.createComponent(DynamicFormComponent);
    fixture.componentRef.setInput('config', {
      fields: [{ key: 'templateId', label: 'Template', type: 'text' }],
      showCancelButton: { hidden: true },
      submitButton: { label: 'Submit', hidden: true },
    } satisfies FormConfig);
    fixture.componentRef.setInput('initialValues', { templateId: 'template-1' });
    await fixture.whenStable();

    fixture.componentRef.setInput('config', {
      fields: [
        { key: 'templateId', label: 'Template', type: 'text' },
        { key: 'artistName', label: 'Artist name', type: 'text', defaultValue: 'May' },
      ],
      showCancelButton: { hidden: true },
      submitButton: { label: 'Submit', hidden: true },
    } satisfies FormConfig);
    await fixture.whenStable();

    expect(
      fixture.componentInstance.getRawValue<{ templateId: string; artistName: string }>(),
    ).toEqual({ templateId: 'template-1', artistName: 'May' });
  });
});
