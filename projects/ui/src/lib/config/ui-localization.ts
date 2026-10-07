import { Injectable, inject } from '@angular/core';
import { HARMOLODY_UI_CONFIG } from './ui-config';

@Injectable({ providedIn: 'root' })
export class LocalizationService {
  private readonly config = inject(HARMOLODY_UI_CONFIG);

  translate(text: string | null | undefined, parameters?: Record<string, string | number>): string {
    if (!text) return '';
    if (this.config.translate) return this.config.translate(text, parameters);
    return text.replace(/\{([^}]+)\}/g, (placeholder: string, key: string) =>
      parameters?.[key] === undefined ? placeholder : String(parameters[key]),
    );
  }
}
