import { TestBed } from '@angular/core/testing';
import type { FormConfig } from '../models';
import { FormBuilderService } from './form-builder.service';

describe('FormBuilderService multiple fields', () => {
  it('initializes multiple selection controls with an empty array', () => {
    const service = TestBed.inject(FormBuilderService);
    const config: FormConfig = {
      fields: [
        {
          key: 'genres',
          label: 'Genres',
          type: 'select',
          multiple: true,
        },
      ],
    };

    expect(service.buildForm(config).controls['genres'].value).toEqual([]);
  });
});
