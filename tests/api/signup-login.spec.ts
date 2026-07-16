import { test, expect, APIResponse } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Ejercicio 2 - Pruebas de API para demoblaze.com
 *
 * Endpoints:
 *  - POST https://api.demoblaze.com/signup
 *  - POST https://api.demoblaze.com/login
 *
 * Casos cubiertos:
 *  1. Crear un nuevo usuario en signup
 *  2. Intentar crear un usuario ya existente
 *  3. Usuario y password correctos en login
 *  4. Usuario y password incorrectos en login
 *
 * Cada respuesta se captura (status + body) y se guarda como evidencia
 * en evidence/api-outputs.json para su revision posterior.
 */

const timestamp = Date.now();
const testUser = {
  username: `qa_user_${timestamp}`,
  password: 'P@ssw0rd123',
};

const evidenceFile = path.join(__dirname, '..', '..', 'evidence', 'api-outputs.json');
const evidenceLog: Record<string, unknown> = {};

async function captureResponse(caseName: string, response: APIResponse) {
  const status = response.status();
  let body: unknown;
  try {
    body = await response.json();
  } catch {
    body = await response.text();
  }
  evidenceLog[caseName] = {
    status,
    statusText: response.statusText(),
    body,
    capturedAt: new Date().toISOString(),
  };
  return { status, body };
}

/**
 * demoblaze responde a veces con texto plano y a veces con un objeto JSON
 * (p. ej. {"errorMessage": "This user already exist."}). Esta funcion
 * normaliza cualquier body a texto para poder aplicar aserciones de contenido.
 */
function asText(body: unknown): string {
  return typeof body === 'string' ? body : JSON.stringify(body);
}

test.describe.serial('API demoblaze - signup y login', () => {
  test.afterAll(() => {
    fs.mkdirSync(path.dirname(evidenceFile), { recursive: true });
    fs.writeFileSync(evidenceFile, JSON.stringify(evidenceLog, null, 2), 'utf-8');
  });

  test('Caso 1: crear un nuevo usuario en /signup', async ({ request }) => {
    const response = await request.post('/signup', {
      data: { username: testUser.username, password: testUser.password },
    });
    const { status, body } = await captureResponse('01_signup_nuevo_usuario', response);
    console.log('Signup nuevo usuario ->', status, JSON.stringify(body));

    expect(status).toBe(200);
  });

  test('Caso 2: intentar crear un usuario ya existente', async ({ request }) => {
    const response = await request.post('/signup', {
      data: { username: testUser.username, password: testUser.password },
    });
    const { status, body } = await captureResponse('02_signup_usuario_existente', response);
    console.log('Signup usuario existente ->', status, JSON.stringify(body));

    expect(status).toBe(200);
    expect(asText(body)).toMatch(/exist/i);
  });

  test('Caso 3: login con usuario y password correctos', async ({ request }) => {
    const response = await request.post('/login', {
      data: { username: testUser.username, password: testUser.password },
    });
    const { status, body } = await captureResponse('03_login_credenciales_correctas', response);
    console.log('Login correcto ->', status, JSON.stringify(body));

    expect(status).toBe(200);
    expect(asText(body)).not.toMatch(/wrong|not found|does not exist/i);
  });

  test('Caso 4: login con usuario y/o password incorrectos', async ({ request }) => {
    const response = await request.post('/login', {
      data: { username: testUser.username, password: 'clave-incorrecta-999' },
    });
    const { status, body } = await captureResponse('04_login_credenciales_incorrectas', response);
    console.log('Login incorrecto ->', status, JSON.stringify(body));

    expect(status).toBe(200);
    expect(asText(body)).toMatch(/wrong|incorrect|not found|does not exist/i);
  });
});
