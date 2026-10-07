import { TestBed } from '@angular/core/testing';
import { SearchInputComponent } from './search-input';

describe('SearchInputComponent', () => {
  it('renders the search icon and an accessible input', async () => {
    await TestBed.configureTestingModule({ imports: [SearchInputComponent] }).compileComponents();

    const fixture = TestBed.createComponent(SearchInputComponent);
    fixture.componentRef.setInput('placeholder', 'Search artists');
    await fixture.whenStable();

    const input = fixture.nativeElement.querySelector('input') as HTMLInputElement;
    expect(fixture.nativeElement.querySelector('hui-icon[aria-label="Search"]')).not.toBeNull();
    expect(input.getAttribute('aria-label')).toBe('Search artists');
  });

  it('updates the form value and emits a search on Enter', async () => {
    await TestBed.configureTestingModule({ imports: [SearchInputComponent] }).compileComponents();

    const fixture = TestBed.createComponent(SearchInputComponent);
    const onChange = vi.fn<(value: string) => void>();
    const searches: string[] = [];
    fixture.componentInstance.registerOnChange(onChange);
    fixture.componentInstance.search.subscribe((value) => searches.push(value));
    await fixture.whenStable();

    const input = fixture.nativeElement.querySelector('input') as HTMLInputElement;
    input.value = 'album';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    await fixture.whenStable();

    expect(onChange).toHaveBeenCalledWith('album');
    expect(searches).toEqual(['album']);
  });

  it('clears the value, emits both events, and restores input focus', async () => {
    await TestBed.configureTestingModule({ imports: [SearchInputComponent] }).compileComponents();

    const fixture = TestBed.createComponent(SearchInputComponent);
    const onChange = vi.fn<(value: string) => void>();
    const searches: string[] = [];
    const cleared = vi.fn();
    fixture.componentInstance.registerOnChange(onChange);
    fixture.componentInstance.search.subscribe((value) => searches.push(value));
    fixture.componentInstance.cleared.subscribe(cleared);
    fixture.componentInstance.writeValue('artist');
    await fixture.whenStable();

    const clearButton = fixture.nativeElement.querySelector(
      'button[aria-label="Clear search"]',
    ) as HTMLButtonElement;
    clearButton.click();
    await fixture.whenStable();

    const input = fixture.nativeElement.querySelector('input') as HTMLInputElement;
    expect(onChange).toHaveBeenCalledWith('');
    expect(searches).toEqual(['']);
    expect(cleared).toHaveBeenCalledOnce();
    expect(document.activeElement).toBe(input);
    expect(clearButton.isConnected).toBe(false);
  });
});
