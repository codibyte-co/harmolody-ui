import { InjectionToken, makeEnvironmentProviders, type EnvironmentProviders } from '@angular/core';
import type { SvgIcon } from '../icon/icons';

export type UiTranslator = (text: string, parameters?: Record<string, string | number>) => string;

export interface MediaSelectorRequest {
  mediaType: string;
  allowUpload: boolean;
  selectionMode: 'single' | 'multiple';
}

export type MediaSelector = (request: MediaSelectorRequest) => Promise<string | null | undefined>;

export interface HarmolodyUiConfig {
  translate?: UiTranslator;
  icons?: Record<string, SvgIcon>;
  selectMedia?: MediaSelector;
}

export const HARMOLODY_UI_CONFIG = new InjectionToken<HarmolodyUiConfig>('Harmolody UI config', {
  providedIn: 'root',
  factory: () => ({}),
});

export const HARMOLODY_MEDIA_SELECTOR = new InjectionToken<MediaSelector | null>(
  'Harmolody media selector',
  { providedIn: 'root', factory: () => null },
);

export function provideHarmolodyUi(config: HarmolodyUiConfig = {}): EnvironmentProviders {
  return makeEnvironmentProviders([
    { provide: HARMOLODY_UI_CONFIG, useValue: config },
    { provide: HARMOLODY_MEDIA_SELECTOR, useValue: config.selectMedia ?? null },
  ]);
}
