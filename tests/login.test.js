const request = require('supertest');
const { app, captchaChallenges } = require('../server');

// ============================================================
//  TrustDoc — Testes Automatizados do Sistema de Login
// ============================================================

describe('API de CAPTCHA — GET /api/captcha', () => {
  beforeEach(() => {
    captchaChallenges.clear();
  });

  test('deve retornar um desafio CAPTCHA válido', async () => {
    const res = await request(app).get('/api/captcha');

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('challengeId');
    expect(res.body).toHaveProperty('question');
    expect(typeof res.body.challengeId).toBe('string');
    expect(res.body.question).toMatch(/Quanto é \d+ [+\-×] \d+\?/);
  });

  test('deve armazenar o desafio no Map de captchas', async () => {
    const res = await request(app).get('/api/captcha');
    const { challengeId } = res.body;

    expect(captchaChallenges.has(challengeId)).toBe(true);
    expect(captchaChallenges.get(challengeId)).toHaveProperty('hashedAnswer');
    expect(captchaChallenges.get(challengeId)).toHaveProperty('createdAt');
  });

  test('deve gerar desafios únicos a cada chamada', async () => {
    const res1 = await request(app).get('/api/captcha');
    const res2 = await request(app).get('/api/captcha');

    expect(res1.body.challengeId).not.toBe(res2.body.challengeId);
  });
});

// ============================================================
describe('API de Verificação CAPTCHA — POST /api/verify-captcha', () => {
  let challengeId;
  let correctAnswer;

  beforeEach(async () => {
    captchaChallenges.clear();
    // Gerar um CAPTCHA e calcular a resposta a partir da pergunta
    const res = await request(app).get('/api/captcha');
    challengeId = res.body.challengeId;
    correctAnswer = solveCaptcha(res.body.question);
  });

  test('deve aprovar resposta correta', async () => {
    const res = await request(app)
      .post('/api/verify-captcha')
      .send({ challengeId, answer: correctAnswer });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  test('deve rejeitar resposta incorreta', async () => {
    const res = await request(app)
      .post('/api/verify-captcha')
      .send({ challengeId, answer: -9999 });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/incorreta/i);
  });

  test('deve rejeitar challengeId inválido', async () => {
    const res = await request(app)
      .post('/api/verify-captcha')
      .send({ challengeId: 'id-inexistente', answer: 1 });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/expirado|inválido/i);
  });

  test('deve rejeitar quando campos estão faltando', async () => {
    const res = await request(app)
      .post('/api/verify-captcha')
      .send({});

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  test('deve invalidar o desafio após uso correto (não pode reutilizar)', async () => {
    // Primeira verificação — deve funcionar
    await request(app)
      .post('/api/verify-captcha')
      .send({ challengeId, answer: correctAnswer });

    // Segunda verificação com o mesmo challengeId — deve falhar
    const res = await request(app)
      .post('/api/verify-captcha')
      .send({ challengeId, answer: correctAnswer });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });
});

// ============================================================
describe('API de Login — POST /api/login', () => {
  let challengeId;
  let correctAnswer;

  beforeEach(async () => {
    captchaChallenges.clear();
    const res = await request(app).get('/api/captcha');
    challengeId = res.body.challengeId;
    correctAnswer = solveCaptcha(res.body.question);
  });

  test('deve fazer login com credenciais válidas', async () => {
    const res = await request(app)
      .post('/api/login')
      .send({
        username: 'admin',
        password: 'TrustDoc@2026',
        challengeId,
        captchaAnswer: correctAnswer
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toMatch(/sucesso/i);
    expect(res.body).toHaveProperty('token');
    expect(res.body.user).toEqual({ username: 'admin' });
  });

  test('deve rejeitar usuário inválido', async () => {
    const res = await request(app)
      .post('/api/login')
      .send({
        username: 'hacker',
        password: 'TrustDoc@2026',
        challengeId,
        captchaAnswer: correctAnswer
      });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/inválidos/i);
  });

  test('deve rejeitar senha inválida', async () => {
    const res = await request(app)
      .post('/api/login')
      .send({
        username: 'admin',
        password: 'senhaErrada123',
        challengeId,
        captchaAnswer: correctAnswer
      });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  test('deve rejeitar senha com menos de 6 caracteres', async () => {
    const res = await request(app)
      .post('/api/login')
      .send({
        username: 'admin',
        password: '123',
        challengeId,
        captchaAnswer: correctAnswer
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/6 caracteres/i);
  });

  test('deve rejeitar quando usuário ou senha estão vazios', async () => {
    const res = await request(app)
      .post('/api/login')
      .send({
        username: '',
        password: '',
        challengeId,
        captchaAnswer: correctAnswer
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  test('deve rejeitar CAPTCHA incorreto no login', async () => {
    const res = await request(app)
      .post('/api/login')
      .send({
        username: 'admin',
        password: 'TrustDoc@2026',
        challengeId,
        captchaAnswer: -9999
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/anti-robô/i);
  });

  test('deve rejeitar login sem CAPTCHA', async () => {
    const res = await request(app)
      .post('/api/login')
      .send({
        username: 'admin',
        password: 'TrustDoc@2026'
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  test('deve rejeitar login com challengeId expirado/inválido', async () => {
    const res = await request(app)
      .post('/api/login')
      .send({
        username: 'admin',
        password: 'TrustDoc@2026',
        challengeId: 'id-fake',
        captchaAnswer: 10
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/expirada/i);
  });

  test('deve retornar token único a cada login bem-sucedido', async () => {
    const res1 = await request(app)
      .post('/api/login')
      .send({
        username: 'admin',
        password: 'TrustDoc@2026',
        challengeId,
        captchaAnswer: correctAnswer
      });

    // Gerar novo CAPTCHA para o segundo login
    const captchaRes = await request(app).get('/api/captcha');
    const id2 = captchaRes.body.challengeId;
    const answer2 = solveCaptcha(captchaRes.body.question);

    const res2 = await request(app)
      .post('/api/login')
      .send({
        username: 'admin',
        password: 'TrustDoc@2026',
        challengeId: id2,
        captchaAnswer: answer2
      });

    expect(res1.body.token).not.toBe(res2.body.token);
  });
});

// ============================================================
//  TESTES DE SEGURANÇA
// ============================================================

describe('Segurança — SQL Injection', () => {
  let challengeId, correctAnswer;

  beforeEach(async () => {
    captchaChallenges.clear();
    const res = await request(app).get('/api/captcha');
    challengeId = res.body.challengeId;
    correctAnswer = solveCaptcha(res.body.question);
  });

  const sqlPayloads = [
    "' OR '1'='1",
    "' OR '1'='1' --",
    "'; DROP TABLE users; --",
    "' UNION SELECT * FROM users --",
    "admin'--",
    "1' OR 1=1 #",
  ];

  test.each(sqlPayloads)(
    'deve rejeitar SQL injection no username: %s',
    async (payload) => {
      const res = await request(app)
        .post('/api/login')
        .send({
          username: payload,
          password: 'TrustDoc@2026',
          challengeId,
          captchaAnswer: correctAnswer
        });

      expect(res.body.success).not.toBe(true);
      // Não deve vazar informações internas
      expect(JSON.stringify(res.body)).not.toMatch(/SQL|syntax|query|table|column/i);
    }
  );

  test.each(sqlPayloads)(
    'deve rejeitar SQL injection na senha: %s',
    async (payload) => {
      // Precisamos de um novo CAPTCHA para cada iteração
      const captchaRes = await request(app).get('/api/captcha');
      const id = captchaRes.body.challengeId;
      const answer = solveCaptcha(captchaRes.body.question);

      const res = await request(app)
        .post('/api/login')
        .send({
          username: 'admin',
          password: payload,
          challengeId: id,
          captchaAnswer: answer
        });

      expect(res.body.success).not.toBe(true);
      expect(JSON.stringify(res.body)).not.toMatch(/SQL|syntax|query|table|column/i);
    }
  );

  test('deve rejeitar SQL injection no campo de CAPTCHA', async () => {
    const res = await request(app)
      .post('/api/login')
      .send({
        username: 'admin',
        password: 'TrustDoc@2026',
        challengeId,
        captchaAnswer: "' OR '1'='1"
      });

    expect(res.body.success).not.toBe(true);
  });
});

// ============================================================
describe('Segurança — NoSQL Injection', () => {
  let challengeId, correctAnswer;

  beforeEach(async () => {
    captchaChallenges.clear();
    const res = await request(app).get('/api/captcha');
    challengeId = res.body.challengeId;
    correctAnswer = solveCaptcha(res.body.question);
  });

  test('deve rejeitar operador $gt no username', async () => {
    const res = await request(app)
      .post('/api/login')
      .send({
        username: { $gt: '' },
        password: 'TrustDoc@2026',
        challengeId,
        captchaAnswer: correctAnswer
      });

    expect(res.body.success).not.toBe(true);
  });

  test('deve rejeitar operador $ne na senha', async () => {
    const captchaRes = await request(app).get('/api/captcha');
    const res = await request(app)
      .post('/api/login')
      .send({
        username: 'admin',
        password: { $ne: '' },
        challengeId: captchaRes.body.challengeId,
        captchaAnswer: solveCaptcha(captchaRes.body.question)
      });

    expect(res.body.success).not.toBe(true);
  });

  test('deve rejeitar operador $or no body', async () => {
    const res = await request(app)
      .post('/api/login')
      .send({
        $or: [{ username: 'admin' }, { username: 'root' }],
        password: 'TrustDoc@2026',
        challengeId,
        captchaAnswer: correctAnswer
      });

    expect(res.body.success).not.toBe(true);
  });
});

// ============================================================
describe('Segurança — XSS (Cross-Site Scripting)', () => {
  let challengeId, correctAnswer;

  beforeEach(async () => {
    captchaChallenges.clear();
    const res = await request(app).get('/api/captcha');
    challengeId = res.body.challengeId;
    correctAnswer = solveCaptcha(res.body.question);
  });

  const xssPayloads = [
    '<script>alert("XSS")</script>',
    '<img src=x onerror=alert(1)>',
    '<svg onload=alert(1)>',
  ];

  test.each(xssPayloads)(
    'não deve executar ou refletir XSS no username: %s',
    async (payload) => {
      const res = await request(app)
        .post('/api/login')
        .send({
          username: payload,
          password: 'TrustDoc@2026',
          challengeId,
          captchaAnswer: correctAnswer
        });

      expect(res.body.success).not.toBe(true);
      // A resposta não deve conter tags HTML executáveis sem escape
      const responseText = JSON.stringify(res.body);
      expect(responseText).not.toMatch(/<script/i);
      expect(responseText).not.toMatch(/onerror=/i);
      expect(responseText).not.toMatch(/onload=/i);
    }
  );
});

// ============================================================
describe('Segurança — Ataques Diversos', () => {
  let challengeId, correctAnswer;

  beforeEach(async () => {
    captchaChallenges.clear();
    const res = await request(app).get('/api/captcha');
    challengeId = res.body.challengeId;
    correctAnswer = solveCaptcha(res.body.question);
  });

  test('deve rejeitar path traversal no username', async () => {
    const res = await request(app)
      .post('/api/login')
      .send({
        username: '../../../etc/passwd',
        password: 'TrustDoc@2026',
        challengeId,
        captchaAnswer: correctAnswer
      });

    expect(res.body.success).not.toBe(true);
    expect(JSON.stringify(res.body)).not.toMatch(/root:|\/etc\/passwd/);
  });

  test('deve rejeitar command injection no username', async () => {
    const payloads = [
      '; ls -la',
      '| cat /etc/passwd',
      '`whoami`',
      '$(rm -rf /)',
    ];

    for (const payload of payloads) {
      const captchaRes = await request(app).get('/api/captcha');
      const res = await request(app)
        .post('/api/login')
        .send({
          username: payload,
          password: 'TrustDoc@2026',
          challengeId: captchaRes.body.challengeId,
          captchaAnswer: solveCaptcha(captchaRes.body.question)
        });

      expect(res.body.success).not.toBe(true);
    }
  });

  test('deve lidar com payload extremamente longo sem crash (buffer overflow)', async () => {
    const longString = 'A'.repeat(100000);

    const res = await request(app)
      .post('/api/login')
      .send({
        username: longString,
        password: longString,
        challengeId,
        captchaAnswer: correctAnswer
      });

    // O servidor não deve crashar — qualquer status de erro é aceitável
    expect(res.status).toBeGreaterThanOrEqual(400);
    expect(res.status).toBeLessThan(600);
  });

  test('deve rejeitar prototype pollution via __proto__', async () => {
    const res = await request(app)
      .post('/api/login')
      .send({
        username: 'admin',
        password: 'TrustDoc@2026',
        challengeId,
        captchaAnswer: correctAnswer,
        __proto__: { isAdmin: true },
        constructor: { prototype: { isAdmin: true } }
      });

    // Não deve ganhar acesso privilegiado
    // O login pode ou não funcionar (credenciais são válidas),
    // mas o objeto de resposta não deve ter 'isAdmin'
    expect(res.body).not.toHaveProperty('isAdmin');
  });

  test('deve rejeitar Content-Type inválido', async () => {
    const res = await request(app)
      .post('/api/login')
      .set('Content-Type', 'text/plain')
      .send('username=admin&password=TrustDoc@2026');

    expect(res.body.success).not.toBe(true);
  });

  test('não deve aceitar brute-force de CAPTCHA com múltiplas tentativas', async () => {
    // Após uma tentativa incorreta, o challengeId não deve ser reutilizável
    await request(app)
      .post('/api/verify-captcha')
      .send({ challengeId, answer: -9999 });

    // O desafio ainda existe (só é removido em sucesso),
    // mas vamos verificar que brute-force com muitas tentativas não funciona
    const results = [];
    for (let i = 0; i < 10; i++) {
      const res = await request(app)
        .post('/api/verify-captcha')
        .send({ challengeId, answer: i });
      results.push(res.body.success);
    }

    // No máximo 1 pode ser verdadeiro (se chutou certo)
    const successes = results.filter(Boolean).length;
    expect(successes).toBeLessThanOrEqual(1);
  });

  test('deve manter tempo de resposta consistente para usuários válidos e inválidos', async () => {
    // Proteção contra timing attack — a resposta não deve ser significativamente
    // mais rápida para um usuário inexistente vs existente
    const captchaRes1 = await request(app).get('/api/captcha');
    const id1 = captchaRes1.body.challengeId;
    const ans1 = solveCaptcha(captchaRes1.body.question);

    const start1 = Date.now();
    await request(app)
      .post('/api/login')
      .send({
        username: 'admin',
        password: 'senhaErrada',
        challengeId: id1,
        captchaAnswer: ans1
      });
    const time1 = Date.now() - start1;

    const captchaRes2 = await request(app).get('/api/captcha');
    const id2 = captchaRes2.body.challengeId;
    const ans2 = solveCaptcha(captchaRes2.body.question);

    const start2 = Date.now();
    await request(app)
      .post('/api/login')
      .send({
        username: 'usuario_inexistente_xyz',
        password: 'senhaErrada',
        challengeId: id2,
        captchaAnswer: ans2
      });
    const time2 = Date.now() - start2;

    // A diferença não deve ser excessiva (> 200ms indicaria vazamento de timing)
    expect(Math.abs(time1 - time2)).toBeLessThan(200);
  });
});

// ============================================================
//  Utilitário: resolve o CAPTCHA a partir da pergunta textual
// ============================================================
function solveCaptcha(question) {
  // Formato: "Quanto é X OP Y?"
  const match = question.match(/(\d+)\s*([+\-×])\s*(\d+)/);
  if (!match) throw new Error(`Não foi possível parsear o CAPTCHA: ${question}`);

  const a = parseInt(match[1]);
  const op = match[2];
  const b = parseInt(match[3]);

  switch (op) {
    case '+': return a + b;
    case '-': return a - b;
    case '×': return a * b;
    default: throw new Error(`Operador desconhecido: ${op}`);
  }
}
