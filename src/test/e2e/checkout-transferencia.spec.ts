import { test, expect } from '../../../playwright-fixture';
import type { Page } from '@playwright/test';

const BASE_URL = 'http://localhost:8080';

// ── Helpers compartidas ─────────────────────────────────

async function login(page: Page) {
  await page.goto(`${BASE_URL}/`);
  await page.getByRole('button', { name: 'Cliente' }).click();
  await expect(page.getByRole('button', { name: 'Cliente' })).not.toBeVisible({ timeout: 10000 });
}

async function addSimpleProduct(page: Page) {
  await page.goto(`${BASE_URL}/catalogo`);
  const card = page.locator('[data-testid="product-card"]').filter({ hasText: 'Toalla de Mano Bordada' });
  await card.getByRole('button', { name: /agregar al carrito/i }).click();
}

async function addVariantProduct(page: Page) {
  await page.goto(`${BASE_URL}/catalogo`);
  const card = page.locator('[data-testid="product-card"]').filter({ hasText: 'Algodón Egipcio 400 Hilos' });
  await card.locator('h3').click();
  await expect(page.getByRole('button', { name: '1 Plaza', exact: true })).toBeVisible();
  await page.getByRole('button', { name: '1 Plaza', exact: true }).click();
  await page.getByRole('button', { name: 'Blanco', exact: true }).click();
  await page.locator('[data-testid="add-to-cart-detail"]').click();
}

async function fillShippingForm(page: Page) {
  await page.locator('[data-testid="checkout-address"]').fill('Av. Siempre Viva 123');
  await page.locator('[data-testid="checkout-city"]').fill('Buenos Aires');
  await page.locator('[data-testid="checkout-province"]').selectOption('CABA');
  await page.locator('[data-testid="checkout-postal"]').fill('1426');
  await page.locator('[data-testid="checkout-phone"]').fill('1123456789');
}

async function goToPayment(page: Page) {
  await page.locator('[data-testid="continue-to-payment"]').click();
}

async function selectTransfer(page: Page) {
  await page.locator('[data-testid="payment-transferencia"]').click();
  await page.locator('[data-testid="continue-to-confirm"]').click();
  await expect(page.locator('[data-testid="bank-details"]')).toBeVisible();
}

// ── Flujo feliz ─────────────────────────────────────────

test.describe('Flujo feliz', () => {
  test.use({ viewport: { width: 1280, height: 720 } });

  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('agrega un producto simple al carrito', async ({ page }) => {
    await addSimpleProduct(page);
    await expect(page.locator('[data-testid="cart-button"] span')).toHaveText('1');
  });

  test('agrega un producto con variante al carrito', async ({ page }) => {
    await addSimpleProduct(page);
    await addVariantProduct(page);
    await expect(page.locator('[data-testid="cart-button"] span')).toHaveText('2');
  });

  test('muestra los items agregados en el carrito', async ({ page }) => {
    await addSimpleProduct(page);
    await addVariantProduct(page);
    await page.goto(`${BASE_URL}/carrito`);
    await expect(page.locator('[data-testid="cart-item"]')).toHaveCount(2);
  });

  test('modifica la cantidad y recalcula el subtotal', async ({ page }) => {
    await addSimpleProduct(page);
    await page.goto(`${BASE_URL}/carrito`);
    await page.locator('[data-testid="cart-item"]')
      .filter({ hasText: 'Toalla de Mano Bordada' })
      .getByRole('button').filter({ has: page.locator('.lucide-plus') })
      .click();
    await page.waitForTimeout(200);
    const subtotal = await page.getByText('Subtotal')
      .locator('..').locator('span').last().textContent();
    expect(subtotal).toMatch(/\d/);
  });

  test('elimina un item del carrito', async ({ page }) => {
    await addSimpleProduct(page);
    await addVariantProduct(page);
    await page.goto(`${BASE_URL}/carrito`);
    await page.locator('[data-testid="cart-item"]')
      .filter({ hasText: 'Algodón Egipcio' })
      .getByRole('button').filter({ has: page.locator('.lucide-trash2') })
      .click();
    await expect(page.locator('[data-testid="cart-item"]')).toHaveCount(1);
  });

  test('completa el formulario de envío en checkout', async ({ page }) => {
    await addSimpleProduct(page);
    await page.goto(`${BASE_URL}/carrito`);
    await page.getByRole('button', { name: /finalizar compra/i }).click();
    await fillShippingForm(page);
    await expect(page.locator('[data-testid="checkout-address"]')).toHaveValue('Av. Siempre Viva 123');
  });

  test('calcula el envío por código postal', async ({ page }) => {
    await addSimpleProduct(page);
    await page.goto(`${BASE_URL}/carrito`);
    await page.getByRole('button', { name: /finalizar compra/i }).click();
    await fillShippingForm(page);
    await page.locator('[data-testid="shipping-input"]').fill('1426');
    await expect(page.locator('[data-testid="shipping-result"]')).toBeVisible();
  });

  test('selecciona transferencia bancaria y visualiza los datos', async ({ page }) => {
    await addSimpleProduct(page);
    await page.goto(`${BASE_URL}/carrito`);
    await page.getByRole('button', { name: /finalizar compra/i }).click();
    await fillShippingForm(page);
    await goToPayment(page);
    await selectTransfer(page);
    await expect(page.locator('[data-testid="bank-details"]')).toContainText('Banco');
    await expect(page.locator('[data-testid="bank-details"]')).toContainText('CBU');
  });

  test('confirma la orden y muestra el ID', async ({ page }) => {
    await addSimpleProduct(page);
    await page.goto(`${BASE_URL}/carrito`);
    await page.getByRole('button', { name: /finalizar compra/i }).click();
    await fillShippingForm(page);
    await goToPayment(page);
    await selectTransfer(page);
    await page.locator('[data-testid="confirm-order"]').click();
    await expect(page.locator('[data-testid="order-id"]')).toBeVisible({ timeout: 15000 });
    const orderId = await page.locator('[data-testid="order-id"]').textContent();
    expect(orderId).toBeTruthy();
  });
});

// ── Compra como invitado ────────────────────────────────

test.describe('Compra como invitado', () => {
  test.use({ viewport: { width: 1280, height: 720 } });

  async function addProduct(page: Page) {
    await page.goto(`${BASE_URL}/catalogo`);
    const card = page.locator('[data-testid="product-card"]').filter({ hasText: 'Toalla de Mano Bordada' });
    await card.getByRole('button', { name: /agregar al carrito/i }).click();
  }

  async function fillGuestForm(page: Page) {
    await page.locator('[data-testid="checkout-name"]').fill('Invitado Test');
    await page.locator('[data-testid="checkout-email"]').fill('invitado@test.com');
    await page.locator('[data-testid="checkout-address"]').fill('Calle Falsa 456');
    await page.locator('[data-testid="checkout-city"]').fill('Córdoba');
    await page.locator('[data-testid="checkout-province"]').selectOption('Córdoba');
    await page.locator('[data-testid="checkout-postal"]').fill('5000');
    await page.locator('[data-testid="checkout-phone"]').fill('987654321');
  }

  test('redirige al formulario de invitado sin sesión', async ({ page }) => {
    await addProduct(page);
    await page.goto(`${BASE_URL}/checkout`);
    await expect(page.locator('[data-testid="guest-checkout"]')).toBeVisible();
  });

  test('completa el formulario de invitado y calcula el envío', async ({ page }) => {
    await addProduct(page);
    await page.goto(`${BASE_URL}/checkout`);
    await page.locator('[data-testid="guest-checkout"]').click();
    await fillGuestForm(page);
    await page.locator('[data-testid="shipping-input"]').fill('5000');
    await expect(page.locator('[data-testid="shipping-result"]')).toBeVisible();
  });

  test('finaliza la compra como invitado con transferencia', async ({ page }) => {
    await addProduct(page);
    await page.goto(`${BASE_URL}/checkout`);
    await page.locator('[data-testid="guest-checkout"]').click();
    await fillGuestForm(page);
    await page.locator('[data-testid="shipping-input"]').fill('5000');
    await page.locator('[data-testid="continue-to-payment"]').click();
    await page.locator('[data-testid="payment-transferencia"]').click();
    await page.locator('[data-testid="continue-to-confirm"]').click();
    await expect(page.locator('[data-testid="bank-details"]')).toBeVisible();
    await page.locator('[data-testid="confirm-order"]').click();
    await expect(page.locator('[data-testid="order-id"]')).toBeVisible({ timeout: 15000 });
    const orderId = await page.locator('[data-testid="order-id"]').textContent();
    expect(orderId).toBeTruthy();
  });
});

// ── Validaciones de formulario ──────────────────────────

test.describe('Validaciones de formulario', () => {
  test.use({ viewport: { width: 1280, height: 720 } });

  test('bloquea el checkout con el carrito vacío', async ({ page }) => {
    await page.goto(`${BASE_URL}/checkout`);
    await expect(page.locator('[data-testid="empty-cart"]')).toBeVisible();
    await expect(page.locator('[data-testid="checkout-address"]')).not.toBeVisible();
  });

  test('muestra error si el nombre está vacío y no avanza al pago', async ({ page }) => {
    await login(page);
    await addSimpleProduct(page);
    await page.goto(`${BASE_URL}/carrito`);
    await page.getByRole('button', { name: /finalizar compra/i }).click();
    await page.locator('[data-testid="checkout-name"]').clear();
    await fillShippingForm(page);
    await page.locator('[data-testid="continue-to-payment"]').click();
    await expect(page.getByText('Completá todos los datos de envío')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('[data-testid="continue-to-payment"]')).toBeVisible();
  });

  test('muestra error si la dirección está vacía y no avanza al pago', async ({ page }) => {
    await login(page);
    await addSimpleProduct(page);
    await page.goto(`${BASE_URL}/carrito`);
    await page.getByRole('button', { name: /finalizar compra/i }).click();
    await page.locator('[data-testid="checkout-name"]').fill('Test User');
    await page.locator('[data-testid="checkout-city"]').fill('Buenos Aires');
    await page.locator('[data-testid="checkout-province"]').selectOption('CABA');
    await page.locator('[data-testid="checkout-postal"]').fill('1426');
    await page.locator('[data-testid="checkout-phone"]').fill('1123456789');
    await page.locator('[data-testid="continue-to-payment"]').click();
    await expect(page.getByText('Completá todos los datos de envío')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('[data-testid="continue-to-payment"]')).toBeVisible();
  });

  test('muestra error si el código postal está vacío y no avanza al pago', async ({ page }) => {
    await login(page);
    await addSimpleProduct(page);
    await page.goto(`${BASE_URL}/carrito`);
    await page.getByRole('button', { name: /finalizar compra/i }).click();
    await page.locator('[data-testid="checkout-name"]').fill('Test User');
    await fillShippingForm(page);
    await page.locator('[data-testid="checkout-postal"]').clear();
    await page.locator('[data-testid="continue-to-payment"]').click();
    await expect(page.getByText('Completá todos los datos de envío')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('[data-testid="continue-to-payment"]')).toBeVisible();
  });

  test('muestra error si el email tiene formato inválido y no avanza al pago', async ({ page }) => {
    await page.goto(`${BASE_URL}/catalogo`);
    const card = page.locator('[data-testid="product-card"]').filter({ hasText: 'Toalla de Mano Bordada' });
    await card.getByRole('button', { name: /agregar al carrito/i }).click();
    await page.goto(`${BASE_URL}/checkout`);
    await page.locator('[data-testid="guest-checkout"]').click();
    await expect(page.locator('[data-testid="checkout-email"]')).toBeVisible({ timeout: 10000 });
    await page.locator('[data-testid="checkout-name"]').fill('Invitado Test');
    await page.locator('[data-testid="checkout-email"]').fill('correo-invalido');
    await page.locator('[data-testid="checkout-address"]').fill('Calle Falsa 456');
    await page.locator('[data-testid="checkout-city"]').fill('Córdoba');
    await page.locator('[data-testid="checkout-province"]').selectOption('Córdoba');
    await page.locator('[data-testid="checkout-postal"]').fill('5000');
    await page.locator('[data-testid="checkout-phone"]').fill('987654321');
    await page.locator('[data-testid="continue-to-payment"]').click();
    await expect(page.locator('[data-testid="error-email"]')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('[data-testid="error-email"]')).toHaveText('Ingresá un email válido');
    await expect(page.locator('[data-testid="continue-to-payment"]')).toBeVisible();
  });

  test('muestra error si el teléfono contiene letras y no avanza al pago', async ({ page }) => {
    await login(page);
    await addSimpleProduct(page);
    await page.goto(`${BASE_URL}/carrito`);
    await page.getByRole('button', { name: /finalizar compra/i }).click();
    await page.locator('[data-testid="checkout-name"]').fill('Test User');
    await page.locator('[data-testid="checkout-address"]').fill('Av. Siempre Viva 123');
    await page.locator('[data-testid="checkout-city"]').fill('Buenos Aires');
    await page.locator('[data-testid="checkout-province"]').selectOption('CABA');
    await page.locator('[data-testid="checkout-postal"]').fill('1426');
    await page.locator('[data-testid="checkout-phone"]').fill('teléfono123');
    await page.locator('[data-testid="continue-to-payment"]').click();
    await expect(page.locator('[data-testid="error-phone"]')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('[data-testid="error-phone"]')).toHaveText('Ingresá un teléfono válido (solo números, espacios, guiones y paréntesis)');
    await expect(page.locator('[data-testid="continue-to-payment"]')).toBeVisible();
  });

  test('no permite avanzar al paso de pago con todos los campos vacíos', async ({ page }) => {
    await login(page);
    await addSimpleProduct(page);
    await page.goto(`${BASE_URL}/carrito`);
    await page.getByRole('button', { name: /finalizar compra/i }).click();
    await page.locator('[data-testid="continue-to-payment"]').click();
    await expect(page.getByText('Completá todos los datos de envío')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('[data-testid="continue-to-payment"]')).toBeVisible();
  });
});

// ── Validaciones de producto y stock ─────────────────────

test.describe('Validaciones de producto y stock', () => {
  test.use({ viewport: { width: 1280, height: 720 } });

  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('bloquea agregar un producto con variantes sin seleccionar talle ni color', async ({ page }) => {
    await page.goto(`${BASE_URL}/catalogo`);
    const card = page.locator('[data-testid="product-card"]').filter({ hasText: 'Algodón Egipcio 400 Hilos' });
    await card.locator('h3').click();
    await expect(page.getByRole('dialog')).toBeVisible();
    await expect(page.locator('[data-testid="add-to-cart-detail"]')).toBeDisabled();
    await expect(page.locator('[data-testid="add-to-cart-detail"]')).toHaveText('Seleccioná las opciones');
    await expect(page.locator('[data-testid="variant-error"]')).toBeVisible();
    await expect(page.locator('[data-testid="variant-error"]')).toHaveText('Seleccioná un tamaño y un color para continuar');
  });

  test('bloquea agregar si solo se selecciona talle o solo color cuando ambos son requeridos', async ({ page }) => {
    await page.goto(`${BASE_URL}/catalogo`);
    const card = page.locator('[data-testid="product-card"]').filter({ hasText: 'Algodón Egipcio 400 Hilos' });
    await card.locator('h3').click();
    await expect(page.getByRole('dialog')).toBeVisible();

    // Solo talle seleccionado, sin color
    await page.getByRole('button', { name: '1 Plaza', exact: true }).click();
    await expect(page.locator('[data-testid="add-to-cart-detail"]')).toBeDisabled();
    await expect(page.locator('[data-testid="variant-error"]')).toHaveText('Seleccioná un color para continuar');

    // Cerrar y reabrir para resetear selecciones
    await page.locator('body').press('Escape');
    await expect(page.getByRole('dialog')).not.toBeVisible();
    await card.locator('h3').click();
    await expect(page.getByRole('dialog')).toBeVisible();

    // Solo color seleccionado, sin talle
    await page.getByRole('button', { name: 'Blanco', exact: true }).click();
    await expect(page.locator('[data-testid="add-to-cart-detail"]')).toBeDisabled();
    await expect(page.locator('[data-testid="variant-error"]')).toHaveText('Seleccioná un tamaño para continuar');
  });

  test('no permite agregar una cantidad mayor al stock disponible de un producto sin variantes', async ({ page }) => {
    await page.goto(`${BASE_URL}/catalogo`);
    // Quilt de Algodón Orgánico — stock: 9, sin variantes
    const card = page.locator('[data-testid="product-card"]').filter({ hasText: 'Quilt de Algodón Orgánico' });
    await card.locator('h3').click();
    await expect(page.getByRole('dialog')).toBeVisible();

    const plusBtn = page.getByRole('dialog').getByRole('button').filter({ has: page.locator('.lucide-plus') });

    // Subir de 1 a 9 (máximo)
    for (let i = 1; i < 9; i++) {
      await plusBtn.click();
    }

    await expect(page.locator('[data-testid="stock-limit-error"]')).toBeVisible();
    await expect(page.locator('[data-testid="stock-limit-error"]')).toHaveText('Solo hay 9 disponibles. No podés agregar más unidades.');

    // Un click más no debe aumentar (se mantiene en 9)
    await plusBtn.click();
    await expect(page.locator('[data-testid="stock-limit-error"]')).toBeVisible();

    // Se puede agregar al carrito con la cantidad máxima
    await page.locator('[data-testid="add-to-cart-detail"]').click();
    await expect(page.locator('[data-testid="cart-button"] span')).toHaveText('9');
  });

  test('no permite agregar una cantidad mayor al stock disponible de un producto con variantes (stock compartido)', async ({ page }) => {
    await page.goto(`${BASE_URL}/catalogo`);
    // Acolchado de Duvet Premium — stock: 6, variantes: 2 Plazas, King
    // Nota: el seed actual no tiene variantStock individual por variante,
    // el stock es compartido entre todas las variantes del mismo producto.
    const card = page.locator('[data-testid="product-card"]').filter({ hasText: 'Acolchado de Duvet Premium' });
    await card.locator('h3').click();
    await expect(page.getByRole('dialog')).toBeVisible();

    await page.getByRole('button', { name: '2 Plazas', exact: true }).click();

    const plusBtn = page.getByRole('dialog').getByRole('button').filter({ has: page.locator('.lucide-plus') });

    // Subir de 1 a 6 (máximo)
    for (let i = 1; i < 6; i++) {
      await plusBtn.click();
    }

    await expect(page.locator('[data-testid="stock-limit-error"]')).toBeVisible();
    await expect(page.locator('[data-testid="stock-limit-error"]')).toHaveText('Solo hay 6 disponibles. No podés agregar más unidades.');

    // Un click más no debe aumentar (se mantiene en 6)
    await plusBtn.click();
    await expect(page.locator('[data-testid="stock-limit-error"]')).toBeVisible();

    // Se puede agregar al carrito con la cantidad máxima
    await page.locator('[data-testid="add-to-cart-detail"]').click();
    await expect(page.locator('[data-testid="cart-button"] span')).toHaveText('6');
  });

  test('agrega un producto sin variantes al carrito respetando el stock disponible (control)', async ({ page }) => {
    await page.goto(`${BASE_URL}/catalogo`);
    // Quilt de Algodón Orgánico — stock: 9
    const card = page.locator('[data-testid="product-card"]').filter({ hasText: 'Quilt de Algodón Orgánico' });
    await card.locator('h3').click();
    await expect(page.getByRole('dialog')).toBeVisible();

    const plusBtn = page.getByRole('dialog').getByRole('button').filter({ has: page.locator('.lucide-plus') });

    // Subir a 3 (dentro del stock)
    await plusBtn.click();
    await plusBtn.click();

    await expect(page.locator('[data-testid="stock-limit-error"]')).not.toBeVisible();

    await page.locator('[data-testid="add-to-cart-detail"]').click();
    await expect(page.locator('[data-testid="cart-button"] span')).toHaveText('3');
  });
});

// ── Persistencia y estados intermedios ───────────────────

test.describe('Persistencia y estados intermedios', () => {
  test.use({ viewport: { width: 1280, height: 720 } });

  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('mantiene los productos en el carrito después de recargar la página', async ({ page }) => {
    await addSimpleProduct(page);
    await expect(page.locator('[data-testid="cart-button"] span')).toHaveText('1');

    await page.reload();

    await expect(page.locator('[data-testid="cart-button"] span')).toHaveText('1');
  });

  test('conserva los datos del formulario de envío al volver desde el paso de pago', async ({ page }) => {
    await addSimpleProduct(page);
    await page.goto(`${BASE_URL}/carrito`);
    await page.getByRole('button', { name: /finalizar compra/i }).click();
    await fillShippingForm(page);
    await page.locator('[data-testid="continue-to-payment"]').click();
    await expect(page.getByText('Método de pago')).toBeVisible();

    // Volver al paso 1
    await page.getByRole('button', { name: 'Volver' }).click();
    await expect(page.getByText('Datos de envío')).toBeVisible();

    // Los datos completados deben conservarse
    await expect(page.locator('[data-testid="checkout-address"]')).toHaveValue('Av. Siempre Viva 123');
    await expect(page.locator('[data-testid="checkout-city"]')).toHaveValue('Buenos Aires');
    await expect(page.locator('[data-testid="checkout-province"]')).toHaveValue('CABA');
    await expect(page.locator('[data-testid="checkout-postal"]')).toHaveValue('1426');
    await expect(page.locator('[data-testid="checkout-phone"]')).toHaveValue('1123456789');
  });

  test('recargar la página en el paso de pago regresa al paso de envío con el formulario vacío', async ({ page }) => {
    test.info().annotations.push({
      type: 'known limitation',
      description: 'El checkout usa useState puro sin persistencia. Recargar pierde el paso actual y los datos del formulario. Mejora futura: persistir en sessionStorage.',
    });

    await addSimpleProduct(page);
    await page.goto(`${BASE_URL}/carrito`);
    await page.getByRole('button', { name: /finalizar compra/i }).click();
    await fillShippingForm(page);
    await page.locator('[data-testid="continue-to-payment"]').click();
    await expect(page.getByText('Método de pago')).toBeVisible();

    await page.reload();

    // Vuelve al paso 1 con el formulario sin los datos ingresados
    await expect(page.getByText('Datos de envío')).toBeVisible();
    await expect(page.locator('[data-testid="checkout-address"]')).toHaveValue('');
    await expect(page.locator('[data-testid="checkout-city"]')).toHaveValue('');
    await expect(page.locator('[data-testid="checkout-province"]')).toHaveValue('');
    await expect(page.locator('[data-testid="checkout-postal"]')).toHaveValue('');
    await expect(page.locator('[data-testid="checkout-phone"]')).toHaveValue('');
  });

  test('el doble click en confirmar pedido no crea órdenes duplicadas', async ({ page }) => {
    await addSimpleProduct(page);
    await page.goto(`${BASE_URL}/carrito`);
    await page.getByRole('button', { name: /finalizar compra/i }).click();
    await fillShippingForm(page);
    await page.locator('[data-testid="continue-to-payment"]').click();
    await expect(page.getByText('Método de pago')).toBeVisible();

    // Seleccionar transferencia bancaria y continuar
    await page.locator('[data-testid="payment-transferencia"]').click();
    await page.locator('[data-testid="continue-to-confirm"]').click();
    await expect(page.locator('[data-testid="bank-details"]')).toBeVisible();

    // Doble click rápido en "Confirmar pedido"
    await page.locator('[data-testid="confirm-order"]').click({ clickCount: 2 });

    // Debe terminar en la pantalla de orden confirmada con un solo order-id
    await expect(page.locator('[data-testid="order-id"]')).toBeVisible({ timeout: 15000 });

    // Solo existe un elemento order-id (una sola orden creada)
    await expect(page.locator('[data-testid="order-id"]')).toHaveCount(1);

    // El carrito se vació tras confirmar la orden
    await expect(page.locator('[data-testid="cart-button"]')).not.toContainText(/[1-9]/);
  });
});
