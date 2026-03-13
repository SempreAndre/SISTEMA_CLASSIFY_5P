# TrustDoc — Login Seguro de Documentos

Sistema de autenticação seguro com teclado virtual, CAPTCHA matemático e dashboard de gerenciamento de documentos confidenciais.

---

## Pré-requisitos

- [Node.js](https://nodejs.org/) (v16 ou superior)
- npm (incluído com o Node.js)

---

## Instalação

```bash
git clone <url-do-repositorio>
cd Classify
npm install
```

---

## Executar o Sistema

```bash
npm start
```

Acesse no navegador: **http://localhost:3001**

### Credenciais de Acesso

| Campo   | Valor              |
|---------|--------------------|
| Usuário | `admin`            |
| Senha   | `TrustDoc@2026`    |

>A senha deve ser digitada exclusivamente pelo **teclado virtual** na tela.

---

## Estrutura do Projeto

```
Classify/
├── server.js              # Backend Express (APIs + arquivos estáticos)
├── package.json           # Dependências e scripts
├── cypress.config.js      # Configuração do Cypress (testes E2E)
│
├── public/                # Frontend (servido pelo Express)
│   ├── index.html         # Página de login
│   ├── styles.css         # Estilos do login
│   ├── app.js             # Lógica do login (teclado virtual, CAPTCHA, fetch)
│   ├── dashboard.html     # Dashboard pós-login
│   ├── dashboard.css      # Estilos do dashboard
│   └── dashboard.js       # Lógica do dashboard (navegação, editor, logout)
│
├── tests/                 # Testes unitários (Jest + Supertest)
│   ├── login.test.js      # 43 testes — APIs, segurança, SQL injection
│   └── dashboard.test.js  # 36 testes — arquivos estáticos, estrutura, auth
│
└── cypress/               # Testes E2E visuais (Cypress)
    └── e2e/
        └── trustdoc.cy.js # 26 testes — fluxo completo no navegador
```

---

## Testes

### Testes Unitários (Jest)

Roda 79 testes de API, segurança e estrutura — sem precisar do servidor rodando.

```bash
npm test
```

**O que é testado:**
- API de CAPTCHA (`GET /api/captcha`)
- API de Login (`POST /api/login`)
- SQL Injection (6 payloads no username e senha)
- NoSQL Injection (`$gt`, `$ne`, `$or`)
- XSS (`<script>`, `onerror`, `<svg onload>`)
- Path Traversal, Command Injection, Buffer Overflow
- Prototype Pollution, Timing Attack
- Estrutura do Dashboard (sidebar, menus, editor, stats)
- Arquivos estáticos servidos corretamente

---

### Testes E2E com Cypress (visual)

Roda 26 testes no navegador — você assiste cada passo acontecendo em tempo real.

> O servidor precisa estar rodando em outro terminal (`npm start`) antes de executar o Cypress.

**Com interface visual (recomendado):**
```bash
npm run cypress:open
```
1. Selecione **"E2E Testing"**
2. Escolha o navegador (Chrome, Edge, etc.)
3. Clique em **`trustdoc.cy.js`**

**Modo headless (terminal):**
```bash
npm run cypress:run
```

**O que é testado:**
- Exibição e validação da página de login
- Teclado virtual (digitação, embaralhar, bloqueio de teclado físico)
- CAPTCHA (carregamento do servidor, refresh, resolução)
- Login com sucesso → redirecionamento ao dashboard
- Login com credenciais inválidas → mensagens de erro
- Dashboard: sidebar, stats, Ver/Editar Documentos, Favoritos, Recentes, Configurações
- Salvar documento no editor
- Logout e proteção de rota sem token

---

## APIs do Backend

| Método | Rota                 | Descrição                              |
|--------|----------------------|----------------------------------------|
| GET    | `/api/captcha`       | Gera um desafio CAPTCHA matemático     |
| POST   | `/api/verify-captcha`| Verifica a resposta do CAPTCHA         |
| POST   | `/api/login`         | Autentica com usuário, senha e CAPTCHA |

### Exemplo — Testar via `curl`

```bash
# 1. Obter CAPTCHA
curl http://localhost:3001/api/captcha

# 2. Fazer login (substituir CHALLENGE_ID e RESPOSTA)
curl -X POST http://localhost:3001/api/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"TrustDoc@2026","challengeId":"CHALLENGE_ID","captchaAnswer":"RESPOSTA"}'
```

---

## Recursos de Segurança

- **Teclado virtual** — previne keyloggers
- **CAPTCHA matemático** — proteção anti-robô
- **Senha em hash** — SHA-256 no backend
- **Embaralhamento de teclas** — posições aleatórias a cada carregamento
- **Bloqueio de teclado físico** — só aceita digitação via teclado virtual
- **Token por sessão** — autenticação via `sessionStorage`
- **CAPTCHA de uso único** — cada desafio só pode ser usado uma vez

---

## Scripts Disponíveis

| Comando                | Descrição                                |
|------------------------|------------------------------------------|
| `npm start`            | Inicia o servidor na porta 3001          |
| `npm test`             | Roda os 79 testes unitários (Jest)       |
| `npm run cypress:open` | Abre o Cypress com interface visual      |
| `npm run cypress:run`  | Roda os testes E2E no terminal (headless)|
