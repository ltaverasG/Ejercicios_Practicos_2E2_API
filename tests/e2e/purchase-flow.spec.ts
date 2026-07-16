import { test, expect } from '@playwright/test';
import { HomePage } from '../../pages/HomePage';
import { ProductPage } from '../../pages/ProductPage';
import { CartPage } from '../../pages/CartPage';
import { OrderModal } from '../../pages/OrderModal';

/**
 * Ejercicio 1 - Prueba E2E de flujo de compra en demoblaze.com
 *
 * Pasos cubiertos:
 *  1. Agregar dos productos al carrito
 *  2. Visualizar el carrito y validar su contenido
 *  3. Completar el formulario de compra
 *  4. Finalizar la compra hasta la confirmacion "Thank you for your purchase!"
 */

const PRODUCT_1 = 'Samsung galaxy s6';
const PRODUCT_2 = 'Nokia lumia 1520';

const ORDER_DATA = {
  name: 'Luis Taveras',
  country: 'Republica Dominicana',
  city: 'Santo Domingo',
  card: '4111111111111111',
  month: '05',
  year: '2028',
};

test.describe('Flujo de compra E2E - demoblaze.com', () => {
  test('agrega productos, revisa el carrito y finaliza la compra con confirmacion', async ({ page }) => {
    const home = new HomePage(page);
    const product = new ProductPage(page);
    const cart = new CartPage(page);
    const orderModal = new OrderModal(page);

    await test.step('1. Agregar el primer producto al carrito', async () => {
      await home.goto();
      await home.openProduct(PRODUCT_1);
      await product.addToCart();
    });

    await test.step('2. Agregar el segundo producto al carrito', async () => {
      await home.goto();
      await home.openProduct(PRODUCT_2);
      await product.addToCart();
    });

    await test.step('3. Visualizar el carrito y validar contenido', async () => {
      await home.goToCart();
      await expect(cart.rows).toHaveCount(2);
      // demoblaze no garantiza el orden de los items en el carrito, por lo que
      // validamos que ambos productos esten presentes sin depender del orden.
      const names = await cart.productNames.allTextContents();
      expect(names.map((n) => n.trim())).toEqual(
        expect.arrayContaining([PRODUCT_1, PRODUCT_2]),
      );
    });

    await test.step('4. Completar el formulario de compra', async () => {
      await cart.placeOrder();
      await orderModal.fill(ORDER_DATA);
    });

    await test.step('5. Finalizar la compra y validar la confirmacion', async () => {
      await orderModal.purchase();
      const title = await orderModal.getConfirmationTitle();
      expect(title).toMatch(/thank you for your (purchase|order)/i);

      const details = await orderModal.getConfirmationDetails();
      expect(details).toContain('Id:');
      expect(details).toContain('Amount:');

      await orderModal.confirm();
    });
  });
});
