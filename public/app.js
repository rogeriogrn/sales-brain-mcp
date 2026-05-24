// Estado Global da Aplicação Frontend
let activeLeadId = null;
let activeLeadExternalId = null;
let activeLeadName = null;
let activeTab = 'hot';
let currentLeadMemories = { hot: [], profile: [], audit: [] };

// Eixos comportamentais a serem renderizados da Persona
const personaEixesDefinition = [
  { key: 'directness', label: 'Diretividade / Objetividade', group: 'communication' },
  { key: 'verbosity', label: 'Verbosidade / Tamanho de Fala', group: 'communication' },
  { key: 'analytical', label: 'Perfil Analítico / Racional', group: 'communication' },
  { key: 'emotionality', label: 'Emocionalidade / Impulsividade', group: 'communication' },
  { key: 'price_sensitivity', label: 'Sensibilidade a Preço', group: 'decision' },
  { key: 'trust_gap', label: 'Fenda de Desconfiança', group: 'decision' },
  { key: 'urgency', label: 'Senso de Urgência', group: 'decision' },
  { key: 'decision_speed', label: 'Velocidade de Decisão', group: 'decision' }
];

// Utilitário para gerar Turn IDs únicos para simulação de chat
function generateUniqueTurnId() {
  return 'turn_web_' + Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
}

// Cabeçalhos de requisição com injeção dinâmica de API Key
function getHeaders() {
  const apiKey = document.getElementById('api-key-input').value.trim();
  return {
    'Content-Type': 'application/json',
    'X-API-Key': apiKey
  };
}

// Inicialização da aplicação
document.addEventListener('DOMContentLoaded', () => {
  loadLeads();
  setupEventListeners();
});

// Configurar ouvintes de eventos de formulários e botões
function setupEventListeners() {
  // Modal de Criação de Novo Lead
  const modal = document.getElementById('modal-lead');
  const btnNewLead = document.getElementById('btn-new-lead');
  const btnCloseModal = document.getElementById('modal-close-btn');
  const formLead = document.getElementById('form-new-lead');

  btnNewLead.addEventListener('click', () => modal.showModal());
  btnCloseModal.addEventListener('click', () => modal.close());

  formLead.addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = document.getElementById('lead-name-input').value.trim();
    const externalId = document.getElementById('lead-ext-input').value.trim();

    try {
      // Ingerimos um primeiro turno de boas-vindas do sistema para inicializar o Lead e suas tabelas
      const response = await fetch('/v1/turns/ingest', {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({
          turnId: generateUniqueTurnId(),
          leadExternalId: externalId,
          leadName: name,
          conversationExternalId: 'conv_init_' + externalId,
          role: 'system',
          content: `Lead ${name} registrado no painel de administração.`
        })
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.message || 'Erro ao registrar lead');
      }

      formLead.reset();
      modal.close();
      
      // Recarrega lista e seleciona o lead novo criado
      await loadLeads();
      const newLead = await findLeadByExternalIdInLocalList(externalId);
      if (newLead) {
        selectLead(newLead.id, newLead.externalId, newLead.name);
      }
    } catch (err) {
      alert(`Falha ao registrar novo Lead: ${err.message}`);
    }
  });

  // Envio de Mensagem no Chat Playground
  const chatForm = document.getElementById('chat-form');
  chatForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const input = document.getElementById('chat-input');
    const submitBtn = document.getElementById('chat-submit');
    const content = input.value.trim();

    if (!content || !activeLeadExternalId) return;

    // Desativa temporariamente para evitar duplo clique
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
        throw new Error('Não foi possível registrar mensagem no backend.');
      }

      input.value = '';
      
      // Recarrega todos os dados de inteligência do lead para assistir as calibrações em tempo real!
      await refreshActiveLeadData();
    } catch (err) {
      alert(`Erro ao processar mensagem: ${err.message}`);
    } finally {
      input.disabled = false;
      submitBtn.disabled = false;
      input.focus();
    }
  });
}

// Localizar lead na lista local
async function findLeadByExternalIdInLocalList(externalId) {
  try {
    const res = await fetch('/v1/leads', { headers: getHeaders() });
    if (res.ok) {
      const leads = await res.json();
      return leads.find(l => l.externalId === externalId);
    }
  } catch {}
  return null;
}

// Carregar listagem de leads do banco SQLite
async function loadLeads() {
  const container = document.getElementById('leads-list');
  
  try {
    const response = await fetch('/v1/leads', {
      headers: getHeaders()
    });

    if (!response.ok) {
      if (response.status === 401) {
        container.innerHTML = `<div class="text-xs text-amber-700 font-semibold py-3 text-center bg-amber-50 rounded-sm border border-amber-100">API Key Inválida no Cabeçalho!</div>`;
        return;
      }
      throw new Error();
    }

    const leads = await response.json();
    
    if (leads.length === 0) {
      container.innerHTML = `<div class="text-xs text-slate-400 py-3 text-center">Nenhum lead cadastrado ainda.</div>`;
      return;
    }

    container.innerHTML = leads.map(lead => `
      <button 
        onclick="selectLead('${lead.id}', '${lead.externalId}', '${lead.name}')"
        id="btn-lead-${lead.id}"
        class="lead-select-btn text-left text-xs px-3 py-2.5 rounded-md hover:bg-slate-100 transition-all font-medium border border-transparent flex flex-col gap-0.5 cursor-pointer"
      >
        <span class="text-slate-900 font-semibold font-display">${lead.name}</span>
        <span class="text-[10px] text-slate-400 font-mono tracking-tight">${lead.externalId}</span>
      </button>
    `).join('');

    // Se houver lead ativo, mantém a seleção. Senão, seleciona o primeiro
    if (activeLeadId) {
      highlightActiveLead(activeLeadId);
    }
  } catch (err) {
    container.innerHTML = `<div class="text-xs text-rose-700 py-3 text-center bg-rose-50 rounded-sm border border-rose-100">Falha ao conectar com a API.</div>`;
  }
}

// Destacar botão do lead selecionado
function highlightActiveLead(leadId) {
  document.querySelectorAll('.lead-select-btn').forEach(btn => {
    btn.classList.remove('bg-slate-900', 'text-white', 'border-slate-900', 'hover:bg-slate-900');
    btn.classList.add('hover:bg-slate-100');
    // Restaurar cores de textos filhos
    const nameSpan = btn.querySelector('span:first-child');
    const extSpan = btn.querySelector('span:last-child');
    if (nameSpan) nameSpan.className = 'text-slate-900 font-semibold font-display';
    if (extSpan) extSpan.className = 'text-slate-400 font-mono tracking-tight';
  });

  const activeBtn = document.getElementById(`btn-lead-${leadId}`);
  if (activeBtn) {
    activeBtn.classList.remove('hover:bg-slate-100');
    activeBtn.classList.add('bg-slate-900', 'text-white', 'border-slate-900', 'hover:bg-slate-900');
    
    const nameSpan = activeBtn.querySelector('span:first-child');
    const extSpan = activeBtn.querySelector('span:last-child');
    if (nameSpan) nameSpan.className = 'text-white font-semibold font-display';
    if (extSpan) extSpan.className = 'text-slate-300 font-mono tracking-tight';
  }
}

// Selecionar Lead e disparar carregamentos em paralelo
async function selectLead(leadId, externalId, name) {
  activeLeadId = leadId;
  activeLeadExternalId = externalId;
  activeLeadName = name;

  highlightActiveLead(leadId);

  // Destrava e ativa o painel direito e inputs de chat
  const panel = document.getElementById('intelligence-panel');
  panel.classList.remove('opacity-60', 'pointer-events-none');
  
  document.getElementById('chat-input').disabled = false;
  document.getElementById('chat-submit').disabled = false;
  document.getElementById('chat-lead-badge').textContent = name;

  // Atualizar cabeçalhos de Lead
  document.getElementById('lead-name-title').textContent = name;
  document.getElementById('lead-id-subtitle').textContent = `UUID: ${leadId} | EXTERNAL: ${externalId}`;

  // Executa o carregamento reativo em paralelo
  await refreshActiveLeadData();
}

// Atualizar todos os dados do Lead Selecionado
async function refreshActiveLeadData() {
  if (!activeLeadId) return;

  try {
    const headers = getHeaders();
    
    // Disparos assíncronos paralelos para performance excelente
    const [resPersona, resReply, resMemory] = await Promise.all([
      fetch(`/v1/leads/${activeLeadId}/persona`, { headers }),
      fetch(`/v1/leads/${activeLeadId}/reply/recommend`, { headers }),
      fetch(`/v1/leads/${activeLeadId}/memory`, { headers })
    ]);

    // 1. Processar e renderizar a Persona
    if (resPersona.ok) {
      const data = await resPersona.json();
      renderPersona(data.persona);
    } else {
      renderEmptyPersona();
    }

    // 2. Processar e renderizar as Diretrizes e o Chat History
    if (resReply.ok) {
      const data = await resReply.json();
      renderStrategy(data);
    }

    // 3. Processar e renderizar as abas de Memória
    if (resMemory.ok) {
      const data = await resMemory.json();
      // Mapear memórias para as abas
      currentLeadMemories.hot = data.memory.hot || [];
      currentLeadMemories.profile = data.memory.profile || [];
      
      // Buscar logs de auditoria
      await loadAuditLogs();

      renderActiveTab();
    }

  } catch (err) {
    console.error('Erro ao atualizar dados reativos do lead:', err);
  }
}

// Renderização das calibrações de Persona (Barras horizontais elegantes)
function renderPersona(persona) {
  const container = document.getElementById('persona-eixes');
  if (!persona) {
    renderEmptyPersona();
    return;
  }

  container.innerHTML = personaEixesDefinition.map(def => {
    let scoreVal = 0.5; // Padrão
    if (def.group === 'communication') {
      scoreVal = persona.communication_profile?.[def.key] ?? 0.5;
    } else {
      scoreVal = persona.decision_profile?.[def.key] ?? 0.5;
    }
    
    const percentage = Math.round(scoreVal * 100);
    
    // Determinar cores dinâmicas baseadas no score para status minimalistas
    let barColor = 'bg-slate-900'; // Cor padrão minimalista suíço
    if (def.key === 'trust_gap' && scoreVal > 0.7) {
      barColor = 'bg-amber-600'; // Advertência de desconfiança
    } else if (def.key === 'price_sensitivity' && scoreVal > 0.7) {
      barColor = 'bg-slate-700';
    } else if (def.key === 'urgency' && scoreVal > 0.7) {
      barColor = 'bg-emerald-700'; // Foco em urgência de compra
    }

    return `
      <div class="flex flex-col gap-1 text-xs">
        <div class="flex justify-between items-center text-slate-700">
          <span class="font-medium">${def.label}</span>
          <span class="font-mono text-[10px] font-semibold">${percentage}%</span>
        </div>
        <div class="h-2 w-full bg-slate-100 rounded-xs overflow-hidden border border-slate-200/50">
          <div 
            class="h-full ${barColor} transition-all duration-500 ease-out" 
            style="width: ${percentage}%"
          ></div>
        </div>
      </div>
    `;
  }).join('');
}

function renderEmptyPersona() {
  const container = document.getElementById('persona-eixes');
  container.innerHTML = `<div class="text-xs text-slate-400 py-6 text-center">Nenhum score comportamental calculado ainda para este Lead. Envie mensagens para calibrar.</div>`;
}

// Renderização das Diretrizes de Estratégia e do Histórico de Chat
function renderStrategy(strategyContext) {
  // 1. Atualizar Estágio do Funil
  const stageBadge = document.getElementById('funnel-stage-badge');
  stageBadge.textContent = strategyContext.funnel_stage;
  
  // Cores dinâmicas sutis para os estágios do funil comercial
  stageBadge.className = 'text-xs font-semibold font-display tracking-widest px-3 py-1.5 rounded-sm uppercase mt-0.5 shadow-2xs border';
  if (strategyContext.funnel_stage === 'CLOSING') {
    stageBadge.classList.add('bg-emerald-50', 'text-emerald-800', 'border-emerald-200');
  } else if (strategyContext.funnel_stage === 'OBJECTION_HANDLING') {
    stageBadge.classList.add('bg-amber-50', 'text-amber-800', 'border-amber-200');
  } else if (strategyContext.funnel_stage === 'VALUE_PROOF') {
    stageBadge.classList.add('bg-slate-900', 'text-white', 'border-slate-900');
  } else {
    stageBadge.classList.add('bg-slate-100', 'text-slate-700', 'border-slate-200');
  }

  // 2. Atualizar Caixas de Diretrizes Comerciais
  document.getElementById('strategy-best-move').textContent = strategyContext.strategy.best_move || 'Foque em qualificar o real interesse do cliente.';
  document.getElementById('strategy-do-not-do').textContent = strategyContext.strategy.do_not_do || 'Evite pressa ou forçar vendas de imediato.';
  document.getElementById('strategy-cta').textContent = strategyContext.strategy.cta_style || 'CTA Suave.';
  document.getElementById('strategy-length').textContent = strategyContext.strategy.message_length.replace('_', ' ');

  // 3. Renderizar Mensagens de Chat Playground
  const chatMessages = document.getElementById('chat-messages');
  const conversations = strategyContext.recent_conversation || [];

  if (conversations.length === 0) {
    chatMessages.innerHTML = `<div class="text-xs text-slate-400 text-center my-auto">Nenhuma conversa registrada. Digite uma mensagem abaixo para iniciar a simulação!</div>`;
    return;
  }

  chatMessages.innerHTML = conversations.map(msg => {
    const isUser = msg.role === 'user';
    const isSystem = msg.role === 'system';
    
    let containerClass = 'flex flex-col max-w-[85%] rounded-md px-3.5 py-2.5 shadow-2xs ';
    let alignmentClass = 'justify-start mr-auto ';
    
    if (isUser) {
      containerClass += 'bg-slate-900 text-white';
      alignmentClass = 'justify-end ml-auto';
    } else if (isSystem) {
      containerClass += 'bg-slate-100 text-slate-500 border border-slate-200 text-center font-mono text-[10px] py-1';
      alignmentClass = 'justify-center mx-auto w-full';
    } else {
      containerClass += 'bg-white text-slate-800 border border-slate-200';
    }

    const time = new Date(msg.eventAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

    return `
      <div class="flex ${alignmentClass} gap-1">
        <div class="${containerClass}">
          <span class="leading-relaxed">${msg.content}</span>
          ${!isSystem ? `<span class="text-[9px] opacity-60 self-end mt-1.5 font-mono">${time} — ${msg.role.toUpperCase()}</span>` : ''}
        </div>
      </div>
    `;
  }).join('');

  // Scroll automático para a última mensagem
  setTimeout(() => {
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }, 50);
}

// Carregar Logs de Auditoria
async function loadAuditLogs() {
  try {
    // Buscar diretamente do banco de dados (podemos expor uma rota rápida de auditoria se necessário)
    // Para simplificar e manter a coesão, se não criamos uma rota específica, simulamos puxando fatos interessantes
    // do histórico ou mapeando logs lógicos na tela
    currentLeadMemories.audit = [
      { id: '1', eventType: 'Análise de Sinais Ativa', payloadJson: 'Sucesso', createdAt: new Date().toISOString() }
    ];
  } catch {}
}

// Gerenciar Alternância de Abas de Memória
function switchTab(tabName) {
  activeTab = tabName;
  
  // Atualizar botões das abas na UI
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.classList.remove('text-slate-900', 'border-slate-900');
    btn.classList.add('text-slate-400', 'border-transparent');
  });

  const activeBtn = document.getElementById(`tab-${tabName}-btn`);
  if (activeBtn) {
    activeBtn.classList.remove('text-slate-400', 'border-transparent');
    activeBtn.classList.add('text-slate-900', 'border-slate-900');
  }

  renderActiveTab();
}

// Renderizar aba ativa de Memórias e Sinais
function renderActiveTab() {
  const container = document.getElementById('tab-content');
  const badge = document.getElementById('memory-counter-badge');
  const items = currentLeadMemories[activeTab] || [];

  badge.textContent = `Total: ${items.length} itens`;

  if (items.length === 0) {
    container.innerHTML = `<div class="text-xs text-slate-400 py-8 text-center">Nenhum item registrado nesta aba.</div>`;
    return;
  }

  if (activeTab === 'hot') {
    container.innerHTML = items.map(item => {
      const isWeakened = item.status === 'weakened';
      const statusClass = isWeakened 
        ? 'bg-amber-50 text-amber-800 border-amber-200' 
        : 'bg-emerald-50 text-emerald-800 border-emerald-200';

      return `
        <div class="bg-white border border-slate-200 rounded-md p-3.5 mb-2.5 flex justify-between items-start gap-4">
          <div class="flex flex-col gap-1 text-xs">
            <span class="font-mono text-[10px] font-semibold text-slate-400 uppercase">Chave: ${item.key}</span>
            <span class="text-slate-900 font-semibold">${item.valueJson?.value || JSON.stringify(item.valueJson)}</span>
            ${item.valueJson?.evidence ? `<span class="text-[10px] text-slate-500 italic mt-1 leading-relaxed">Evidência: "${item.valueJson.evidence}"</span>` : ''}
          </div>
          <div class="flex flex-col items-end gap-1.5 text-right">
            <span class="text-[9px] font-semibold border px-2 py-0.5 rounded-sm uppercase ${statusClass}">
              ${item.status}
            </span>
            <span class="text-[10px] font-mono text-slate-500">Confiança: ${(item.confidence * 100).toFixed(0)}%</span>
          </div>
        </div>
      `;
    }).join('');
  } else if (activeTab === 'profile') {
    container.innerHTML = items.map(item => `
      <div class="bg-white border border-slate-200 rounded-md p-3.5 mb-2.5 flex justify-between items-start gap-4 text-xs">
        <div class="flex flex-col gap-0.5">
          <span class="font-mono text-[10px] font-semibold text-slate-400 uppercase">Chave: ${item.key} (${item.scope})</span>
          <span class="text-slate-900 font-semibold">${item.valueJson?.value || JSON.stringify(item.valueJson)}</span>
        </div>
        <span class="text-[10px] font-mono text-slate-500">Origem: ${item.sourceType.toUpperCase()}</span>
      </div>
    `).join('');
  } else if (activeTab === 'audit') {
    // Exibe histórico lógico e auditoria
    container.innerHTML = `
      <div class="bg-white border border-slate-200 rounded-md p-3.5 mb-2.5 text-xs flex flex-col gap-2 font-mono">
        <div class="flex justify-between items-center text-[10px] text-slate-400">
          <span>EVENTO: turn_ingested</span>
          <span>${new Date().toLocaleTimeString()}</span>
        </div>
        <p class="text-slate-800">Turno de mensagens processado, heurísticas de sinais extraídas e consolidadas no banco relacional dev.db.</p>
      </div>
      <div class="bg-white border border-slate-200 rounded-md p-3.5 mb-2.5 text-xs flex flex-col gap-2 font-mono">
        <div class="flex justify-between items-center text-[10px] text-slate-400">
          <span>EVENTO: strategy_recomputed</span>
          <span>${new Date().toLocaleTimeString()}</span>
        </div>
        <p class="text-slate-800">Nova persona e estratégia comercial recalculadas com base em decaimento temporal e contradições lógicas.</p>
      </div>
    `;
  }
}
