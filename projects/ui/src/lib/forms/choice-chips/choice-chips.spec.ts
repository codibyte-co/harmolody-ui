import { TestBed } from '@angular/core/testing';
import type { SelectOption } from '../../form-builder/models';
import { ChoiceChipsComponent, type ChoiceChipsValue } from './choice-chips';

const OPTIONS: SelectOption[] = [
  { label: 'First option', value: 'first' },
  { label: 'Second option', value: 2 },
  { label: 'Unavailable option', value: 'disabled', disabled: true },
];

describe('ChoiceChipsComponent', () => {
  it('selects one option with native radio semantics', async () => {
    const fixture = TestBed.createComponent(ChoiceChipsComponent);
    fixture.componentRef.setInput('options', OPTIONS);
    const onChange = vi.fn<(value: ChoiceChipsValue) => void>();
    fixture.componentInstance.registerOnChange(onChange);
    await fixture.whenStable();

    const group = fixture.nativeElement.querySelector('[role="radiogroup"]') as HTMLElement;
    const inputs = group.querySelectorAll('input[type="radio"]') as NodeListOf<HTMLInputElement>;
    inputs[1].click();
    await fixture.whenStable();

    expect(onChange).toHaveBeenCalledWith(2);
    expect(inputs[1].checked).toBe(true);
    expect(inputs[0].checked).toBe(false);
  });

  it('toggles multiple selected options and ignores disabled options', async () => {
    const fixture = TestBed.createComponent(ChoiceChipsComponent);
    fixture.componentRef.setInput('multiple', true);
    fixture.componentRef.setInput('options', OPTIONS);
    fixture.componentInstance.writeValue(['first']);
    const onChange = vi.fn<(value: ChoiceChipsValue) => void>();
    fixture.componentInstance.registerOnChange(onChange);
    await fixture.whenStable();

    const group = fixture.nativeElement.querySelector('[role="group"]') as HTMLElement;
    const inputs = group.querySelectorAll('input[type="checkbox"]') as NodeListOf<HTMLInputElement>;
    inputs[1].click();
    inputs[2].click();
    await fixture.whenStable();

    expect(onChange).toHaveBeenLastCalledWith(['first', 2]);
    expect(inputs[0].checked).toBe(true);
    expect(inputs[1].checked).toBe(true);
    expect(inputs[2].checked).toBe(false);
  });

  it('supports inline and wrapping layouts', async () => {
    const fixture = TestBed.createComponent(ChoiceChipsComponent);
    fixture.componentRef.setInput('options', OPTIONS);
    fixture.componentRef.setInput('layout', 'inline');
    await fixture.whenStable();

    const group = fixture.nativeElement.querySelector('[role="radiogroup"]') as HTMLElement;
    expect(group.classList.contains('flex-nowrap')).toBe(true);
    expect(group.classList.contains('overflow-x-auto')).toBe(true);

    fixture.componentRef.setInput('layout', 'wrap');
    await fixture.whenStable();

    expect(group.classList.contains('flex-wrap')).toBe(true);
  });
});
