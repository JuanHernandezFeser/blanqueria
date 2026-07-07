import type { FullConfig } from '@playwright/test';

const RESET_KEY = process.env.TEST_RESET_KEY || 'dev-reset-key';
const SERVER_URL = process.env.SERVER_URL || 'http://localhost:3001';

async function globalSetup(_config: FullConfig) {
  const response = await fetch(`${SERVER_URL}/api/testing/reset`, {
    method: 'POST',
    headers: { 'x-test-reset-key': RESET_KEY },
  });
  if (!response.ok) {
    throw new Error(
      `Falló el reseteo de la base de datos (${response.status}). ` +
      `Asegurate de que el servidor esté corriendo en ${SERVER_URL} ` +
      `y que TEST_RESET_KEY coincida en server/.env`
    );
  }
}

export default globalSetup;
