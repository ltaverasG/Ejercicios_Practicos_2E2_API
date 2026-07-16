import { Page } from '@playwright/test';

export interface OrderData {
  name: string;
  country: string;
  city: string;
  card: string;
  month: string;
  year: string;
}

/**
 * Page Object del modal "Place Order" y del mensaje de confirmacion
 */
export class OrderModal {
  constructor(private readonly page: Page) { }

  async fill(data: OrderData) {
    await this.page.fill('#name', data.name);
    await this.page.fill('#country', data.country);
    await this.page.fill('#city', data.city);
    await this.page.fill('#card', data.card);
    await this.page.fill('#month', data.month);
    await this.page.fill('#year', data.year);
  }

  async purchase() {
    await this.page.click('button:has-text("Purchase")');
    await this.page.waitForSelector('.sweet-alert', { state: 'visible' });
  }

  async getConfirmationTitle(): Promise<string> {
    return (await this.page.locator('.sweet-alert h2').textContent())?.trim() ?? '';
  }

  async getConfirmationDetails(): Promise<string> {
    return (await this.page.locator('.sweet-alert p').innerText()).trim();
  }

  async confirm() {
    await this.page.click('.sweet-alert button.confirm');
  }
}
