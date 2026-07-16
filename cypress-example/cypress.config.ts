import { defineConfig } from 'cypress';

export default defineConfig({
  e2e: {
    baseUrl: 'https://api.demoblaze.com',
    supportFile: false,
    specPattern: 'cypress/e2e/**/*.cy.ts',
    video: false,
  },
});
