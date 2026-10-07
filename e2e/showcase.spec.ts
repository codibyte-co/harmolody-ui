import { test, expect } from '@playwright/test';

test('validates and submits a real form, then updates the table', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/');
  await page.getByRole('button', { name: 'Add artist', exact: true }).click();
  await expect(page.getByText('Artist name is required', { exact: true })).toBeVisible();
  await page.getByRole('textbox', { name: 'Artist name' }).fill('Anna');
  await page.getByRole('textbox', { name: /^Email/ }).fill('anna@example.com');
  await page.locator('hui-select button').first().click();
  await page.getByRole('option', { name: 'Folk', exact: true }).click();
  await page.getByRole('button', { name: 'Add artist', exact: true }).click();
  await expect(page.getByRole('status')).toContainText('Artist added');
  await expect(page.getByText('7 artists', { exact: false })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Add artist', exact: true })).toBeEnabled();
  expect(errors).toEqual([]);
});

test('sorts with the keyboard, paginates, selects rows, and opens actions', async ({ page }) => {
  await page.goto('/');
  const artistHeader = page.getByRole('columnheader', { name: 'Artist', exact: true });
  await artistHeader.focus();
  await page.keyboard.press('Enter');
  await expect(artistHeader).toHaveAttribute('aria-sort', 'ascending');
  await expect(page.locator('tbody tr').first()).toContainText('Daniel');
  await page.getByRole('checkbox', { name: 'Select all rows' }).check();
  await expect(page.getByText('3 selected', { exact: false })).toBeVisible();
  await page.getByRole('button', { name: 'More actions' }).first().click();
  await page.getByRole('button', { name: 'View artist', exact: true }).click();
  await expect(page.getByRole('status')).toContainText('Viewing Daniel');
  await page.getByRole('button', { name: 'Next page' }).click();
  await expect(page.locator('tbody tr').first()).toContainText('May');
  await page.getByRole('button', { name: 'Dark theme' }).click();
  await expect(page.locator('main')).toHaveAttribute('data-theme', 'dark');
  await expect(page.locator('hui-form-label label').first()).toHaveCSS(
    'color',
    'rgb(203, 213, 225)',
  );
  await page.screenshot({ path: 'artifacts/showcase-dark.png', fullPage: true });
});

test('renders packaged Tailwind grid styles and fits a phone viewport', async ({ page }) => {
  await page.goto('/');
  const grid = page.locator('hui-dynamic-form .md\\:grid-cols-2').first();
  await expect(grid).toHaveCSS('display', 'grid');
  const columns = await grid.evaluate((element) => getComputedStyle(element).gridTemplateColumns);
  expect(columns.split(' ')).toHaveLength(2);
  await page.screenshot({ path: 'artifacts/showcase.png', fullPage: true });
  await page.setViewportSize({ width: 390, height: 844 });
  const width = await page.evaluate(() => ({
    scroll: document.documentElement.scrollWidth,
    viewport: innerWidth,
  }));
  expect(width.scroll).toBeLessThanOrEqual(width.viewport);
});
