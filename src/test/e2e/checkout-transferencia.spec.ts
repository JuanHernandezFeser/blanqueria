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
