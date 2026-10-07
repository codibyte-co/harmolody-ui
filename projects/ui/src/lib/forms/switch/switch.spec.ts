import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SwitchComponent } from './switch';

describe('SwitchComponent', () => {
  let fixture: ComponentFixture<SwitchComponent>;

  beforeEach(() => {
    fixture = TestBed.createComponent(SwitchComponent);
  });

  it('exposes switch semantics and toggles its form value', async () => {
    const onChange = vi.fn();
    fixture.componentInstance.registerOnChange(onChange);
    fixture.componentInstance.writeValue(false);
    await fixture.whenStable();

    const button = fixture.nativeElement.querySelector('[role="switch"]') as HTMLButtonElement;
    expect(button.getAttribute('aria-checked')).toBe('false');

    button.click();
    await fixture.whenStable();

    expect(button.getAttribute('aria-checked')).toBe('true');
    expect(onChange).toHaveBeenCalledWith(true);
  });

  it('does not toggle while disabled', async () => {
    const onChange = vi.fn();
    fixture.componentInstance.registerOnChange(onChange);
    fixture.componentInstance.setDisabledState(true);
    await fixture.whenStable();

    const button = fixture.nativeElement.querySelector('[role="switch"]') as HTMLButtonElement;
    button.click();
    await fixture.whenStable();

    expect(onChange).not.toHaveBeenCalled();
    expect(button.getAttribute('aria-checked')).toBe('false');
  });
});
