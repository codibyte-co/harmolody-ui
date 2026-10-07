import { TestBed } from '@angular/core/testing';
import { SelectComponent, SelectControlValue, SelectOption } from './select';

const OPTIONS: SelectOption[] = [
  { label: 'First option', value: 'first' },
  { label: 'Second option', value: 2 },
  { label: 'Unavailable option', value: 'disabled', disabled: true },
];

const originalInnerHeight = window.innerHeight;

afterEach(() => {
  Object.defineProperty(window, 'innerHeight', {
    configurable: true,
    value: originalInnerHeight,
  });
});

describe('SelectComponent', () => {
  it('renders and updates a single selected value', async () => {
    await TestBed.configureTestingModule({ imports: [SelectComponent] }).compileComponents();

    const fixture = TestBed.createComponent(SelectComponent);
    fixture.componentRef.setInput('options', OPTIONS);
    fixture.componentInstance.writeValue(2);
    const onChange = vi.fn<(value: SelectControlValue) => void>();
    fixture.componentInstance.registerOnChange(onChange);
    await fixture.whenStable();

    const trigger = fixture.nativeElement.querySelector('[role="combobox"]') as HTMLButtonElement;
    expect(trigger.textContent).toContain('Second option');

    trigger.click();
    await fixture.whenStable();

    const options = fixture.nativeElement.querySelectorAll(
      '[role="option"]',
    ) as NodeListOf<HTMLButtonElement>;
    expect(options[1].getAttribute('aria-selected')).toBe('true');

    options[0].click();
    await fixture.whenStable();

    expect(onChange).toHaveBeenCalledWith('first');
    expect(fixture.nativeElement.querySelector('[role="listbox"]')).toBeNull();
    expect(trigger.textContent).toContain('First option');
  });

  it('supports multiple selection without rendering checkbox inputs', async () => {
    await TestBed.configureTestingModule({ imports: [SelectComponent] }).compileComponents();

    const fixture = TestBed.createComponent(SelectComponent);
    fixture.componentRef.setInput('multiple', true);
    fixture.componentRef.setInput('options', OPTIONS);
    fixture.componentInstance.writeValue(['first']);
    const onChange = vi.fn<(value: SelectControlValue) => void>();
    fixture.componentInstance.registerOnChange(onChange);
    await fixture.whenStable();

    const trigger = fixture.nativeElement.querySelector('[role="combobox"]') as HTMLButtonElement;
    trigger.click();
    await fixture.whenStable();

    const listbox = fixture.nativeElement.querySelector('[role="listbox"]') as HTMLElement;
    const options = listbox.querySelectorAll('[role="option"]') as NodeListOf<HTMLButtonElement>;
    expect(listbox.getAttribute('aria-multiselectable')).toBe('true');
    expect(listbox.querySelector('input[type="checkbox"]')).toBeNull();

    options[1].click();
    await fixture.whenStable();

    expect(onChange).toHaveBeenCalledWith(['first', 2]);
    expect(fixture.nativeElement.querySelector('[role="listbox"]')).not.toBeNull();
    expect(trigger.textContent).toContain('2 items selected');
  });

  it('supports keyboard selection and skips disabled options', async () => {
    await TestBed.configureTestingModule({ imports: [SelectComponent] }).compileComponents();

    const fixture = TestBed.createComponent(SelectComponent);
    fixture.componentRef.setInput('options', OPTIONS);
    const onChange = vi.fn<(value: SelectControlValue) => void>();
    fixture.componentInstance.registerOnChange(onChange);
    await fixture.whenStable();

    const trigger = fixture.nativeElement.querySelector('[role="combobox"]') as HTMLButtonElement;
    trigger.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp', bubbles: true }));
    await fixture.whenStable();

    expect(trigger.getAttribute('aria-activedescendant')).toContain('option-1');

    trigger.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    await fixture.whenStable();

    expect(onChange).toHaveBeenCalledWith(2);
    expect(trigger.textContent).toContain('Second option');
  });

  it('treats an unmatched empty form value as the placeholder', async () => {
    await TestBed.configureTestingModule({ imports: [SelectComponent] }).compileComponents();

    const fixture = TestBed.createComponent(SelectComponent);
    fixture.componentRef.setInput('options', OPTIONS);
    fixture.componentRef.setInput('placeholder', 'Choose one');
    fixture.componentInstance.writeValue('');
    await fixture.whenStable();

    const trigger = fixture.nativeElement.querySelector('[role="combobox"]') as HTMLButtonElement;
    expect(trigger.textContent).toContain('Choose one');
  });

  it('defaults to a left-aligned trigger-width dropdown and pins the chevron to the end', async () => {
    await TestBed.configureTestingModule({ imports: [SelectComponent] }).compileComponents();

    const fixture = TestBed.createComponent(SelectComponent);
    fixture.componentRef.setInput('options', OPTIONS);
    await fixture.whenStable();

    const trigger = fixture.nativeElement.querySelector('[role="combobox"]') as HTMLButtonElement;
    expect(trigger.classList.contains('pr-3')).toBe(true);
    expect((trigger.lastElementChild as HTMLElement).classList.contains('ml-auto')).toBe(true);
    expect(trigger.style.minWidth).toBe('12rem');

    trigger.click();
    await fixture.whenStable();

    const listbox = fixture.nativeElement.querySelector('[role="listbox"]') as HTMLElement;
    expect(listbox.classList.contains('left-0')).toBe(true);
    expect(listbox.classList.contains('w-full')).toBe(true);
  });

  it('allows the default minimum width to be overridden', async () => {
    await TestBed.configureTestingModule({ imports: [SelectComponent] }).compileComponents();

    const fixture = TestBed.createComponent(SelectComponent);
    fixture.componentRef.setInput('minWidth', '9rem');
    await fixture.whenStable();

    const trigger = fixture.nativeElement.querySelector('[role="combobox"]') as HTMLButtonElement;
    expect(trigger.style.minWidth).toBe('9rem');
  });

  it('can right-align a content-width dropdown', async () => {
    await TestBed.configureTestingModule({ imports: [SelectComponent] }).compileComponents();

    const fixture = TestBed.createComponent(SelectComponent);
    fixture.componentRef.setInput('options', OPTIONS);
    fixture.componentRef.setInput('dropdownAlign', 'right');
    fixture.componentRef.setInput('dropdownWidth', 'content');
    await fixture.whenStable();

    (fixture.nativeElement.querySelector('[role="combobox"]') as HTMLButtonElement).click();
    await fixture.whenStable();

    const listbox = fixture.nativeElement.querySelector('[role="listbox"]') as HTMLElement;
    expect(listbox.classList.contains('right-0')).toBe(true);
    expect(listbox.classList.contains('w-max')).toBe(true);
    expect(listbox.classList.contains('min-w-full')).toBe(true);
  });

  it('flips above the trigger and limits its height when the bottom viewport is constrained', async () => {
    await TestBed.configureTestingModule({ imports: [SelectComponent] }).compileComponents();

    Object.defineProperty(window, 'innerHeight', { configurable: true, value: 320 });
    const fixture = TestBed.createComponent(SelectComponent);
    fixture.componentRef.setInput('options', OPTIONS);
    await fixture.whenStable();

    const trigger = fixture.nativeElement.querySelector('[role="combobox"]') as HTMLButtonElement;
    vi.spyOn(trigger, 'getBoundingClientRect').mockReturnValue({
      bottom: 260,
      height: 40,
      left: 20,
      right: 220,
      top: 220,
      width: 200,
      x: 20,
      y: 220,
      toJSON: () => ({}),
    });
    trigger.click();
    await fixture.whenStable();

    const listbox = fixture.nativeElement.querySelector('[role="listbox"]') as HTMLElement;
    const header = listbox.firstElementChild as HTMLElement;
    const optionsViewport = listbox.lastElementChild as HTMLElement;
    vi.spyOn(header, 'getBoundingClientRect').mockReturnValue({
      bottom: 44,
      height: 44,
      left: 0,
      right: 200,
      top: 0,
      width: 200,
      x: 0,
      y: 0,
      toJSON: () => ({}),
    });
    Object.defineProperty(optionsViewport, 'scrollHeight', { configurable: true, value: 240 });

    window.dispatchEvent(new Event('resize'));
    await new Promise((resolve) => setTimeout(resolve));
    fixture.detectChanges();

    expect(listbox.getAttribute('data-placement')).toBe('top');
    expect(listbox.classList.contains('bottom-full')).toBe(true);
    expect(optionsViewport.style.maxHeight).toBe('160px');
  });

  it('uses the clipping container viewport instead of the browser viewport', async () => {
    await TestBed.configureTestingModule({ imports: [SelectComponent] }).compileComponents();

    Object.defineProperty(window, 'innerHeight', { configurable: true, value: 900 });
    const fixture = TestBed.createComponent(SelectComponent);
    fixture.componentRef.setInput('options', OPTIONS);
    await fixture.whenStable();

    const container = fixture.nativeElement as HTMLElement;
    container.style.overflowY = 'hidden';
    vi.spyOn(container, 'getBoundingClientRect').mockReturnValue({
      bottom: 300,
      height: 200,
      left: 0,
      right: 400,
      top: 100,
      width: 400,
      x: 0,
      y: 100,
      toJSON: () => ({}),
    });
    Object.defineProperty(container, 'clientHeight', { configurable: true, value: 200 });

    const trigger = fixture.nativeElement.querySelector('[role="combobox"]') as HTMLButtonElement;
    vi.spyOn(trigger, 'getBoundingClientRect').mockReturnValue({
      bottom: 260,
      height: 40,
      left: 20,
      right: 220,
      top: 220,
      width: 200,
      x: 20,
      y: 220,
      toJSON: () => ({}),
    });
    trigger.click();
    await fixture.whenStable();

    const listbox = fixture.nativeElement.querySelector('[role="listbox"]') as HTMLElement;
    const header = listbox.firstElementChild as HTMLElement;
    const optionsViewport = listbox.lastElementChild as HTMLElement;
    vi.spyOn(header, 'getBoundingClientRect').mockReturnValue({
      bottom: 44,
      height: 44,
      left: 0,
      right: 200,
      top: 0,
      width: 200,
      x: 0,
      y: 0,
      toJSON: () => ({}),
    });
    Object.defineProperty(optionsViewport, 'scrollHeight', { configurable: true, value: 240 });

    window.dispatchEvent(new Event('resize'));
    await new Promise((resolve) => setTimeout(resolve));
    fixture.detectChanges();

    expect(listbox.getAttribute('data-placement')).toBe('top');
    expect(listbox.classList.contains('bottom-full')).toBe(true);
    expect(optionsViewport.style.maxHeight).toBe('60px');
  });

  it('keeps the default bottom placement when the viewport has enough space', async () => {
    await TestBed.configureTestingModule({ imports: [SelectComponent] }).compileComponents();

    Object.defineProperty(window, 'innerHeight', { configurable: true, value: 600 });
    const fixture = TestBed.createComponent(SelectComponent);
    fixture.componentRef.setInput('options', OPTIONS);
    await fixture.whenStable();

    const trigger = fixture.nativeElement.querySelector('[role="combobox"]') as HTMLButtonElement;
    vi.spyOn(trigger, 'getBoundingClientRect').mockReturnValue({
      bottom: 80,
      height: 40,
      left: 20,
      right: 220,
      top: 40,
      width: 200,
      x: 20,
      y: 40,
      toJSON: () => ({}),
    });
    trigger.click();
    await fixture.whenStable();

    const listbox = fixture.nativeElement.querySelector('[role="listbox"]') as HTMLElement;
    const header = listbox.firstElementChild as HTMLElement;
    const optionsViewport = listbox.lastElementChild as HTMLElement;
    vi.spyOn(header, 'getBoundingClientRect').mockReturnValue({
      bottom: 44,
      height: 44,
      left: 0,
      right: 200,
      top: 0,
      width: 200,
      x: 0,
      y: 0,
      toJSON: () => ({}),
    });
    Object.defineProperty(optionsViewport, 'scrollHeight', { configurable: true, value: 240 });

    window.dispatchEvent(new Event('resize'));
    await new Promise((resolve) => setTimeout(resolve));
    fixture.detectChanges();

    expect(listbox.getAttribute('data-placement')).toBe('bottom');
    expect(listbox.classList.contains('top-full')).toBe(true);
    expect(optionsViewport.style.maxHeight).toBe('240px');
  });
});
