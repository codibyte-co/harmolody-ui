import { TestBed } from '@angular/core/testing';
import { HARMOLODY_MEDIA_SELECTOR, provideHarmolodyUi } from './ui-config';
import { LocalizationService } from './ui-localization';

describe('Portable application adapters', () => {
  it('renders labels and interpolates parameters without app localization', () => {
    const localization = TestBed.inject(LocalizationService);
    expect(localization.translate('Showing {count} artists', { count: 3 })).toBe(
      'Showing 3 artists',
    );
    expect(localization.translate(undefined)).toBe('');
  });

  it('delegates localization and media picking to the host', async () => {
    const selectMedia = vi.fn().mockResolvedValue('/cover.jpg');
    TestBed.configureTestingModule({
      providers: [
        provideHarmolodyUi({
          translate: (text) => `translated:${text}`,
          selectMedia,
        }),
      ],
    });
    expect(TestBed.inject(LocalizationService).translate('Save')).toBe('translated:Save');
    const select = TestBed.inject(HARMOLODY_MEDIA_SELECTOR)!;
    expect(await select({ mediaType: 'Cover', allowUpload: false, selectionMode: 'single' })).toBe(
      '/cover.jpg',
    );
  });
});
