import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { ApiOptionsConfig, SelectOption } from '../models';
import { Observable, of } from 'rxjs';
import { catchError, map, shareReplay } from 'rxjs/operators';

@Injectable({ providedIn: 'root' })
export class OptionsLoaderService {
  private readonly http = inject(HttpClient, { optional: true });
  private cache = new Map<string, Observable<SelectOption[]>>();

  loadOptions(
    config: ApiOptionsConfig,
    formValues: Record<string, any>,
    searchQuery?: string,
    apiConfig?: { baseUrl?: string; headers?: Record<string, string> },
  ): Observable<SelectOption[]> {
    const requestBody = this.buildRequest(config, formValues, searchQuery);
    const cacheKey = this.getCacheKey(config, requestBody, apiConfig);

    // Return cached if available
    if (config.cache !== false && this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)!;
    }

    const request$ = this.makeRequest(config, requestBody, apiConfig).pipe(
      map((response) => this.transformResponse(response, config)),
      shareReplay(1),
      catchError((err) => {
        console.error('Failed to load options:', err);
        return of([]);
      }),
    );

    if (config.cache !== false) {
      this.cache.set(cacheKey, request$);
    }
    return request$;
  }

  private buildRequest(
    config: ApiOptionsConfig,
    formValues: Record<string, any>,
    searchQuery?: string,
  ): any {
    // Use custom transformation if provided
    if (config.transformRequest) {
      return config.transformRequest(searchQuery || '', formValues);
    }

    const request: any = {};

    // Add search query
    if (searchQuery && config.searchParam) {
      request[config.searchParam] = searchQuery;
    }

    // Build filters and flatten them into query params
    const filters = this.buildFilters(config, formValues);

    // For GET requests, flatten filters into individual query params
    // For POST requests, keep as nested filters array
    if (config.method === 'GET') {
      // Flatten filters into query parameters
      filters.forEach((filter) => {
        if (filter.values && Array.isArray(filter.values)) {
          // For 'in' operator with multiple values
          request[filter.field] = filter.values;
        } else if (filter.value !== undefined && filter.value !== null) {
          // For single value filters
          request[filter.field] = filter.value;
        }
      });
    } else {
      // POST requests - keep filters as array
      if (filters.length > 0) {
        request.filters = filters;
      }
    }

    return request;
  }

  private buildFilters(config: ApiOptionsConfig, formValues: Record<string, any>): any[] {
    const filters: any[] = [];

    // Static filters
    if (config.filters) {
      filters.push(
        ...config.filters.map((f) => ({
          field: f.field,
          operator: f.operator,
          value: f.value,
          values: f.values,
        })),
      );
    }

    // Dynamic filters based on form values
    if (config.dynamicFilters) {
      for (const filter of config.dynamicFilters) {
        const value = formValues[filter.valueFrom];

        // Skip if whenNotEmpty is true and value is empty
        if (filter.whenNotEmpty && !value) {
          continue;
        }

        filters.push({
          field: filter.field,
          operator: filter.operator,
          value: value,
        });
      }
    }

    return filters;
  }

  private transformResponse(response: any, config: ApiOptionsConfig): SelectOption[] {
    // Use custom transformation if provided
    if (config.transformResponse) {
      return config.transformResponse(response);
    }

    // Extract data array from response using path
    let data = response;
    if (config.map?.data) {
      data = this.getNestedValue(response, config.map.data);
    }

    if (!Array.isArray(data)) {
      return [];
    }

    // Map to SelectOption format
    const labelPath = config.map?.label || 'label';
    const valuePath = config.map?.value || 'value';

    const options = data.map((item) => {
      const option = {
        label: this.getNestedValue(item, labelPath),
        value: this.getNestedValue(item, valuePath),
        ...item, // Include original data for reference
      };
      return option;
    });

    return options;
  }

  private getNestedValue(obj: any, path: string | string[]): any {
    if (!obj) return '';

    const keys = Array.isArray(path) ? path : path.split('.');
    return keys.reduce((acc, key) => acc?.[key], obj);
  }

  private makeRequest(
    config: ApiOptionsConfig,
    body: any,
    apiConfig?: { baseUrl?: string; headers?: Record<string, string> },
  ): Observable<any> {
    if (!this.http)
      throw new Error('API-backed fields require provideHttpClient() in the application.');
    const baseUrl = config.baseUrl ?? apiConfig?.baseUrl;
    let url = config.url;
    if (baseUrl && !url.startsWith('http://') && !url.startsWith('https://')) {
      url = `${baseUrl}${url.startsWith('/') ? url : '/' + url}`;
    }

    // Prepare headers
    const headers = apiConfig?.headers || {};

    if (config.method === 'POST') {
      return this.http.post(url, body, { headers });
    } else {
      // For GET requests, properly serialize query params
      let params = new HttpParams();

      // Add each parameter individually
      Object.keys(body).forEach((key) => {
        const value = body[key];
        if (value !== undefined && value !== null) {
          if (Array.isArray(value)) {
            // For arrays, add each value separately
            value.forEach((v) => {
              params = params.append(key, String(v));
            });
          } else {
            params = params.set(key, String(value));
          }
        }
      });

      return this.http.get(url, { params, headers });
    }
  }

  private getCacheKey(
    config: ApiOptionsConfig,
    requestBody: unknown,
    apiConfig?: { baseUrl?: string; headers?: Record<string, string> },
  ): string {
    return `${config.url}_${JSON.stringify({ config, requestBody, apiConfig })}`;
  }

  clearCache(url?: string): void {
    if (url) {
      // Clear specific URL cache
      for (const key of this.cache.keys()) {
        if (key.startsWith(url)) {
          this.cache.delete(key);
        }
      }
    } else {
      // Clear all cache
      this.cache.clear();
    }
  }
}
