import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { App } from './app';

describe('Showcase consumes the built public library', () => {
  beforeEach(() => TestBed.configureTestingModule({ providers: [provideRouter([])] }));

  it('adds a submitted artist and sorts/paginates the same data', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const app = fixture.componentInstance;
    app.save({ name: 'Anna', email: 'anna@example.com', genre: 'Folk', active: true });
    await fixture.whenStable();
    expect(app.rows()).toHaveLength(7);
    app.changeSort({ column: 'name', direction: 'asc' });
    expect(app.tableConfig().data[0].name).toBe('Anna');
    app.changePageSize(5);
    expect(app.tableConfig().data).toHaveLength(5);
    expect(app.tableConfig().pagination?.total).toBe(7);
  });
});
