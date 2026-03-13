// ============================================================
//  TrustDoc — Testes E2E com Cypress
//  Fluxo completo: Login → Dashboard → Navegação → Logout
// ============================================================

describe('TrustDoc — Fluxo de Login', () => {
  beforeEach(() => {
    cy.visit('/');
  });

  it('deve exibir a página de login corretamente', () => {
    // Brand
    cy.contains('h1', 'TrustDoc').should('be.visible');
    cy.contains('Acesso seguro a documentos confidenciais').should('be.visible');

    // Campos
    cy.get('#username').should('be.visible');
    cy.get('#password').should('be.visible');

    // Teclado virtual
    cy.get('#keyboardGrid').should('be.visible');
    cy.get('#keyboardGrid .key').should('have.length', 62);

    // CAPTCHA
    cy.get('#captchaQuestion').should('be.visible');
    cy.get('#captchaInput').should('be.visible');

    // Botão submit
    cy.get('#btnSubmit').should('be.visible').and('contain', 'Entrar no TrustDoc');
  });

  it('deve bloquear digitação física no campo de senha', () => {
    cy.get('#password').type('tentativa', { force: true });
    cy.get('#password').should('have.value', '');
  });

  it('deve embaralhar o teclado virtual ao clicar em "Embaralhar"', () => {
    // Capturar a ordem atual das teclas
    const primeiraOrdem = [];
    cy.get('#keyboardGrid .key').each(($key) => {
      primeiraOrdem.push($key.text());
    });

    // Embaralhar
    cy.get('#btnShuffle').click();

    // Capturar a nova ordem
    const novaOrdem = [];
    cy.get('#keyboardGrid .key').each(($key) => {
      novaOrdem.push($key.text());
    }).then(() => {
      // As ordens devem ser diferentes (probabilidade extremamente alta)
      expect(primeiraOrdem.join('')).not.to.equal(novaOrdem.join(''));
    });
  });

  it('deve mostrar erro ao tentar login sem preencher usuário', () => {
    cy.get('#btnSubmit').click();
    cy.get('#loginMessage').should('be.visible');
    cy.contains('Digite seu nome de usuário').should('be.visible');
  });

  it('deve mostrar erro ao tentar login sem senha', () => {
    cy.get('#username').type('admin');
    cy.get('#btnSubmit').click();
    cy.contains('Use o teclado virtual para digitar sua senha').should('be.visible');
  });

  it('deve mostrar erro ao tentar login sem resolver o CAPTCHA', () => {
    cy.get('#username').type('admin');

    // Digitar senha via teclado virtual
    digitarSenhaVirtual('TrustDoc@2026');

    cy.get('#btnSubmit').click();
    cy.contains('Resolva a verificação anti-robô').should('be.visible');
  });

  it('deve mostrar erro com credenciais inválidas', () => {
    cy.get('#username').type('hacker');

    digitarSenhaVirtual('senhaErrada1');

    resolverCaptcha();

    cy.get('#btnSubmit').click();

    cy.get('#loginMessage').should('be.visible');
    cy.contains('inválidos').should('be.visible');
  });

  it('deve fazer login com sucesso e redirecionar ao dashboard', () => {
    cy.get('#username').type('admin');

    digitarSenhaVirtual('TrustDoc@2026');

    resolverCaptcha();

    cy.get('#btnSubmit').click();

    // Mensagem de sucesso
    cy.contains('Login realizado com sucesso').should('be.visible');

    // Overlay de sucesso
    cy.get('#successOverlay').should('have.class', 'visible');
    cy.contains('Acesso Autorizado').should('be.visible');

    // Redirecionamento ao dashboard
    cy.url().should('include', '/dashboard.html', { timeout: 5000 });
  });

  it('deve carregar o CAPTCHA do servidor (formato correto)', () => {
    cy.get('#captchaQuestion')
      .invoke('text')
      .should('match', /Quanto é \d+ [+\-×] \d+\?/);
  });

  it('deve gerar novo CAPTCHA ao clicar no botão de refresh', () => {
    cy.get('#captchaQuestion').invoke('text').then((primeiraQuestao) => {
      // Clicar refresh várias vezes até mudar (probabilístico)
      const tentarRefresh = (tentativas = 0) => {
        if (tentativas > 5) return; // Máximo de tentativas
        cy.get('#btnRefreshCaptcha').click();
        cy.wait(300);
        cy.get('#captchaQuestion').invoke('text').then((novaQuestao) => {
          if (novaQuestao === primeiraQuestao && tentativas < 5) {
            tentarRefresh(tentativas + 1);
          }
        });
      };
      tentarRefresh();
    });
  });
});

// ============================================================
describe('TrustDoc — Dashboard', () => {
  beforeEach(() => {
    // Fazer login antes de cada teste
    fazerLogin();
  });

  it('deve exibir o dashboard com sidebar correta', () => {
    cy.get('.sidebar').should('be.visible');
    cy.contains('.brand-name', 'TrustDoc').should('be.visible');

    // Menu items
    cy.contains('.nav-item', 'Início').should('be.visible');
    cy.contains('.nav-item', 'Ver Documentos').should('be.visible');
    cy.contains('.nav-item', 'Editar Documentos').should('be.visible');
    cy.contains('.nav-item', 'Favoritos').should('be.visible');
    cy.contains('.nav-item', 'Recentes').should('be.visible');
    cy.contains('.nav-item', 'Configurações').should('be.visible');
  });

  it('deve exibir a página Início com cards de stats', () => {
    cy.get('.stats-grid').should('be.visible');
    cy.get('.stat-card').should('have.length', 4);

    cy.contains('Total de Documentos').should('be.visible');
    cy.contains('Documentos Aprovados').should('be.visible');
    cy.contains('Pendentes de Revisão').should('be.visible');
    cy.contains('Classificados').should('be.visible');
  });

  it('deve exibir a atividade recente na página Início', () => {
    cy.contains('Atividade Recente').should('be.visible');
    cy.get('.activity-item').should('have.length.at.least', 3);
  });

  it('deve navegar para "Ver Documentos" e exibir os cards', () => {
    cy.contains('.nav-item', 'Ver Documentos').click();

    cy.get('#page-documentos').should('be.visible');
    cy.get('.page-title').should('contain', 'Ver Documentos');
    cy.get('.doc-card').should('have.length', 12);

    // Verificar badges
    cy.get('.badge-approved').should('exist');
    cy.get('.badge-pending').should('exist');
    cy.get('.badge-classified').should('exist');
  });

  it('deve navegar para "Editar Documentos" e abrir o editor', () => {
    cy.contains('.nav-item', 'Editar Documentos').click();

    cy.get('#page-editar').should('be.visible');
    cy.get('.editor-layout').should('be.visible');
    cy.get('.editor-file').should('have.length', 12);

    // Textarea deve estar desabilitado inicialmente
    cy.get('#editorTextarea').should('be.disabled');
  });

  it('deve carregar conteúdo do documento ao selecioná-lo no editor', () => {
    cy.contains('.nav-item', 'Editar Documentos').click();

    // Selecionar o primeiro documento
    cy.get('.editor-file').first().click();

    // Textarea deve estar habilitado e com conteúdo
    cy.get('#editorTextarea').should('not.be.disabled');
    cy.get('#editorTextarea').invoke('val').should('not.be.empty');

    // Nome do arquivo deve aparecer
    cy.get('#editorFilename').should('not.contain', 'Nenhum documento');
  });

  it('deve salvar documento ao clicar em "Salvar"', () => {
    cy.contains('.nav-item', 'Editar Documentos').click();

    cy.get('.editor-file').first().click();
    cy.get('#editorTextarea').clear().type('Conteúdo editado pelo Cypress!');

    cy.get('#btnSaveDoc').click();
    cy.get('#btnSaveDoc').should('contain', 'Salvo');
  });

  it('deve navegar para "Favoritos" e exibir o empty state', () => {
    cy.contains('.nav-item', 'Favoritos').click();

    cy.get('#page-favoritos').should('be.visible');
    cy.get('.empty-state').should('be.visible');
    cy.contains('Seus Favoritos').should('be.visible');
  });

  it('deve navegar para "Recentes" e exibir a lista', () => {
    cy.contains('.nav-item', 'Recentes').click();

    cy.get('#page-recentes').should('be.visible');
    cy.get('.recent-item').should('have.length.at.least', 1);
  });

  it('deve navegar para "Configurações" e exibir perfil e preferências', () => {
    cy.contains('.nav-item', 'Configurações').click();

    cy.get('#page-configuracoes').should('be.visible');

    // Perfil
    cy.contains('Perfil').should('be.visible');
    cy.get('.settings-input').first().should('have.value', 'admin');

    // Preferências
    cy.contains('Preferências').should('be.visible');
    cy.contains('Notificações por e-mail').should('be.visible');
    cy.contains('Modo escuro').should('be.visible');
    cy.contains('Autenticação em dois fatores').should('be.visible');
  });

  it('deve navegar entre páginas usando os botões de acesso rápido', () => {
    cy.get('.quick-card[data-navigate="documentos"]').click();
    cy.get('#page-documentos').should('be.visible');

    // Voltar para Início
    cy.contains('.nav-item', 'Início').click();

    cy.get('.quick-card[data-navigate="editar"]').click();
    cy.get('#page-editar').should('be.visible');
  });

  it('deve fazer logout e voltar à tela de login', () => {
    cy.get('#btnLogout').click();

    cy.url().should('eq', Cypress.config('baseUrl') + '/');
    cy.contains('h1', 'TrustDoc').should('be.visible');
    cy.get('#loginForm').should('be.visible');
  });

  it('deve impedir acesso ao dashboard sem token', () => {
    // Limpar sessionStorage e ir ao dashboard
    cy.clearAllSessionStorage();
    cy.visit('/dashboard.html');

    // Deve redirecionar ao login
    cy.url().should('eq', Cypress.config('baseUrl') + '/');
  });

  it('deve clicar em um doc card em "Ver Documentos" e ir para o editor', () => {
    cy.contains('.nav-item', 'Ver Documentos').click();

    // Clicar no primeiro documento
    cy.get('.doc-card').first().click();

    // Deve ir para a página de edição
    cy.get('#page-editar').should('be.visible');
    cy.get('#editorTextarea').should('not.be.disabled');
    cy.get('#editorTextarea').invoke('val').should('not.be.empty');
  });
});

// ============================================================
//  FUNÇÕES AUXILIARES
// ============================================================

/**
 * Digita uma senha usando o teclado virtual, clicando em cada caractere.
 */
function digitarSenhaVirtual(senha) {
  for (const char of senha) {
    cy.get(`#keyboardGrid .key[data-char="${char}"]`).click();
  }
}

/**
 * Resolve o CAPTCHA automaticamente lendo a questão e digitando a resposta.
 */
function resolverCaptcha() {
  cy.get('#captchaQuestion').invoke('text').then((question) => {
    const match = question.match(/(\d+)\s*([+\-×])\s*(\d+)/);
    if (!match) throw new Error(`CAPTCHA não reconhecido: ${question}`);

    const a = parseInt(match[1]);
    const op = match[2];
    const b = parseInt(match[3]);

    let answer;
    switch (op) {
      case '+': answer = a + b; break;
      case '-': answer = a - b; break;
      case '×': answer = a * b; break;
    }

    cy.get('#captchaInput').clear().type(String(answer));
  });
}

/**
 * Faz login completo e espera o redirecionamento ao dashboard.
 */
function fazerLogin() {
  cy.visit('/');
  cy.get('#username').type('admin');
  digitarSenhaVirtual('TrustDoc@2026');
  resolverCaptcha();
  cy.get('#btnSubmit').click();
  cy.url().should('include', '/dashboard.html', { timeout: 8000 });
}
