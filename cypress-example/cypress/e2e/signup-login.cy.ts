/// <reference types="cypress" />

/**
 *
 * Ejecutar con:
 *   npm run cy:run
 *   npm run cy:open
 */
const asText = (body: unknown): string =>
  typeof body === 'string' ? body : JSON.stringify(body);

describe('API demoblaze - signup y login (Cypress)', () => {
  const timestamp = Date.now();
  const testUser = {
    username: `cy_user_${timestamp}`,
    password: 'P@ssw0rd123',
  };

  it('Caso 1: crea un nuevo usuario en /signup', () => {
    cy.request({
      method: 'POST',
      url: '/signup',
      body: testUser,
      failOnStatusCode: false,
    }).then((response) => {
      cy.log('Signup nuevo usuario ->', JSON.stringify(response.body));
      expect(response.status).to.eq(200);
    });
  });

  it('Caso 2: intenta crear un usuario ya existente', () => {
    cy.request({
      method: 'POST',
      url: '/signup',
      body: testUser,
      failOnStatusCode: false,
    }).then((response) => {
      cy.log('Signup usuario existente ->', JSON.stringify(response.body));
      expect(response.status).to.eq(200);
      expect(asText(response.body)).to.match(/exist/i);
    });
  });

  it('Caso 3: login con usuario y password correctos', () => {
    cy.request({
      method: 'POST',
      url: '/login',
      body: testUser,
      failOnStatusCode: false,
    }).then((response) => {
      cy.log('Login correcto ->', JSON.stringify(response.body));
      expect(response.status).to.eq(200);
      expect(asText(response.body)).not.to.match(/wrong|does not exist/i);
    });
  });

  it('Caso 4: login con password incorrecto', () => {
    cy.request({
      method: 'POST',
      url: '/login',
      body: { username: testUser.username, password: 'clave-incorrecta-999' },
      failOnStatusCode: false,
    }).then((response) => {
      cy.log('Login incorrecto ->', JSON.stringify(response.body));
      expect(response.status).to.eq(200);
      expect(asText(response.body)).to.match(/wrong|incorrect|not found|does not exist/i);
    });
  });
});
