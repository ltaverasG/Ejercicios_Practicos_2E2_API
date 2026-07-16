import { Page } from '@playwright/test';

/**
 * Page Object de la ficha de producto individual.
 */
export class ProductPage {
  constructor(private readonly page: Page) { }

  /**
   * Agrega el producto al carrito. demoblaze muestra un alert() nativo del
   * navegador ("Product added") y debe aceptarse antes de continuar.
   */
  async addToCart() {
    const dialogPromise = this.page.waitForEvent('dialog');
    await this.page.click('a:has-text("Add to cart")');
    const dialog = await dialogPromise;
    await dialog.accept();
  }
}
