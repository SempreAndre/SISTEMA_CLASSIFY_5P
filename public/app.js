(() => {
  'use strict';

  // ===== CONFIGURAÇÃO =====
  const API_BASE = ''; // Mesmo servidor (Express serve tudo)

  const KEYBOARD_CHARS = [
    '0','1','2','3','4','5','6','7','8','9',
    'a','b','c','d','e','f','g','h','i','j',
    'k','l','m','n','o','p','q','r','s','t',
    'u','v','w','x','y','z',
    'A','B','C','D','E','F','G','H','I','J',
    'K','L','M','N','O','P','Q','R','S','T',
    'U','V','W','X','Y','Z',
    '@','#','$','!','&','*','?','+','-','_'
  ];

  // ===== ELEMENTOS =====
  const form = document.getElementById('loginForm');
  const usernameInput = document.getElementById('username');
  const passwordInput = document.getElementById('password');
  const keyboardGrid = document.getElementById('keyboardGrid');
  const btnBackspace = document.getElementById('btnBackspace');
  const btnClear = document.getElementById('btnClear');
  const btnShuffle = document.getElementById('btnShuffle');
  const captchaQuestion = document.getElementById('captchaQuestion');
  const captchaInput = document.getElementById('captchaInput');
  const btnRefreshCaptcha = document.getElementById('btnRefreshCaptcha');
  const btnSubmit = document.getElementById('btnSubmit');
  const loginMessage = document.getElementById('loginMessage');
  const messageText = document.getElementById('messageText');
  const successOverlay = document.getElementById('successOverlay');

  let passwordValue = '';
  let currentChallengeId = null;

  // ===== BLOQUEAR TECLADO FÍSICO NO CAMPO DE SENHA =====
  passwordInput.addEventListener('keydown', (e) => e.preventDefault());
  passwordInput.addEventListener('keypress', (e) => e.preventDefault());
  passwordInput.addEventListener('keyup', (e) => e.preventDefault());
  passwordInput.addEventListener('paste', (e) => e.preventDefault());
  passwordInput.addEventListener('drop', (e) => e.preventDefault());
  passwordInput.addEventListener('input', (e) => {
    e.preventDefault();
    passwordInput.value = '•'.repeat(passwordValue.length);
  });

  // ===== TECLADO VIRTUAL =====
  function shuffleArray(arr) {
    const shuffled = [...arr];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  function renderKeyboard() {
    const chars = shuffleArray(KEYBOARD_CHARS);
    keyboardGrid.innerHTML = '';

    chars.forEach((char) => {
      const key = document.createElement('button');
      key.type = 'button';
      key.className = 'key';
      key.textContent = char;
      key.setAttribute('data-char', char);

      key.addEventListener('click', () => {
        passwordValue += char;
        passwordInput.value = '•'.repeat(passwordValue.length);
        key.classList.add('pressed');
        setTimeout(() => key.classList.remove('pressed'), 150);
        hideMessage();
      });

      keyboardGrid.appendChild(key);
    });
  }

  btnBackspace.addEventListener('click', () => {
    if (passwordValue.length > 0) {
      passwordValue = passwordValue.slice(0, -1);
      passwordInput.value = '•'.repeat(passwordValue.length);
      hideMessage();
    }
  });

  btnClear.addEventListener('click', () => {
    passwordValue = '';
    passwordInput.value = '';
    hideMessage();
  });

  btnShuffle.addEventListener('click', () => {
    renderKeyboard();
  });

  // ===== CAPTCHA (VIA API DO BACKEND) =====
  async function fetchCaptcha() {
    try {
      const res = await fetch(`${API_BASE}/api/captcha`);
      const data = await res.json();

      currentChallengeId = data.challengeId;
      captchaQuestion.textContent = data.question;
      captchaInput.value = '';
      captchaInput.classList.remove('error');

      // Animação refresh
      btnRefreshCaptcha.classList.add('spinning');
      setTimeout(() => btnRefreshCaptcha.classList.remove('spinning'), 500);
    } catch (err) {
      captchaQuestion.textContent = 'Erro ao carregar';
      console.error('Erro ao buscar CAPTCHA:', err);
    }
  }

  btnRefreshCaptcha.addEventListener('click', () => {
    fetchCaptcha();
    hideMessage();
  });

  // ===== MENSAGENS =====
  function showMessage(text, type = 'error') {
    loginMessage.className = `message visible ${type}`;
    messageText.textContent = text;

    // Atualizar ícone
    const svg = loginMessage.querySelector('svg');
    if (type === 'error') {
      svg.innerHTML = '<circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />';
    } else {
      svg.innerHTML = '<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" />';
    }
  }

  function hideMessage() {
    loginMessage.className = 'message';
  }

  // ===== VALIDAÇÃO FRONT-END =====
  function validateFrontEnd() {
    const username = usernameInput.value.trim();

    if (!username) {
      usernameInput.classList.add('error');
      setTimeout(() => usernameInput.classList.remove('error'), 600);
      showMessage('Digite seu nome de usuário.');
      usernameInput.focus();
      return false;
    }

    if (passwordValue.length === 0) {
      passwordInput.classList.add('error');
      setTimeout(() => passwordInput.classList.remove('error'), 600);
      showMessage('Use o teclado virtual para digitar sua senha.');
      return false;
    }

    if (passwordValue.length < 6) {
      passwordInput.classList.add('error');
      setTimeout(() => passwordInput.classList.remove('error'), 600);
      showMessage('A senha deve ter pelo menos 6 caracteres.');
      return false;
    }

    const captchaAnswer = captchaInput.value.trim();
    if (!captchaAnswer) {
      captchaInput.classList.add('error');
      setTimeout(() => captchaInput.classList.remove('error'), 600);
      showMessage('Resolva a verificação anti-robô.');
      captchaInput.focus();
      return false;
    }

    return true;
  }

  // ===== SUBMIT (AGORA CHAMA O BACKEND REAL) =====
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    hideMessage();

    // Validação front-end
    if (!validateFrontEnd()) return;

    // Loading state
    btnSubmit.disabled = true;
    btnSubmit.classList.add('loading');

    try {
      const res = await fetch(`${API_BASE}/api/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: usernameInput.value.trim(),
          password: passwordValue,
          challengeId: currentChallengeId,
          captchaAnswer: captchaInput.value.trim()
        })
      });

      const result = await res.json();

      if (result.success) {
        showMessage(result.message, 'success');

        // Salvar token no sessionStorage
        if (result.token) {
          sessionStorage.setItem('trustdoc_token', result.token);
        }

        // Mostrar overlay de sucesso após 500ms
        setTimeout(() => {
          successOverlay.classList.add('visible');

          // Redirecionar para o dashboard após 1.5s
          setTimeout(() => {
            window.location.href = '/dashboard.html';
          }, 1500);
        }, 600);
      } else {
        showMessage(result.message, 'error');
        fetchCaptcha();

        // Reset loading
        btnSubmit.disabled = false;
        btnSubmit.classList.remove('loading');
      }
    } catch (err) {
      showMessage('Erro de conexão. Tente novamente.', 'error');
      btnSubmit.disabled = false;
      btnSubmit.classList.remove('loading');
    }
  });

  // ===== INICIALIZAR =====
  renderKeyboard();
  fetchCaptcha();

  // Foco no campo de usuário
  setTimeout(() => usernameInput.focus(), 300);
})();
