import { Page } from '@playwright/test';

/**
 * Page Object de la pagina principal de demoblaze.com
 */
export class HomePage {
  constructor(private readonly page: Page) {}

  async goto() {
    await this.page.goto('/');
    await this.page.waitForSelector('.card-title a');
  }

  /** Abre la ficha de producto haciendo click en su nombre en el listado */
  async openProduct(productName: string) {
    await this.page.getByRole('link', { name: productName, exact: true }).click();
    await this.page.waitForSelector('.name');
  }

  async goToCart() {
    await this.page.click('#cartur');
    await this.page.waitForSelector('#tbodyid');
  }
}
