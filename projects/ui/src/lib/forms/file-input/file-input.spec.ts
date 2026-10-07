import { TestBed } from '@angular/core/testing';
import { FileInputComponent } from './file-input';

describe('FileInputComponent', () => {
  it('removes a selected file before the value is submitted', async () => {
    const fixture = TestBed.createComponent(FileInputComponent);
    const component = fixture.componentInstance;
    const first = new File(['first'], 'first.mp3', { type: 'audio/mpeg' });
    const second = new File(['second'], 'second.mp3', { type: 'audio/mpeg' });
    const valueChanged = vi.fn<(files: File[]) => void>();
    component.registerOnChange(valueChanged);
    component.writeValue([first, second]);
    await fixture.whenStable();

    const root = fixture.nativeElement as HTMLElement;
    const removeButton = root.querySelector<HTMLButtonElement>(
      'button[aria-label="Remove first.mp3"]',
    );
    removeButton?.click();
    await fixture.whenStable();

    expect(removeButton).not.toBeNull();
    expect(valueChanged).toHaveBeenLastCalledWith([second]);
    expect(root.textContent).not.toContain('first.mp3');
    expect(root.textContent).toContain('second.mp3');
  });
});
