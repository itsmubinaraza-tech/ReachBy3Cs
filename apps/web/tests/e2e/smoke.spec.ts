import { test, expect } from '@playwright/test';

test.describe('Smoke Tests', () => {
  test('homepage loads successfully', async ({ page }) => {
    await page.goto('/');

    // Check that the page loads
    await expect(page).toHaveTitle(/Needs-Matched Engagement Platform/);

    // Check that the main heading is visible
    await expect(page.getByRole('heading', { level: 1 })).toContainText(
      'Needs-Matched Engagement Platform'
    );

    // Check that the system status is visible
    await expect(page.getByText('System Online')).toBeVisible();
  });

  test('page is responsive on mobile', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');

    // Check that the main content is visible
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();

    // Check that the card is visible
    await expect(page.getByText('Web App')).toBeVisible();
  });

  test('page is responsive on tablet', async ({ page }) => {
    // Set tablet viewport
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto('/');

    // Check that the main content is visible
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  });
});

test.describe('Accessibility', () => {
  test('page has no major accessibility issues', async ({ page }) => {
    await page.goto('/');

    // Check that heading hierarchy is correct
    const h1Count = await page.getByRole('heading', { level: 1 }).count();
    expect(h1Count).toBe(1);

    // Check that the page has a main landmark
    await expect(page.getByRole('main')).toBeVisible();
  });
});
