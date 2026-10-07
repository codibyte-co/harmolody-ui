import { TestBed } from '@angular/core/testing';
import { FormControl, FormGroup } from '@angular/forms';
import { By } from '@angular/platform-browser';
import { DynamicFieldComponent } from './dynamic-field';
import type { FieldConfig } from '../../models';
import { SelectComponent } from '../../../forms/select/select';

const OPTIONS = [
  { label: 'Pop', value: 'pop' },
  { label: 'Rock', value: 'rock' },
];

describe('DynamicFieldComponent choice presentation', () => {
  it('renders a wrapping multi-select chip group and updates the form value', async () => {
    const fixture = TestBed.createComponent(DynamicFieldComponent);
    const form = new FormGroup({ genres: new FormControl<string[]>([]) });
    const field: FieldConfig = {
      key: 'genres',
      label: 'Genres',
      type: 'select',
      optionPresentation: 'chips',
      chipLayout: 'wrap',
      multiple: true,
      options: OPTIONS,
    };
    fixture.componentRef.setInput('field', field);
    fixture.componentRef.setInput('form', form);
    await fixture.whenStable();

    const group = fixture.nativeElement.querySelector('[role="group"]') as HTMLElement;
    const inputs = group.querySelectorAll('input[type="checkbox"]') as NodeListOf<HTMLInputElement>;
    inputs[0].click();
    inputs[1].click();
    await fixture.whenStable();

    expect(group.classList.contains('flex-wrap')).toBe(true);
    expect(form.controls.genres.value).toEqual(['pop', 'rock']);
  });

  it('passes multiple selection through to the dropdown presentation', async () => {
    const fixture = TestBed.createComponent(DynamicFieldComponent);
    const form = new FormGroup({ genres: new FormControl<string[]>([]) });
    const field: FieldConfig = {
      key: 'genres',
      label: 'Genres',
      type: 'select',
      multiple: true,
      options: OPTIONS,
    };
    fixture.componentRef.setInput('field', field);
    fixture.componentRef.setInput('form', form);
    await fixture.whenStable();

    const select = fixture.debugElement.query(By.directive(SelectComponent))
      .componentInstance as SelectComponent;

    expect(select.multiple()).toBe(true);
  });
});
