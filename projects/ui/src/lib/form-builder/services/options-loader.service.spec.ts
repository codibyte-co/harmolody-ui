import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import type { ApiOptionsConfig } from '../models';
import { OptionsLoaderService } from './options-loader.service';

describe('OptionsLoaderService', () => {
  let service: OptionsLoaderService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(OptionsLoaderService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('reloads uncached options whose eligibility can change between requests', () => {
    const config: ApiOptionsConfig = {
      url: '/users',
      method: 'GET',
      cache: false,
      map: { label: 'name', value: 'id' },
    };

    service.loadOptions(config, {}).subscribe();
    http.expectOne('/users').flush([{ id: 'user-1', name: 'First User' }]);

    service.loadOptions(config, {}).subscribe();
    http.expectOne('/users').flush([{ id: 'user-2', name: 'Second User' }]);
  });

  it('uses a field-level base URL instead of the form-level service URL', () => {
    const config: ApiOptionsConfig = {
      url: '/admin/users',
      method: 'GET',
      baseUrl: '/v2',
    };

    service
      .loadOptions(config, {}, undefined, { baseUrl: '/notification-service/api/v1' })
      .subscribe();

    http.expectOne('/v2/admin/users').flush([]);
  });
});
