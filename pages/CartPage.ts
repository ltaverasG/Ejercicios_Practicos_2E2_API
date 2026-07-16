import { Page, Locator } from '@playwright/test';

/**
 * Page Object del carrito de compras.
 */
export class CartPage {
  constructor(private readonly page: Page) {}

  get rows(): Locator {
    return this.page.locator('#tbodyid tr');
  }

  get productNames(): Locator {
    return this.page.locator('#tbodyid tr td:nth-child(2)');
  }

  async placeOrder() {
    await this.page.click('button:has-text("Place Order")');
    await this.page.waitForSelector('#orderModal.show, #orderModal[style*="display: block"]');
  }
}
