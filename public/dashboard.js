(() => {
  'use strict';

  // ===== AUTH CHECK =====
  const token = sessionStorage.getItem('trustdoc_token');
  if (!token) {
    window.location.href = '/';
    return;
  }

  // ===== DADOS DEMO =====
  const DOCUMENTS = [
    { id: 1, title: 'Relatório Financeiro Q4', date: '10 Mar 2026', status: 'approved', content: 'RELATÓRIO FINANCEIRO — Q4 2025\n\nResumo Executivo:\nA empresa registrou um crescimento de 15% no faturamento comparado ao trimestre anterior...\n\nReceita Total: R$ 2.450.000,00\nDespesas Operacionais: R$ 1.230.000,00\nLucro Líquido: R$ 890.000,00\n\nDestaques:\n- Expansão para 3 novas regiões\n- Redução de 8% nos custos operacionais\n- 45 novos clientes captados' },
    { id: 2, title: 'Contrato Fornecedor #127', date: '09 Mar 2026', status: 'approved', content: 'CONTRATO DE FORNECIMENTO Nº 127\n\nPARTES:\nContratante: TrustDoc LTDA\nContratado: Tech Solutions S.A.\n\nOBJETO:\nFornecimento de equipamentos de TI conforme especificações técnicas.\n\nVALOR: R$ 350.000,00\nVIGÊNCIA: 12 meses\n\nCLÁUSULAS...' },
    { id: 3, title: 'NDA — Parceiro Estratégico', date: '08 Mar 2026', status: 'pending', content: 'ACORDO DE CONFIDENCIALIDADE (NDA)\n\nAs partes abaixo qualificadas celebram o presente acordo de confidencialidade mútua...\n\n[DOCUMENTO PENDENTE DE REVISÃO]' },
    { id: 4, title: 'Plano Operacional 2026', date: '07 Mar 2026', status: 'classified', content: '[DOCUMENTO CLASSIFICADO]\n\nNível: CONFIDENCIAL\nAcesso restrito à diretoria executiva.\n\nConteúdo protegido por políticas de segurança da informação.' },
    { id: 5, title: 'Ata de Reunião — Diretoria', date: '06 Mar 2026', status: 'approved', content: 'ATA DA REUNIÃO DE DIRETORIA\n\nData: 06/03/2026\nPresentes: Dir. Executivo, Dir. Financeiro, Dir. Operações\n\nPauta:\n1. Aprovação do orçamento Q1\n2. Análise de indicadores\n3. Planejamento estratégico\n\nDeliberações:\n- Aprovado investimento em nova plataforma\n- Meta de crescimento definida em 20%' },
    { id: 6, title: 'Política de Segurança v3', date: '05 Mar 2026', status: 'approved', content: 'POLÍTICA DE SEGURANÇA DA INFORMAÇÃO\nVersão 3.0\n\n1. OBJETIVO\nEstabelecer diretrizes para proteção dos ativos de informação...\n\n2. CLASSIFICAÇÃO\n- Público\n- Interno\n- Confidencial\n- Restrito' },
    { id: 7, title: 'Laudo Técnico — Infraestrutura', date: '04 Mar 2026', status: 'pending', content: 'LAUDO TÉCNICO DE INFRAESTRUTURA\n\nObjeto: Avaliação da capacidade dos servidores\n\n[PENDENTE DE REVISÃO TÉCNICA]' },
    { id: 8, title: 'Parecer Jurídico #45', date: '03 Mar 2026', status: 'approved', content: 'PARECER JURÍDICO Nº 45/2026\n\nAssunto: Viabilidade de parceria estratégica\n\nConclusão: Parecer FAVORÁVEL, desde que observadas as cláusulas de compliance...' },
    { id: 9, title: 'Manual de Compliance', date: '02 Mar 2026', status: 'approved', content: 'MANUAL DE COMPLIANCE\n\n1. Código de Ética\n2. Política Anticorrupção\n3. Canal de Denúncias\n4. Due Diligence\n5. Treinamentos Obrigatórios' },
    { id: 10, title: 'Proposta Comercial — Projeto Alpha', date: '01 Mar 2026', status: 'pending', content: 'PROPOSTA COMERCIAL\n\nProjeto: Alpha\nCliente: [CONFIDENCIAL]\nValor estimado: R$ 1.200.000,00\n\n[AGUARDANDO APROVAÇÃO DA DIRETORIA]' },
    { id: 11, title: 'Relatório de Auditoria Interna', date: '28 Fev 2026', status: 'classified', content: '[DOCUMENTO CLASSIFICADO]\n\nRelatório de auditoria com achados sensíveis.\nAcesso restrito ao comitê de auditoria.' },
    { id: 12, title: 'Termo de Posse — Novo Diretor', date: '27 Fev 2026', status: 'approved', content: 'TERMO DE POSSE\n\nAos 27 dias do mês de fevereiro de 2026, tomou posse no cargo de Diretor de Tecnologia...' },
  ];

  // ===== ELEMENTOS =====
  const sidebar = document.getElementById('sidebar');
  const sidebarToggle = document.getElementById('sidebarToggle');
  const navItems = document.querySelectorAll('.nav-item');
  const pages = document.querySelectorAll('.page');
  const pageTitle = document.getElementById('pageTitle');
  const pageSubtitle = document.getElementById('pageSubtitle');
  const btnLogout = document.getElementById('btnLogout');
  const documentsGrid = document.getElementById('documentsGrid');
  const editorFileList = document.getElementById('editorFileList');
  const editorFilename = document.getElementById('editorFilename');
  const editorTextarea = document.getElementById('editorTextarea');
  const btnSaveDoc = document.getElementById('btnSaveDoc');
  const recentList = document.getElementById('recentList');
  const quickCards = document.querySelectorAll('.quick-card[data-navigate]');

  const PAGE_INFO = {
    inicio: { title: 'Início', subtitle: 'Visão geral dos seus documentos' },
    documentos: { title: 'Ver Documentos', subtitle: 'Navegue pelos documentos disponíveis' },
    editar: { title: 'Editar Documentos', subtitle: 'Selecione e edite documentos' },
    favoritos: { title: 'Favoritos', subtitle: 'Documentos marcados como favoritos' },
    recentes: { title: 'Recentes', subtitle: 'Últimos documentos acessados' },
    configuracoes: { title: 'Configurações', subtitle: 'Ajustes do sistema e perfil' },
  };

  // ===== NAVEGAÇÃO =====
  function navigateTo(pageId) {
    // Atualizar nav
    navItems.forEach(item => item.classList.remove('active'));
    const activeNav = document.querySelector(`[data-page="${pageId}"]`);
    if (activeNav) activeNav.classList.add('active');

    // Atualizar página
    pages.forEach(p => p.classList.remove('active'));
    const activePage = document.getElementById(`page-${pageId}`);
    if (activePage) {
      activePage.classList.remove('active');
      // Forçar reflow para re-trigger animação
      void activePage.offsetWidth;
      activePage.classList.add('active');
    }

    // Atualizar header
    const info = PAGE_INFO[pageId];
    if (info) {
      pageTitle.textContent = info.title;
      pageSubtitle.textContent = info.subtitle;
    }

    // Fechar sidebar mobile
    sidebar.classList.remove('open');
  }

  navItems.forEach(item => {
    item.addEventListener('click', () => {
      navigateTo(item.dataset.page);
    });
  });

  // Quick access cards
  quickCards.forEach(card => {
    card.addEventListener('click', () => {
      navigateTo(card.dataset.navigate);
    });
  });

  // ===== SIDEBAR TOGGLE (MOBILE) =====
  sidebarToggle.addEventListener('click', () => {
    sidebar.classList.toggle('open');
  });

  // Fechar sidebar ao clicar fora (mobile)
  document.addEventListener('click', (e) => {
    if (window.innerWidth <= 768 &&
        sidebar.classList.contains('open') &&
        !sidebar.contains(e.target) &&
        !sidebarToggle.contains(e.target)) {
      sidebar.classList.remove('open');
    }
  });

  // ===== LOGOUT =====
  btnLogout.addEventListener('click', () => {
    sessionStorage.removeItem('trustdoc_token');
    window.location.href = '/';
  });

  // ===== RENDER: DOCUMENTS GRID =====
  function renderDocuments() {
    documentsGrid.innerHTML = '';

    DOCUMENTS.forEach(doc => {
      const statusColors = {
        approved: 'green',
        pending: 'amber',
        classified: 'red'
      };
      const statusLabels = {
        approved: 'Aprovado',
        pending: 'Pendente',
        classified: 'Classificado'
      };
      const badgeClass = {
        approved: 'badge-approved',
        pending: 'badge-pending',
        classified: 'badge-classified'
      };

      const card = document.createElement('div');
      card.className = 'doc-card';
      card.innerHTML = `
        <div class="doc-card-icon stat-icon ${statusColors[doc.status]}">
          <svg viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
        </div>
        <div class="doc-card-title">${doc.title}</div>
        <div class="doc-card-meta">${doc.date}</div>
        <span class="doc-card-badge ${badgeClass[doc.status]}">${statusLabels[doc.status]}</span>
      `;

      card.addEventListener('click', () => {
        navigateTo('editar');
        setTimeout(() => selectEditorFile(doc.id), 100);
      });

      documentsGrid.appendChild(card);
    });
  }

  // ===== RENDER: EDITOR FILE LIST =====
  function renderEditorFiles() {
    editorFileList.innerHTML = '';

    DOCUMENTS.forEach(doc => {
      const btn = document.createElement('button');
      btn.className = 'editor-file';
      btn.dataset.id = doc.id;
      btn.innerHTML = `
        <svg viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
        <span>${doc.title}</span>
      `;

      btn.addEventListener('click', () => selectEditorFile(doc.id));
      editorFileList.appendChild(btn);
    });
  }

  function selectEditorFile(id) {
    const doc = DOCUMENTS.find(d => d.id === id);
    if (!doc) return;

    // Atualizar seleção
    document.querySelectorAll('.editor-file').forEach(f => f.classList.remove('active'));
    const activeFile = document.querySelector(`.editor-file[data-id="${id}"]`);
    if (activeFile) activeFile.classList.add('active');

    // Preencher editor
    editorFilename.textContent = doc.title;
    editorTextarea.value = doc.content;
    editorTextarea.disabled = false;
    btnSaveDoc.disabled = false;
  }

  // ===== SAVE DOC =====
  btnSaveDoc.addEventListener('click', () => {
    const activeFile = document.querySelector('.editor-file.active');
    if (!activeFile) return;

    const id = parseInt(activeFile.dataset.id);
    const doc = DOCUMENTS.find(d => d.id === id);
    if (doc) {
      doc.content = editorTextarea.value;
      btnSaveDoc.textContent = '✓ Salvo!';
      btnSaveDoc.style.color = 'var(--accent-green)';
      setTimeout(() => {
        btnSaveDoc.innerHTML = '<svg viewBox="0 0 24 24"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg> Salvar';
        btnSaveDoc.style.color = '';
      }, 2000);
    }
  });

  // ===== RENDER: RECENTES =====
  function renderRecent() {
    recentList.innerHTML = '';

    const recentDocs = DOCUMENTS.slice(0, 6);
    recentDocs.forEach(doc => {
      const item = document.createElement('div');
      item.className = 'recent-item';
      item.innerHTML = `
        <div class="recent-item-icon">
          <svg viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
        </div>
        <div class="recent-item-info">
          <span class="recent-item-title">${doc.title}</span>
          <span class="recent-item-time">${doc.date}</span>
        </div>
      `;

      item.addEventListener('click', () => {
        navigateTo('editar');
        setTimeout(() => selectEditorFile(doc.id), 100);
      });

      recentList.appendChild(item);
    });
  }

  // ===== INIT =====
  renderDocuments();
  renderEditorFiles();
  renderRecent();
})();
