const request = require('supertest');
const { app } = require('../server');

// ============================================================
//  TrustDoc — Testes do Dashboard e Arquivos Estáticos
// ============================================================

describe('Arquivos Estáticos — Páginas', () => {
  test('GET / deve servir a página de login (index.html)', async () => {
    const res = await request(app).get('/');

    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toMatch(/html/);
    expect(res.text).toContain('TrustDoc');
    expect(res.text).toContain('loginForm');
    expect(res.text).toContain('keyboardGrid');
  });

  test('GET /index.html deve servir a página de login', async () => {
    const res = await request(app).get('/index.html');

    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toMatch(/html/);
    expect(res.text).toContain('TrustDoc');
  });

  test('GET /dashboard.html deve servir a página do dashboard', async () => {
    const res = await request(app).get('/dashboard.html');

    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toMatch(/html/);
    expect(res.text).toContain('TrustDoc');
    expect(res.text).toContain('Dashboard');
  });

  test('GET /pagina-inexistente.html deve retornar 404', async () => {
    const res = await request(app).get('/pagina-inexistente.html');

    expect(res.status).toBe(404);
  });
});

// ============================================================
describe('Arquivos Estáticos — CSS e JS', () => {
  test('GET /styles.css deve servir o CSS do login', async () => {
    const res = await request(app).get('/styles.css');

    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toMatch(/css/);
    expect(res.text).toContain('--bg-primary');
    expect(res.text).toContain('.login-card');
  });

  test('GET /app.js deve servir o JS do login', async () => {
    const res = await request(app).get('/app.js');

    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toMatch(/javascript/);
    expect(res.text).toContain('/api/captcha');
    expect(res.text).toContain('/api/login');
  });

  test('GET /dashboard.css deve servir o CSS do dashboard', async () => {
    const res = await request(app).get('/dashboard.css');

    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toMatch(/css/);
    expect(res.text).toContain('.sidebar');
    expect(res.text).toContain('.nav-item');
    expect(res.text).toContain('.stat-card');
  });

  test('GET /dashboard.js deve servir o JS do dashboard', async () => {
    const res = await request(app).get('/dashboard.js');

    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toMatch(/javascript/);
    expect(res.text).toContain('trustdoc_token');
    expect(res.text).toContain('navigateTo');
  });
});

// ============================================================
describe('Dashboard HTML — Estrutura do Conteúdo', () => {
  let dashboardHtml;

  beforeAll(async () => {
    const res = await request(app).get('/dashboard.html');
    dashboardHtml = res.text;
  });

  test('deve conter a sidebar com navegação', () => {
    expect(dashboardHtml).toContain('sidebar');
    expect(dashboardHtml).toContain('nav-item');
  });

  test('deve conter o menu item "Início"', () => {
    expect(dashboardHtml).toContain('Início');
    expect(dashboardHtml).toContain('data-page="inicio"');
  });

  test('deve conter o menu item "Ver Documentos"', () => {
    expect(dashboardHtml).toContain('Ver Documentos');
    expect(dashboardHtml).toContain('data-page="documentos"');
  });

  test('deve conter o menu item "Editar Documentos"', () => {
    expect(dashboardHtml).toContain('Editar Documentos');
    expect(dashboardHtml).toContain('data-page="editar"');
  });

  test('deve conter o menu item "Favoritos"', () => {
    expect(dashboardHtml).toContain('Favoritos');
    expect(dashboardHtml).toContain('data-page="favoritos"');
  });

  test('deve conter o menu item "Recentes"', () => {
    expect(dashboardHtml).toContain('Recentes');
    expect(dashboardHtml).toContain('data-page="recentes"');
  });

  test('deve conter o menu item "Configurações"', () => {
    expect(dashboardHtml).toContain('Configurações');
    expect(dashboardHtml).toContain('data-page="configuracoes"');
  });

  test('deve conter o botão de logout', () => {
    expect(dashboardHtml).toContain('btnLogout');
  });

  test('deve conter cards de estatísticas na página inicial', () => {
    expect(dashboardHtml).toContain('stats-grid');
    expect(dashboardHtml).toContain('stat-card');
    expect(dashboardHtml).toContain('Total de Documentos');
    expect(dashboardHtml).toContain('Documentos Aprovados');
    expect(dashboardHtml).toContain('Pendentes de Revisão');
  });

  test('deve conter a lista de atividade recente', () => {
    expect(dashboardHtml).toContain('activity-list');
    expect(dashboardHtml).toContain('Atividade Recente');
  });

  test('deve conter a seção de acesso rápido', () => {
    expect(dashboardHtml).toContain('quick-access-grid');
    expect(dashboardHtml).toContain('Acesso Rápido');
  });

  test('deve conter a área de edição de documentos', () => {
    expect(dashboardHtml).toContain('editorTextarea');
    expect(dashboardHtml).toContain('editorFileList');
    expect(dashboardHtml).toContain('editorFilename');
  });

  test('deve conter a página de configurações com perfil e preferências', () => {
    expect(dashboardHtml).toContain('Perfil');
    expect(dashboardHtml).toContain('Preferências');
    expect(dashboardHtml).toContain('Notificações por e-mail');
    expect(dashboardHtml).toContain('Modo escuro');
    expect(dashboardHtml).toContain('Autenticação em dois fatores');
  });

  test('deve conter o campo de busca', () => {
    expect(dashboardHtml).toContain('searchInput');
    expect(dashboardHtml).toContain('Buscar documentos');
  });

  test('deve carregar o dashboard.css e dashboard.js', () => {
    expect(dashboardHtml).toContain('dashboard.css');
    expect(dashboardHtml).toContain('dashboard.js');
  });

  test('deve conter a info do usuário na sidebar', () => {
    expect(dashboardHtml).toContain('userAvatar');
    expect(dashboardHtml).toContain('userName');
    expect(dashboardHtml).toContain('Administrador');
  });

  test('deve conter o toggle para sidebar mobile', () => {
    expect(dashboardHtml).toContain('sidebarToggle');
  });
});

// ============================================================
describe('Dashboard JS — Proteção de Autenticação', () => {
  let dashboardJs;

  beforeAll(async () => {
    const res = await request(app).get('/dashboard.js');
    dashboardJs = res.text;
  });

  test('deve verificar token na sessionStorage', () => {
    expect(dashboardJs).toContain("sessionStorage.getItem('trustdoc_token')");
  });

  test('deve redirecionar para / se não tiver token', () => {
    expect(dashboardJs).toContain("window.location.href = '/'");
  });

  test('deve limpar token no logout', () => {
    expect(dashboardJs).toContain("sessionStorage.removeItem('trustdoc_token')");
  });
});

// ============================================================
describe('Login JS — Redirecionamento ao Dashboard', () => {
  let loginJs;

  beforeAll(async () => {
    const res = await request(app).get('/app.js');
    loginJs = res.text;
  });

  test('deve salvar token após login', () => {
    expect(loginJs).toContain("sessionStorage.setItem('trustdoc_token'");
  });

  test('deve redirecionar para /dashboard.html após login', () => {
    expect(loginJs).toContain("/dashboard.html");
  });
});

// ============================================================
describe('Fluxo Completo — Login → Token → Dashboard', () => {
  test('login bem-sucedido deve retornar token válido para uso no dashboard', async () => {
    // Passo 1: Obter CAPTCHA
    const captchaRes = await request(app).get('/api/captcha');
    expect(captchaRes.status).toBe(200);
    const { challengeId, question } = captchaRes.body;

    // Passo 2: Resolver CAPTCHA
    const match = question.match(/(\d+)\s*([+\-×])\s*(\d+)/);
    const a = parseInt(match[1]);
    const op = match[2];
    const b = parseInt(match[3]);
    let answer;
    switch (op) {
      case '+': answer = a + b; break;
      case '-': answer = a - b; break;
      case '×': answer = a * b; break;
    }

    // Passo 3: Login
    const loginRes = await request(app)
      .post('/api/login')
      .send({
        username: 'admin',
        password: 'TrustDoc@2026',
        challengeId,
        captchaAnswer: answer
      });

    expect(loginRes.status).toBe(200);
    expect(loginRes.body.success).toBe(true);
    expect(loginRes.body.token).toBeDefined();
    expect(typeof loginRes.body.token).toBe('string');
    expect(loginRes.body.token.length).toBeGreaterThan(0);

    // Passo 4: Dashboard é acessível (arquivo estático)
    const dashRes = await request(app).get('/dashboard.html');
    expect(dashRes.status).toBe(200);
    expect(dashRes.text).toContain('TrustDoc');
  });
});

// ============================================================
describe('Dashboard CSS — Estilos Essenciais', () => {
  let css;

  beforeAll(async () => {
    const res = await request(app).get('/dashboard.css');
    css = res.text;
  });

  test('deve ter estilos responsivos para mobile', () => {
    expect(css).toContain('@media');
    expect(css).toContain('max-width: 768px');
  });

  test('deve ter estilos para a sidebar', () => {
    expect(css).toContain('.sidebar');
    expect(css).toContain('--sidebar-width');
  });

  test('deve ter estilos para documentos', () => {
    expect(css).toContain('.doc-card');
    expect(css).toContain('.documents-grid');
  });

  test('deve ter estilos para o editor', () => {
    expect(css).toContain('.editor-layout');
    expect(css).toContain('.editor-textarea');
  });

  test('deve ter estilos para badges de status', () => {
    expect(css).toContain('.badge-approved');
    expect(css).toContain('.badge-pending');
    expect(css).toContain('.badge-classified');
  });
});
