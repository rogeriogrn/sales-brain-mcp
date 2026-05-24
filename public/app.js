// Estado Global da Central de Inteligência
let allLeads = []; // Cache local de leads para busca rápida
let activeLeadId = null;
let activeLeadExternalId = null;
let activeLeadName = null;
let activeTab = 'hot';
let currentLeadMemories = { hot: [], profile: [], audit: [] };

// Atributos RPG Comportamentais (Definição de Eixos da Persona)
const personaEixesDefinition = [
  { key: 'directness', label: '🛡️ Diretividade (Foco/Ataque)', group: 'communication', color: 'bg-emerald-500' },
  { key: 'verbosity', label: '💬 Verbosidade (Fôlego)', group: 'communication', color: 'bg-sky-400' },
  { key: 'analytical', label: '🧠 Perfil Analítico (Raciocínio)', group: 'communication', color: 'bg-indigo-400' },
  { key: 'emotionality', label: '🎭 Emocionalidade (Impulso)', group: 'communication', color: 'bg-pink-400' },
  { key: 'price_sensitivity', label: '💰 Sensibilidade a Preço (Defesa)', group: 'decision', color: 'bg-amber-400' },
  { key: 'trust_gap', label: '🔍 Fenda de Desconfiança (Bloqueio)', group: 'decision', color: 'bg-rose-500' },
  { key: 'urgency', label: '⏳ Senso de Urgência (Agilidade)', group: 'decision', color: 'bg-emerald-400 glow-green' },
  { key: 'decision_speed', label: '⚡ Velocidade de Decisão (Aceleração)', group: 'decision', color: 'bg-yellow-400' }
];

// Inicialização da central de controle
document.addEventListener('DOMContentLoaded', () => {
  initSecurity();
  setupEventListeners();
  loadLeads();
  loadDashboardStats();
});

// 1. GERENCIADOR DE CHAVE DE API (localStorage)
function initSecurity() {
  const apiKey = localStorage.getItem('sb_api_key');
  const apiStatus = document.getElementById('api-key-status');
  
  if (!apiKey) {
    apiStatus.textContent = 'NÃO CONFIGURADO';
    apiStatus.className = 'text-xs font-mono text-rose-500 font-bold';
    showApiKeyModal();
  } else {
    apiStatus.textContent = 'ATIVO';
    apiStatus.className = 'text-xs font-mono text-emerald-400 font-bold';
  }
}

function showApiKeyModal() {
  const modal = document.getElementById('modal-api-key');
  const input = document.getElementById('modal-api-key-input');
  const savedKey = localStorage.getItem('sb_api_key');
  
  if (savedKey) {
    input.value = savedKey;
  }
  
  modal.showModal();
}

function getHeaders() {
  const apiKey = localStorage.getItem('sb_api_key') || '';
  return {
    'Content-Type': 'application/json',
    'X-API-Key': apiKey
  };
}

// 2. SISTEMA DE NOTIFICAÇÕES TOAST (Elegância HUD)
function showToast(message, type = 'success') {
  const container = document.getElementById('toast-container');
  const toast = document.createElement('div');
  
  // Cores baseadas no tipo de feedback do sistema
  let bgBorderClass = 'bg-zinc-900 border-emerald-500/30 text-zinc-100 glow-green';
  let icon = '⚡';
  
  if (type === 'error') {
    bgBorderClass = 'bg-zinc-900 border-rose-500/30 text-rose-400';
    icon = '🚨';
  } else if (type === 'warning') {
    bgBorderClass = 'bg-zinc-900 border-amber-500/30 text-amber-400 glow-amber';
    icon = '⚠️';
  } else if (type === 'info') {
    bgBorderClass = 'bg-zinc-900 border-sky-500/30 text-sky-400';
    icon = 'ℹ️';
  }
  
  toast.className = `flex items-center gap-3 border p-4 rounded-xs shadow-2xl transition-all duration-300 transform translate-x-8 opacity-0 font-mono text-xs ${bgBorderClass} pointer-events-auto`;
  toast.innerHTML = `
    <span class="text-base">${icon}</span>
    <div class="flex-1">${message}</div>
    <button class="text-zinc-500 hover:text-zinc-300 transition-colors ml-2 font-bold cursor-pointer" onclick="this.parentElement.remove()">[X]</button>
  `;
  
  container.appendChild(toast);
  
  // Traciona a animação de entrada
  setTimeout(() => {
    toast.classList.remove('translate-x-8', 'opacity-0');
  }, 10);
  
  // Auto-destruição após 4 segundos
  setTimeout(() => {
    toast.classList.add('translate-x-8', 'opacity-0');
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}

// Utilitário para gerar Turn IDs simulando mensageria real
function generateUniqueTurnId() {
  return 'turn_web_' + Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
}

// 3. LISTENERS GERAIS DE EVENTOS DO HUD
function setupEventListeners() {
  // Modal de API Key
  const btnChangeKey = document.getElementById('btn-change-api-key');
  const formApiKey = document.getElementById('form-api-key');
  
  btnChangeKey.addEventListener('click', showApiKeyModal);
  
  formApiKey.addEventListener('submit', (e) => {
    e.preventDefault();
    const key = document.getElementById('modal-api-key-input').value.trim();
    
    if (key) {
      localStorage.setItem('sb_api_key', key);
      initSecurity();
      document.getElementById('modal-api-key').close();
      showToast('Token de Segurança atualizado com sucesso!', 'success');
      loadLeads();
      loadDashboardStats();
    } else {
      showToast('Por favor, insira um token válido.', 'error');
    }
  });

  // Modal de Recrutamento de Lead
  const modalLead = document.getElementById('modal-lead');
  const btnNewLead = document.getElementById('btn-new-lead');
  const btnCloseModal = document.getElementById('modal-close-btn');
  const formLead = document.getElementById('form-new-lead');

  btnNewLead.addEventListener('click', () => modalLead.showModal());
  btnCloseModal.addEventListener('click', () => modalLead.close());

  formLead.addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = document.getElementById('lead-name-input').value.trim();
    const externalId = document.getElementById('lead-ext-input').value.trim();

    try {
      // Inicia o lead com um turn de sistema para forçar criação em banco
      const response = await fetch('/v1/turns/ingest', {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({
          turnId: generateUniqueTurnId(),
          leadExternalId: externalId,
          leadName: name,
          conversationExternalId: 'conv_init_' + externalId,
          role: 'system',
          content: `Lead ${name} recrutado e inicializado na central de comando.`
        })
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.message || 'Erro ao recrutar lead');
      }

      formLead.reset();
      modalLead.close();
      showToast(`Combatente ${name} recrutado com sucesso!`, 'success');
      
      // Recarrega leads e estatísticas
      await loadLeads();
      await loadDashboardStats();
      
      const newLead = allLeads.find(l => l.externalId === externalId);
      if (newLead) {
        selectLead(newLead.id, newLead.externalId, newLead.name);
      }
    } catch (err) {
      showToast(`Falha ao recrutar combatente: ${err.message}`, 'error');
    }
  });

  // Input de Busca
  document.getElementById('lead-search').addEventListener('input', (e) => {
    filterLeads(e.target.value.trim());
  });

  // Envio de turnos no Chat Playground
  const chatForm = document.getElementById('chat-form');
  chatForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const input = document.getElementById('chat-input');
    const submitBtn = document.getElementById('chat-submit');
    const content = input.value.trim();

    if (!content || !activeLeadExternalId) return;

    input.disabled = true;
    submitBtn.disabled = true;

    try {
      const response = await fetch('/v1/turns/ingest', {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({
          turnId: generateUniqueTurnId(),
          leadExternalId: activeLeadExternalId,
          leadName: activeLeadName,
          conversationExternalId: 'conv_' + activeLeadExternalId,
          role: 'user',
          content: content,
          metadata: { source_app: 'admin-playground' }
        })
      });

      if (!response.ok) {
        throw new Error('Não foi possível processar a mensagem na central.');
      }

      input.value = '';
      showToast('Turno de mensagem ingerido! Recalibrando inteligência...', 'info');
      
      // Recarrega dados e estatísticas
      await refreshActiveLeadData();
      await loadDashboardStats();
    } catch (err) {
      showToast(`Erro no envio: ${err.message}`, 'error');
    } finally {
      input.disabled = false;
      submitBtn.disabled = false;
      input.focus();
    }
  });
}

// 4. LOADER DE STATS DO DASHBOARD (Novos Endpoints reais)
async function loadDashboardStats() {
  try {
    const res = await fetch('/v1/admin/stats', { headers: getHeaders() });
    if (!res.ok) throw new Error();
    
    const stats = await res.json();
    
    // Atualiza os contadores
    document.getElementById('kpi-total-leads').textContent = stats.totalLeads || 0;
    document.getElementById('kpi-turns-today').textContent = stats.turnsToday || 0;
    document.getElementById('kpi-active-objections').textContent = stats.funnelDistribution?.OBJECTION_HANDLING || 0;
    document.getElementById('kpi-closing-leads').textContent = stats.funnelDistribution?.CLOSING || 0;
  } catch (err) {
    console.error('Falha ao carregar métricas administrativas do painel:', err);
  }
}

// 5. LISTAR LEADS COM FILTROS E SKELETON
async function loadLeads() {
  const container = document.getElementById('leads-list');
  
  try {
    const response = await fetch('/v1/leads', { headers: getHeaders() });

    if (!response.ok) {
      if (response.status === 401) {
        container.innerHTML = `<div class="text-xs text-rose-400 font-mono py-4 text-center border border-rose-500/20 bg-rose-950/20">CREDENCIAIS INVÁLIDAS. VERIFIQUE SUA API KEY.</div>`;
        return;
      }
      throw new Error();
    }

    allLeads = await response.json();
    renderLeadsList(allLeads);
    
    // Seletor inicial automático
    if (activeLeadId) {
      highlightActiveLead(activeLeadId);
    }
  } catch (err) {
    container.innerHTML = `<div class="text-xs text-rose-500 font-mono py-4 text-center border border-rose-500/20 bg-rose-950/20">FALHA AO CONECTAR COM A ENGINE.</div>`;
  }
}

function renderLeadsList(leads) {
  const container = document.getElementById('leads-list');
  const searchCount = document.getElementById('search-count');
  
  searchCount.textContent = `${leads.length} de ${allLeads.length} leads`;
  
  if (leads.length === 0) {
    container.innerHTML = `<div class="text-xs text-zinc-500 font-mono py-4 text-center border border-zinc-800 bg-zinc-900/20">NENHUM LEAD CONFORME FILTRO.</div>`;
    return;
  }

  container.innerHTML = leads.map(lead => {
    // Definir pontinho de humor baseado no status do lead
    let dotColor = 'bg-sky-400';
    if (lead.status === 'closing') dotColor = 'bg-emerald-400 glow-green';
    else if (lead.status === 'objections') dotColor = 'bg-amber-500 glow-amber';

    return `
      <button 
        onclick="selectLead('${lead.id}', '${lead.externalId}', '${lead.name}')"
        id="btn-lead-${lead.id}"
        class="lead-select-btn w-full text-left text-xs px-3.5 py-3 rounded-xs hover:bg-zinc-900 transition-all font-medium border border-zinc-850 flex items-center justify-between gap-2 cursor-pointer bg-zinc-900/40"
      >
        <div class="flex flex-col gap-0.5">
          <span class="text-zinc-100 font-bold font-display text-xs">${lead.name}</span>
          <span class="text-[9px] text-zinc-500 font-mono tracking-tight">${lead.externalId}</span>
        </div>
        <span class="h-2 w-2 rounded-full ${dotColor}"></span>
      </button>
    `;
  }).join('');
}

function filterLeads(query) {
  if (!query) {
    renderLeadsList(allLeads);
    return;
  }
  
  const lowerQuery = query.toLowerCase();
  const filtered = allLeads.filter(lead => 
    lead.name.toLowerCase().includes(lowerQuery) || 
    lead.externalId.toLowerCase().includes(lowerQuery)
  );
  
  renderLeadsList(filtered);
}

function highlightActiveLead(leadId) {
  document.querySelectorAll('.lead-select-btn').forEach(btn => {
    btn.classList.remove('bg-zinc-900', 'border-emerald-500/50', 'bg-zinc-800/80');
    btn.classList.add('bg-zinc-900/40');
  });

  const activeBtn = document.getElementById(`btn-lead-${leadId}`);
  if (activeBtn) {
    activeBtn.classList.remove('bg-zinc-900/40');
    activeBtn.classList.add('bg-zinc-800/80', 'border-emerald-500/50');
  }
}

// 6. SELEÇÃO DE LEAD (Com disparos assíncronos e Skeleton)
async function selectLead(leadId, externalId, name) {
  activeLeadId = leadId;
  activeLeadExternalId = externalId;
  activeLeadName = name;

  highlightActiveLead(leadId);
  showToast(`Combatente selecionado: ${name}. Sincronizando ficha...`, 'info');

  // Habilita contêineres principais
  const panel = document.getElementById('intelligence-panel');
  panel.classList.remove('opacity-40', 'pointer-events-none');
  
  document.getElementById('chat-input').disabled = false;
  document.getElementById('chat-submit').disabled = false;
  document.getElementById('chat-lead-badge').textContent = name.toUpperCase();

  // Iniciais do Avatar RPG
  const initials = name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  document.getElementById('char-initials').textContent = initials;
  document.getElementById('lead-name-title').textContent = name;
  document.getElementById('lead-id-subtitle').textContent = `UUID: ${leadId} | CONEXÃO: ${externalId}`;

  // Coloca placeholders de Skeletons nas áreas
  document.getElementById('persona-eixes').innerHTML = `
    <div class="flex flex-col gap-3 w-full">
      <div class="h-6 skeleton rounded-xs opacity-60"></div>
      <div class="h-6 skeleton rounded-xs opacity-40"></div>
      <div class="h-6 skeleton rounded-xs opacity-20"></div>
    </div>
  `;

  await refreshActiveLeadData();
}

// 7. CARREGAMENTO E ATUALIZAÇÃO DOS DADOS DE INTELIGÊNCIA COMERCIAL
async function refreshActiveLeadData() {
  if (!activeLeadId) return;

  try {
    const headers = getHeaders();
    
    // Dispara requests paralelos (Excelente performance)
    const [resPersona, resReply, resMemory] = await Promise.all([
      fetch(`/v1/leads/${activeLeadId}/persona`, { headers }),
      fetch(`/v1/leads/${activeLeadId}/reply/recommend`, { headers }),
      fetch(`/v1/leads/${activeLeadId}/memory`, { headers })
    ]);

    // 1. Processamento e gamificação da Persona Comportamental
    let communicationProfile = {};
    let decisionProfile = {};
    let activeStage = 'QUALIFICATION';
    
    if (resPersona.ok) {
      const data = await resPersona.json();
      communicationProfile = data.persona?.communication_profile || {};
      decisionProfile = data.persona?.decision_profile || {};
      renderPersona(data.persona);
    } else {
      renderEmptyPersona();
    }

    // 2. Processamento de Diretrizes e Arena de Mensagens
    if (resReply.ok) {
      const data = await resReply.json();
      activeStage = data.funnel_stage || 'QUALIFICATION';
      renderStrategy(data);
    }

    // 3. Processamento de Fatos de Abas e logs de auditoria real
    if (resMemory.ok) {
      const data = await resMemory.json();
      currentLeadMemories.hot = data.memory.hot || [];
      currentLeadMemories.profile = data.memory.profile || [];
      
      // Busca logs de auditoria REAIS do banco Prisma
      await fetchRealAuditLogs();
      renderActiveTab();
    }

    // 4. Executa a Gamificação Avançada do Lead
    gamifyLead(communicationProfile, decisionProfile, activeStage);

  } catch (err) {
    showToast('Falha crítica ao sincronizar inteligência comercial.', 'error');
  }
}

// 8. LOGICA DE GAMIFICAÇÃO (XP, LV, CONQUISTAS, DINÂMICAS RPG)
function gamifyLead(commProfile, decProfile, stage) {
  // A. Cálculo de XP e Level
  // Contamos quantas variáveis de persona foram calibradas
  const commKeysCalibrated = Object.values(commProfile).filter(v => v !== 0.5).length;
  const decKeysCalibrated = Object.values(decProfile).filter(v => v !== 0.5).length;
  
  // Total de interações nas memórias quentes e logs
  const totalFatos = currentLeadMemories.hot.length + currentLeadMemories.profile.length;
  
  // Cálculo de XP base:
  let xp = 10 + (commKeysCalibrated * 8) + (decKeysCalibrated * 8) + (totalFatos * 4);
  xp = Math.min(100, Math.max(10, xp));
  
  // Nível de Combatente baseado na telemetria
  const level = Math.min(5, Math.floor(xp / 20) + 1);
  
  document.getElementById('char-level-badge').textContent = `LV.${level}`;
  document.getElementById('engagement-xp-bar').style.width = `${xp}%`;
  document.getElementById('engagement-xp-text').textContent = `${xp}% XP`;

  // B. Humor e Temperatura (Visualização dinâmica)
  // Baseado no senso de urgência
  const urgency = decProfile.urgency ?? 0.5;
  let tempText = 'FRIO';
  let tempColor = 'text-sky-400';
  let activeBars = 1;
  
  if (stage === 'CLOSING' || urgency > 0.85) {
    tempText = '🔥 FERVENDO';
    tempColor = 'text-emerald-400 glow-green animate-pulse';
    activeBars = 4;
  } else if (urgency > 0.60) {
    tempText = '⚡ QUENTE';
    tempColor = 'text-amber-500 glow-amber';
    activeBars = 3;
  } else if (urgency > 0.35 || xp > 40) {
    tempText = '☀️ MORNIO';
    tempColor = 'text-yellow-400';
    activeBars = 2;
  }
  
  const tempLabel = document.getElementById('temperature-text');
  tempLabel.textContent = tempText;
  tempLabel.className = `text-sm font-black font-display tracking-wider uppercase ${tempColor}`;
  
  // Atualiza as barrinhas de calor de forma elegante
  for (let i = 1; i <= 4; i++) {
    const bar = document.getElementById(`temp-bar-${i}`);
    bar.className = 'h-full w-full transition-all duration-300 ';
    
    if (i <= activeBars) {
      if (activeBars === 4) bar.className += 'bg-emerald-400';
      else if (activeBars === 3) bar.className += 'bg-amber-500';
      else if (activeBars === 2) bar.className += 'bg-yellow-400';
      else bar.className += 'bg-sky-400';
    } else {
      bar.className += 'bg-zinc-800';
    }
  }

  // C. Desbloqueio Dinâmico de Conquistas (Achievements)
  const isDecisor = (decProfile.decision_speed > 0.6) || (decProfile.trust_gap < 0.45);
  const isComprador = (decProfile.urgency > 0.6) || (stage === 'VALUE_PROOF' || stage === 'CLOSING');
  const isNegociador = (decProfile.price_sensitivity > 0.65);
  const isUrgente = (decProfile.urgency > 0.7);

  updateAchievementBadge('badge-decisor', isDecisor, '👑 DECISOR ELITE');
  updateAchievementBadge('badge-comprador', isComprador, '🔥 INTERESSE CRÍTICO');
  updateAchievementBadge('badge-negociador', isNegociador, '🛡️ NEGOCIADOR DURO');
  updateAchievementBadge('badge-urgente', isUrgente, '⏳ AGILIDADE CRÍTICA');
}

function updateAchievementBadge(badgeId, unlocked, text) {
  const badge = document.getElementById(badgeId);
  if (unlocked) {
    badge.className = 'achievement-badge text-[8px] font-mono font-bold border border-emerald-500/50 bg-emerald-500/10 text-emerald-400 px-2.5 py-1 rounded-xs uppercase scale-105 duration-300 glow-green';
  } else {
    badge.className = 'achievement-badge text-[8px] font-mono font-bold border border-zinc-800 bg-zinc-950 text-zinc-700 px-2.5 py-1 rounded-xs uppercase opacity-35 scale-100 duration-300';
  }
}

// 9. RENDERIZAÇÃO DA PERSONA COMPORTAMENTAL
function renderPersona(persona) {
  const container = document.getElementById('persona-eixes');
  if (!persona) {
    renderEmptyPersona();
    return;
  }

  container.innerHTML = personaEixesDefinition.map(def => {
    let scoreVal = 0.5;
    if (def.group === 'communication') {
      scoreVal = persona.communication_profile?.[def.key] ?? 0.5;
    } else {
      scoreVal = persona.decision_profile?.[def.key] ?? 0.5;
    }
    
    const percentage = Math.round(scoreVal * 100);
    
    // Altera cor de acordo com traços críticos
    let customColor = def.color;
    if (def.key === 'trust_gap' && scoreVal > 0.7) {
      customColor = 'bg-rose-600';
    } else if (def.key === 'price_sensitivity' && scoreVal > 0.7) {
      customColor = 'bg-amber-600';
    } else if (def.key === 'urgency' && scoreVal > 0.7) {
      customColor = 'bg-emerald-500 glow-green';
    }

    return `
      <div class="flex flex-col gap-1 text-[11px]">
        <div class="flex justify-between items-center text-zinc-400 font-mono">
          <span class="font-medium">${def.label}</span>
          <span class="font-bold text-zinc-200">${percentage}%</span>
        </div>
        <div class="h-2 w-full bg-zinc-950 rounded-xs overflow-hidden border border-zinc-800">
          <div 
            class="h-full ${customColor} transition-all duration-500 ease-out" 
            style="width: ${percentage}%"
          ></div>
        </div>
      </div>
    `;
  }).join('');
}

function renderEmptyPersona() {
  const container = document.getElementById('persona-eixes');
  container.innerHTML = `<div class="text-[11px] text-zinc-500 font-mono py-8 text-center border border-zinc-850 rounded-xs bg-zinc-950/20">NENHUMA TELEMETRIA COMPORTAMENTAL DISPONÍVEL. INTERAJA NO CHAT PARA CALIBRAR OS ATRIBUTOS RPG.</div>`;
}

// 10. RENDERIZAÇÃO DE DIRETRIZES TÁTICAS E CHAT PLAYGROUND
function renderStrategy(strategyContext) {
  // A. Estágio Comercial Funil
  const stageBadge = document.getElementById('funnel-stage-badge');
  stageBadge.textContent = strategyContext.funnel_stage;
  
  // Estilos baseados no estágio
  stageBadge.className = 'text-[9px] font-mono font-bold tracking-widest px-2.5 py-1 rounded-xs uppercase shadow-2xs border transition-all duration-300';
  if (strategyContext.funnel_stage === 'CLOSING') {
    stageBadge.classList.add('bg-emerald-500/10', 'text-emerald-400', 'border-emerald-500/30', 'glow-green');
  } else if (strategyContext.funnel_stage === 'OBJECTION_HANDLING') {
    stageBadge.classList.add('bg-amber-500/10', 'text-amber-450', 'border-amber-500/30', 'glow-amber');
  } else if (strategyContext.funnel_stage === 'VALUE_PROOF') {
    stageBadge.classList.add('bg-sky-500/10', 'text-sky-400', 'border-sky-500/30');
  } else {
    stageBadge.classList.add('bg-zinc-950', 'text-zinc-400', 'border-zinc-850');
  }

  // B. Táticas Grimório
  document.getElementById('strategy-best-move').textContent = strategyContext.strategy?.best_move || 'Dispare argumentos de autoridade e consolide fatos chave.';
  document.getElementById('strategy-do-not-do').textContent = strategyContext.strategy?.do_not_do || 'Evite pressionar o combatente ou usarCTAs muito invasivas.';
  document.getElementById('strategy-cta').textContent = strategyContext.strategy?.cta_style || 'CTA Sutil.';
  document.getElementById('strategy-length').textContent = strategyContext.strategy?.message_length?.replace('_', ' ') || 'CURTO';

  // C. Renderizador Arena de Chat
  const chatMessages = document.getElementById('chat-messages');
  const conversations = strategyContext.recent_conversation || [];

  if (conversations.length === 0) {
    chatMessages.innerHTML = `<div class="text-[11px] text-zinc-500 font-mono text-center my-auto bg-zinc-950/20 border border-zinc-850 p-4 rounded-xs">ARENA VAZIA. NENHUM COMBATE ENCONTRADO. DISPARE MENSAGENS ABAIXO.</div>`;
    return;
  }

  chatMessages.innerHTML = conversations.map(msg => {
    const isUser = msg.role === 'user';
    const isSystem = msg.role === 'system';
    
    let containerClass = 'flex flex-col max-w-[85%] rounded-xs px-3.5 py-2.5 shadow-md border ';
    let alignmentClass = 'justify-start mr-auto ';
    
    if (isUser) {
      containerClass += 'bg-zinc-900 border-zinc-800 text-zinc-100 font-mono text-[11px]';
      alignmentClass = 'justify-end ml-auto';
    } else if (isSystem) {
      containerClass += 'bg-zinc-950 text-zinc-500 border-zinc-850 text-center font-mono text-[9px] py-1 max-w-[95%]';
      alignmentClass = 'justify-center mx-auto w-full';
    } else {
      containerClass += 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300 font-mono text-[11px]';
    }

    const time = new Date(msg.eventAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

    return `
      <div class="flex ${alignmentClass} gap-1.5 w-full">
        <div class="${containerClass}">
          <span class="leading-relaxed whitespace-pre-line">${msg.content}</span>
          ${!isSystem ? `<span class="text-[8px] opacity-40 self-end mt-1.5 font-mono font-bold tracking-wider">${time} // ${msg.role.toUpperCase()}</span>` : ''}
        </div>
      </div>
    `;
  }).join('');

  // Scroll suave para base
  setTimeout(() => {
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }, 50);
}

// 11. BUSCADOR DE LOGS DE AUDITORIA REAIS DO BANCO DE DADOS
async function fetchRealAuditLogs() {
  if (!activeLeadId) return;
  
  try {
    const res = await fetch(`/v1/leads/${activeLeadId}/audit?limit=25`, { headers: getHeaders() });
    if (res.ok) {
      currentLeadMemories.audit = await res.json();
    } else {
      currentLeadMemories.audit = [];
    }
  } catch (err) {
    console.error('Falha ao obter logs reais do banco relacional:', err);
    currentLeadMemories.audit = [];
  }
}

// 12. CONTROLE DE NAVEGAÇÃO DE TABS DE DADOS
function switchTab(tabName) {
  activeTab = tabName;
  
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.classList.remove('text-emerald-400', 'border-emerald-500');
    btn.classList.add('text-zinc-500', 'border-transparent');
  });

  const activeBtn = document.getElementById(`tab-${tabName}-btn`);
  if (activeBtn) {
    activeBtn.classList.remove('text-zinc-500', 'border-transparent');
    activeBtn.classList.add('text-emerald-400', 'border-emerald-500');
  }

  renderActiveTab();
}

function renderActiveTab() {
  const container = document.getElementById('tab-content');
  const badge = document.getElementById('memory-counter-badge');
  const items = currentLeadMemories[activeTab] || [];

  badge.textContent = `Total: ${items.length} itens`;

  if (items.length === 0) {
    container.innerHTML = `<div class="text-[11px] font-mono text-zinc-500 py-8 text-center border border-zinc-850 rounded-xs bg-zinc-950/20">ABAS DE INVENTÁRIO VAZIAS. NENHUM ITEM DISPONÍVEL NO MOMENTO.</div>`;
    return;
  }

  if (activeTab === 'hot') {
    container.innerHTML = items.map(item => {
      const isWeakened = item.status === 'weakened';
      const statusClass = isWeakened 
        ? 'border-amber-500/25 bg-amber-500/5 text-amber-400' 
        : 'border-emerald-500/25 bg-emerald-500/5 text-emerald-400 glow-green';

      let valStr = '';
      try {
        const valObj = typeof item.valueJson === 'string' ? JSON.parse(item.valueJson) : item.valueJson;
        valStr = valObj?.value || JSON.stringify(valObj);
      } catch {
        valStr = item.valueJson;
      }

      return `
        <div class="bg-zinc-950/40 border border-zinc-850 p-3.5 mb-2 rounded-xs flex justify-between items-start gap-4">
          <div class="flex flex-col gap-1 text-xs font-mono">
            <span class="text-[9px] font-bold text-zinc-500 uppercase">Inventário // ${item.key}</span>
            <span class="text-zinc-200 font-semibold text-xs leading-relaxed whitespace-pre-line">${valStr}</span>
          </div>
          <div class="flex flex-col items-end gap-1 text-right font-mono">
            <span class="text-[8px] font-bold border px-2 py-0.5 rounded-xs uppercase ${statusClass}">
              ${item.status}
            </span>
            <span class="text-[9px] text-zinc-500">Confiança: ${(item.confidence * 100).toFixed(0)}%</span>
          </div>
        </div>
      `;
    }).join('');
  } else if (activeTab === 'profile') {
    container.innerHTML = items.map(item => {
      let valStr = '';
      try {
        const valObj = typeof item.valueJson === 'string' ? JSON.parse(item.valueJson) : item.valueJson;
        valStr = valObj?.value || JSON.stringify(valObj);
      } catch {
        valStr = item.valueJson;
      }

      return `
        <div class="bg-zinc-950/40 border border-zinc-850 p-3.5 mb-2 rounded-xs flex justify-between items-start gap-4 text-xs font-mono">
          <div class="flex flex-col gap-1">
            <span class="text-[9px] font-bold text-zinc-500 uppercase">Fato Grimório // ${item.key} [${item.memoryScope}]</span>
            <span class="text-zinc-200 font-semibold leading-relaxed whitespace-pre-line">${valStr}</span>
          </div>
          <span class="text-[9px] text-zinc-500 border border-zinc-800 px-2 py-0.5 rounded-xs bg-zinc-950">Origem: ${item.sourceType.toUpperCase()}</span>
        </div>
      `;
    }).join('');
  } else if (activeTab === 'audit') {
    container.innerHTML = items.map(log => {
      const time = new Date(log.createdAt).toLocaleTimeString('pt-BR');
      const date = new Date(log.createdAt).toLocaleDateString('pt-BR');
      
      let payloadStr = '';
      try {
        payloadStr = typeof log.payloadJson === 'string' ? log.payloadJson : JSON.stringify(log.payloadJson, null, 2);
      } catch {
        payloadStr = log.payloadJson;
      }

      return `
        <div class="bg-zinc-950/60 border border-zinc-850 p-3.5 mb-2 text-xs flex flex-col gap-2 font-mono">
          <div class="flex justify-between items-center text-[9px] text-zinc-500 border-b border-zinc-800 pb-1.5">
            <span class="font-bold text-emerald-400 uppercase">⚡ Evento: ${log.eventType}</span>
            <span>${date} // ${time}</span>
          </div>
          <div class="text-zinc-300 leading-relaxed text-[11px]">
            ${log.eventType === 'turn_ingested' ? 'Turno de mensagens recebido na API. O Sales Brain avaliou os fatos contextuais no prompt, e recalibrou a persona viva em banco SQLite.' : ''}
            ${log.eventType === 'signal_extracted' ? 'Parâmetro de sinal cognitivo processado de forma reativa e persistido como inteligência no funil de vendas.' : ''}
            ${log.eventType === 'strategy_recomputed' ? 'Diretrizes táticas de conversão recalculadas.' : ''}
            ${log.eventType !== 'turn_ingested' && log.eventType !== 'signal_extracted' && log.eventType !== 'strategy_recomputed' ? `Ação administrativa executada com sucesso na tabela audit_events.` : ''}
          </div>
          ${payloadStr && payloadStr !== '{}' && payloadStr !== 'null' ? `
            <details class="text-[9px] text-zinc-500 cursor-pointer">
              <summary class="hover:text-zinc-300 transition-colors uppercase font-bold">[ Ver Metadados Adicionais ]</summary>
              <pre class="bg-zinc-950 border border-zinc-800 p-2.5 rounded-xs mt-2 overflow-x-auto text-zinc-400 font-mono text-[9px] max-h-24 select-text">${payloadStr}</pre>
            </details>
          ` : ''}
        </div>
      `;
    }).join('');
  }
}
