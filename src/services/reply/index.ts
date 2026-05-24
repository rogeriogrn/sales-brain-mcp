import { LeadRepository } from '../../repositories/postgres/lead.js';
import { StrategyRepository } from '../../repositories/postgres/strategy.js';
import { StrategyService } from '../strategy/index.js';
import { MemoryRepository } from '../../repositories/postgres/memory.js';
import { TurnRepository } from '../../repositories/postgres/turn.js';
import { logger } from '../../shared/logger/index.js';

export interface SuggestedReplyContext {
  lead: {
    id: string;
    externalId: string;
    name: string;
  };
  funnel_stage: string;
  strategy: {
    version: number;
    tone_directives: string[];
    message_length: string;
    best_move: string;
    do_not_do: string;
    cta_style: string;
    risks_detected: string[];
  };
  active_objections: {
    objection: string;
    status: string;
    confidence: number;
    evidence?: string;
  }[];
  profile_facts: {
    key: string;
    value: any;
    scope: string;
  }[];
  recent_conversation: {
    role: string;
    content: string;
    eventAt: string;
  }[];
}

export const ReplyService = {
  async getRecommendationContext(leadIdOrExternalId: string): Promise<SuggestedReplyContext> {
    logger.info({ leadIdOrExternalId }, '🔮 Compilando contexto estruturado de Suggested Reply');

    // 1. Resolver o Lead (Pode ser UUID interno ou externalId)
    let lead = await LeadRepository.findById(leadIdOrExternalId);
    if (!lead) {
      lead = await LeadRepository.findByExternalId(leadIdOrExternalId);
    }

    if (!lead) {
      logger.warn({ leadIdOrExternalId }, '❌ Lead não encontrado durante compilação de recomendação');
      throw new Error(`Lead com ID ou ExternalID '${leadIdOrExternalId}' não foi encontrado.`);
    }

    const leadId = lead.id;

    // 2. Carregar a Estratégia Comercial (Recalcular se não existir)
    let strategySnapshot = await StrategyRepository.findLatestByLeadId(leadId);
    if (!strategySnapshot) {
      logger.info({ leadId }, '🎯 Estratégia inexistente. Calculando nova estratégia inicial.');
      strategySnapshot = await StrategyService.recompute(leadId);
    }

    if (!strategySnapshot) {
      logger.error({ leadId }, '❌ Falha grave: strategySnapshot ainda é nulo após tentativa de recálculo');
      throw new Error(`Não foi possível carregar ou recalcular a estratégia para o lead ${leadId}.`);
    }

    // 3. Carregar Memórias e Sinais
    const memoryItems = await MemoryRepository.findByLeadId(leadId);
    
    // Filtrar Objeções Ativas (Confirmed ou Weakened)
    const activeObjections = memoryItems
      .filter(item => item.key === 'current_objection' && (item.status === 'confirmed' || item.status === 'weakened'))
      .map(item => ({
        objection: item.valueJson?.value || 'Objeção desconhecida',
        status: item.status,
        confidence: item.confidence,
        evidence: item.valueJson?.evidence || undefined
      }));

    // Filtrar Informações do Perfil do Lead
    const profileFacts = memoryItems
      .filter(item => item.key !== 'current_objection' && item.status === 'confirmed')
      .map(item => ({
        key: item.key,
        value: item.valueJson,
        scope: item.memoryScope
      }));

    // 4. Carregar Histórico Recente de Conversa (Últimos 10 turnos)
    const recentTurns = await TurnRepository.findRecentByLeadId(leadId, 10);
    const recentConversation = recentTurns.map(t => ({
      role: t.role,
      content: t.content,
      eventAt: t.eventAt.toISOString()
    }));

    // 5. Compilar Payload Final
    const strategy = strategySnapshot.strategyJson;

    return {
      lead: {
        id: lead.id,
        externalId: lead.externalId,
        name: lead.name
      },
      funnel_stage: strategySnapshot.stage,
      strategy: {
        version: strategySnapshot.version,
        tone_directives: strategy?.tone_directives || [],
        message_length: strategy?.message_length || 'medium_balanced',
        best_move: strategy?.best_move || '',
        do_not_do: strategy?.do_not_do || '',
        cta_style: strategy?.cta_style || '',
        risks_detected: strategy?.risks_detected || []
      },
      active_objections: activeObjections,
      profile_facts: profileFacts,
      recent_conversation: recentConversation
    };
  }
};
