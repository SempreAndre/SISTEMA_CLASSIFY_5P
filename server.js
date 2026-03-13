const express = require('express');
const cors = require('cors');
const crypto = require('crypto');
const path = require('path');

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

// Servir arquivos estáticos da pasta 'public'
app.use(express.static(path.join(__dirname, 'public')));

// ----- Armazenamento de desafios CAPTCHA em memória -----
const captchaChallenges = new Map();

// Credenciais válidas (demo)
const VALID_USERS = [
  { username: 'admin', password: 'TrustDoc@2026' }
];

// ----- Gerar desafio CAPTCHA -----
app.get('/api/captcha', (req, res) => {
  const operators = ['+', '-', '×'];
  const op = operators[Math.floor(Math.random() * operators.length)];

  let a, b, answer;

  switch (op) {
    case '+':
      a = Math.floor(Math.random() * 20) + 1;
      b = Math.floor(Math.random() * 20) + 1;
      answer = a + b;
      break;
    case '-':
      a = Math.floor(Math.random() * 20) + 10;
      b = Math.floor(Math.random() * a);
      answer = a - b;
      break;
    case '×':
      a = Math.floor(Math.random() * 10) + 1;
      b = Math.floor(Math.random() * 10) + 1;
      answer = a * b;
      break;
  }

  const challengeId = crypto.randomUUID();
  const hashedAnswer = crypto
    .createHash('sha256')
    .update(String(answer))
    .digest('hex');

  captchaChallenges.set(challengeId, {
    hashedAnswer,
    createdAt: Date.now()
  });

  // Limpar desafios antigos (mais de 5 minutos)
  for (const [id, challenge] of captchaChallenges.entries()) {
    if (Date.now() - challenge.createdAt > 5 * 60 * 1000) {
      captchaChallenges.delete(id);
    }
  }

  res.json({
    challengeId,
    question: `Quanto é ${a} ${op} ${b}?`
  });
});

// ----- Verificar CAPTCHA -----
app.post('/api/verify-captcha', (req, res) => {
  const { challengeId, answer } = req.body;

  if (!challengeId || answer === undefined || answer === null || answer === '') {
    return res.status(400).json({
      success: false,
      message: 'ID do desafio e resposta são obrigatórios.'
    });
  }

  const challenge = captchaChallenges.get(challengeId);

  if (!challenge) {
    return res.status(400).json({
      success: false,
      message: 'Desafio expirado ou inválido. Tente novamente.'
    });
  }

  const hashedInput = crypto
    .createHash('sha256')
    .update(String(answer))
    .digest('hex');

  if (hashedInput === challenge.hashedAnswer) {
    captchaChallenges.delete(challengeId);
    return res.json({ success: true, message: 'Verificação aprovada.' });
  }

  return res.status(400).json({
    success: false,
    message: 'Resposta incorreta. Tente novamente.'
  });
});

// ----- Login -----
app.post('/api/login', (req, res) => {
  const { username, password, challengeId, captchaAnswer } = req.body;

  // Validações do back-end
  if (!username || !password) {
    return res.status(400).json({
      success: false,
      message: 'Usuário e senha são obrigatórios.'
    });
  }

  if (password.length < 6) {
    return res.status(400).json({
      success: false,
      message: 'A senha deve ter pelo menos 6 caracteres.'
    });
  }

  // Verificar CAPTCHA
  if (!challengeId || captchaAnswer === undefined || captchaAnswer === null || captchaAnswer === '') {
    return res.status(400).json({
      success: false,
      message: 'Verificação anti-robô é obrigatória.'
    });
  }

  const challenge = captchaChallenges.get(challengeId);

  if (!challenge) {
    return res.status(400).json({
      success: false,
      message: 'Verificação expirada. Recarregue o CAPTCHA.'
    });
  }

  const hashedInput = crypto
    .createHash('sha256')
    .update(String(captchaAnswer))
    .digest('hex');

  if (hashedInput !== challenge.hashedAnswer) {
    return res.status(400).json({
      success: false,
      message: 'Resposta anti-robô incorreta.'
    });
  }

  // Remover desafio usado
  captchaChallenges.delete(challengeId);

  // Verificar credenciais
  const user = VALID_USERS.find(
    (u) => u.username === username && u.password === password
  );

  if (!user) {
    return res.status(401).json({
      success: false,
      message: 'Usuário ou senha inválidos.'
    });
  }

  // Gerar token simples
  const token = crypto.randomUUID();

  return res.json({
    success: true,
    message: 'Login realizado com sucesso!',
    token,
    user: { username: user.username }
  });
});

// Só inicia o servidor se executado diretamente (não via require/import nos testes)
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`[TrustDoc] Servidor rodando em http://localhost:${PORT}`);
  });
}

module.exports = { app, captchaChallenges };
