import { test, expect } from '@playwright/test';

test.describe('Login Flow', () => {
  test('Deve redirecionar usuário não logado para /login', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveURL(/.*\/login/);
  });

  test('Deve realizar o login com sucesso com credenciais corretas', async ({ page }) => {
    // Interceptar a API para retornar sucesso mockado se não estiver rodando backend local
    await page.route('**/auth/token', async route => {
      const request = route.request();
      if (request.method() === 'POST') {
        const postData = JSON.parse(request.postData() || '{}');
        if (postData.email === 'tecnico@prefeitura.rio' && postData.password === 'painel@2024') {
          await route.fulfill({ json: { token: 'mock-jwt-token' } });
        } else {
          await route.fulfill({ status: 401, json: { error: 'Invalid' } });
        }
      }
    });

    await page.goto('/login');
    
    await page.fill('input[type="email"]', 'tecnico@prefeitura.rio');
    await page.fill('input[type="password"]', 'painel@2024');
    await page.click('button[type="submit"]');

    // Após login, aguardar o redirecionamento
    await page.waitForURL('**/');
    await expect(page).toHaveURL(/.*\//);
  });
});
