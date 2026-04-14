import { test, expect } from './fixtures';
import { ROUTES } from '../src/constants';

test.describe('navigating app', () => {
  test('stations page should render successfully', async ({ gotoPage, page }) => {
    await gotoPage(`/${ROUTES.Stations}`);
    await expect(page.getByTestId('stations-container')).toBeVisible();
  });
});
