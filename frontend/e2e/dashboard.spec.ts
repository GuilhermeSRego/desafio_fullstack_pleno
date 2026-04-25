import { test, expect } from '@playwright/test';

test.describe('Fluxo do Painel de Monitoramento', () => {
  test.beforeEach(async ({ page }) => {
    // Mock do Login
    await page.route('**/auth/token', async route => {
      await route.fulfill({ json: { token: 'mock-jwt-token' } });
    });

    // Mock do Summary (Dashboard) com dados completos para os gráficos
    await page.route('**/summary', async route => {
      await route.fulfill({
        json: {
          total: 25,
          healthAlerts: 10,
          educationAlerts: 5,
          socialAlerts: 3,
          reviewed: 7,
          inconsistencyCount: 4,
          criticalCases: [
            { id: 1, originalId: 'child-1', nome: 'Ana Silva', bairro: 'Centro', totalAlertas: 5 },
            { id: 2, originalId: 'child-2', nome: 'João Souza', bairro: 'Bangu', totalAlertas: 4 }
          ],
          neighborhoodStats: [
            { neighborhood: 'Centro', totalChildren: 12, alerts: 5, inconsistencies: 2, health: 3, education: 1, social: 1 },
            { neighborhood: 'Bangu', totalChildren: 8, alerts: 3, inconsistencies: 1, health: 1, education: 1, social: 1 }
          ]
        }
      });
    });

    // Mock da Lista de Inconsistências (Dashboard) - FORMATO CORRETO
    await page.route('**/inconsistencies', async route => {
      await route.fulfill({ 
        json: [
          { 
            id: 1, 
            originalId: 'child-1',
            nome: 'Ana Silva', 
            bairro: 'Centro',
            issues: ['CPF do Responsável Ausente', 'Endereço Incompleto'],
            suggestions: ['Solicitar documento na visita', 'Confirmar logradouro']
          }
        ] 
      });
    });

    // Mock da Lista de Crianças (Populado com bairros que possuem coordenadas no InteractiveMap)
    await page.route('**/children*', async route => {
      if (route.request().resourceType() === 'document') {
        return route.continue();
      }
      await route.fulfill({
        json: {
          data: [
            { 
              id: 1, originalId: 'child-1', nome: 'Ana Silva', bairro: 'Rocinha', revisado: false,
              saude: { alertas: ['vacinas_atrasadas'] }, educacao: { alertas: [] }, assistencia_social: { alertas: [] }
            },
            { 
              id: 2, originalId: 'child-2', nome: 'João Souza', bairro: 'Maré', revisado: false,
              saude: { alertas: ['frequencia_baixa'] }, educacao: { alertas: ['evasao'] }, assistencia_social: { alertas: [] }
            },
            { 
              id: 3, originalId: 'child-3', nome: 'Carla Dias', bairro: 'Rocinha', revisado: true,
              saude: { alertas: [] }, educacao: { alertas: [] }, assistencia_social: { alertas: ['beneficio_suspenso'] }
            }
          ],
          meta: { total: 3, page: 1, limit: 10, totalPages: 1 }
        }
      });
    });

    // Mock do Detalhe da Criança
    await page.route('**/children/child-1', async route => {
      if (route.request().resourceType() === 'document') return route.continue();
      await route.fulfill({
        json: {
          id: 1,
          originalId: 'child-1',
          nome: 'Ana Silva',
          data_nascimento: '2018-05-20',
          bairro: 'Rocinha',
          revisado: false,
          responsavel: 'Maria Silva',
          saude: { 
            alertas: ['vacinas_atrasadas'], 
            status: 'crítico',
            vacinas_em_dia: false,
            ultima_consulta: '2023-10-15'
          },
          educacao: { escola: 'E.M. Rio', frequencia_percent: 85, alertas: [] },
          assistencia_social: { cad_unico: true, beneficio_ativo: true, alertas: [] },
          inconsistencies: { 
            issues: ['CPF do Responsável Ausente', 'Endereço sem número'],
            suggestions: ['Solicitar documento', 'Confirmar na visita']
          },
          reviews: []
        }
      });
    });

    // Mock do Registro de Revisão (Deve retornar o objeto atualizado)
    await page.route('**/children/*/review', async route => {
      await route.fulfill({ 
        json: { 
          id: 1,
          originalId: 'child-1',
          nome: 'Ana Silva',
          data_nascimento: '2018-05-20',
          bairro: 'Centro',
          revisado: true,
          responsavel: 'Maria Silva',
          saude: { alertas: [], status: 'estável', vacinas_em_dia: true, ultima_consulta: '2023-11-20' },
          educacao: { escola: 'E.M. Rio', frequencia_percent: 95, alertas: [] },
          assistencia_social: { cad_unico: true, beneficio_ativo: true, alertas: [] },
          inconsistencies: {
            issues: ['CPF do Responsável Ausente'],
            suggestions: ['Solicitar documento']
          },
          reviews: [
            { id: 100, createdAt: new Date().toISOString(), anotacao: 'Visita técnica realizada...', revisado_por: 'tecnico@prefeitura.rio', frequencia_nova: 95, num_alertas_saude_novo: 0, num_alertas_educ_novo: 0, num_alertas_social_novo: 0 }
          ]
        } 
      });
    });

    // Garantir que o localStorage seja setado na origem correta
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.setItem('tour_completed', 'true');
      localStorage.setItem('tour_active', 'false');
    });

    // Realizar login
    await page.goto('/login');
    await page.fill('input[type="email"]', 'tecnico@prefeitura.rio');
    await page.waitForTimeout(500);
    await page.fill('input[type="password"]', 'painel@2024');
    await page.waitForTimeout(500);
    await page.click('button[type="submit"]');
    
    // Esperar pelo redirecionamento com MUITA paciência
    await page.waitForURL('**/', { timeout: 30000 });
    
    // Esperar um indicador do dashboard aparecer (prova que a página carregou)
    await page.waitForSelector('#indicators-section', { timeout: 30000 });
    
    // Limpar bloqueios de acessibilidade em massa
    await page.evaluate(() => {
      document.querySelectorAll('*').forEach(el => el.removeAttribute('aria-hidden'));
    });
  });

  test('Jornada Completa do Técnico: Dashboard, Mapas, Prontuário e Revisão', async ({ page }) => {
    test.setTimeout(60000);

    // 1. DASHBOARD: Verificar Título e Tabelas
    await page.waitForLoadState('networkidle');
    const title = page.locator('h2').filter({ hasText: 'Painel de Monitoramento' });
    await expect(title).toBeVisible({ timeout: 15000 });
    
    await page.waitForTimeout(2000);
    await expect(page.getByText('Ana Silva').first()).toBeVisible();
    
    const inconsistencyText = page.getByText(/CPF do Responsável Ausente/i).first();
    await inconsistencyText.scrollIntoViewIfNeeded();
    await expect(inconsistencyText).toBeVisible({ timeout: 10000 });
    await page.waitForTimeout(1500);

    // 2. ABAS: Navegar pelo Panorama e Estatística
    await page.click('#tab-analytics', { force: true });
    await page.waitForTimeout(3000);
    
    // Rolar para baixo para mostrar o gráfico de barras
    const barChart = page.getByText(/Volume de Casos e Alertas por Bairro/i).first();
    await barChart.scrollIntoViewIfNeeded();
    await page.waitForTimeout(3000); 

    // 3. MAPA: Distribuição Geográfica e Mapa de Calor
    await page.click('#tab-map', { force: true });
    await page.waitForTimeout(4000); 
    
    // Rolar para o mapa e interagir
    const mapContainer = page.locator('.leaflet-container');
    await mapContainer.scrollIntoViewIfNeeded();
    await page.waitForTimeout(1000);

    // Zoom no Mapa (Clicar no botão + do Leaflet)
    const zoomIn = page.locator('.leaflet-control-zoom-in');
    await zoomIn.click();
    await page.waitForTimeout(1000);
    await zoomIn.click();
    await page.waitForTimeout(2000);

    // Clicar em um Aglomerado e ABRIR A MODAL
    const marker = page.locator('.leaflet-marker-icon, .marker-cluster').first();
    if (await marker.isVisible()) {
      await marker.click({ force: true });
      await page.waitForTimeout(2000);
      
      // FECHAR A MODAL para liberar o clique no Mapa de Calor
      await page.click('button:has-text("Fechar")');
      await page.waitForTimeout(1000);
    }
    
    // Alternar para Mapa de Calor
    const heatMapBtn = page.locator('button').filter({ hasText: 'Mapa de Calor' });
    await expect(heatMapBtn).toBeAttached({ timeout: 10000 });
    await heatMapBtn.click({ force: true });
    await page.waitForTimeout(3000); 

    // 4. LISTA: Navegar para a Base de Alunos
    await page.click('#nav-children', { force: true });
    await page.waitForURL('**/children');
    await page.evaluate(() => document.querySelectorAll('*').forEach(el => el.removeAttribute('aria-hidden')));
    
    await expect(page.getByText('Ana Silva').first()).toBeVisible();
    await page.waitForTimeout(1000);

    // 5. PRONTUÁRIO: Abrir o caso da Ana Silva
    await page.click('text=Ver Caso', { force: true });
    await page.waitForURL('**/children/child-1');
    await page.evaluate(() => document.querySelectorAll('*').forEach(el => el.removeAttribute('aria-hidden')));

    await expect(page.getByText('Maria Silva').first()).toBeVisible();
    await page.waitForTimeout(1500);

    // 6. REVISÃO: Registrar acompanhamento técnico
    await page.click('#btn-open-revision', { force: true });
    // CORREÇÃO: O título correto é "Atualizar Dados e Acompanhamento"
    await page.waitForSelector('text=Atualizar Dados e Acompanhamento');
    
    await page.fill('textarea', 'Visita técnica realizada. Verificado atraso vacinal e agendado retorno para próxima semana.');
    await page.waitForTimeout(2000);
    
    // Clicar explicitamente em "Salvar Alterações" (texto que está no botão do componente)
    await page.click('button:has-text("Salvar Alterações")');

    // Esperar o diálogo fechar e verificar mudança no botão principal
    await expect(page.locator('#btn-open-revision')).toContainText(/Nova Revisão/i, { timeout: 15000 });
    await page.waitForTimeout(2000);
    
    // 7. TEMA: Alternar para Modo Dark
    await page.click('#theme-toggle', { force: true });
    await page.waitForTimeout(4000); 
  });
});
