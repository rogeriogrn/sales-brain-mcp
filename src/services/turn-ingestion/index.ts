import { LeadRepository } from '../../repositories/postgres/lead.js';
import { ConversationRepository } from '../../repositories/postgres/conversation.js';
import { TurnRepository } from '../../repositories/postgres/turn.js';
import { AuditRepository } from '../../repositories/postgres/audit.js';
import { SignalRepository } from '../../repositories/postgres/signal.js';
import { SignalExtractionService } from '../signal-extraction/index.js';
import { MemoryService } from '../memory/index.js';
import { PersonaService } from '../persona/index.js';
import { StrategyService } from '../strategy/index.js';
import { logger } from '../../shared/logger/index.js';

export interface IngestTurnInput {
  turnId: string;
  leadExternalId: string;
  leadName: string;
  conversationExternalId: string;
  role: string;
  content: string;
  contentType?: string;
  timestamp?: string;
  metadata?: any;
}

export const TurnIngestionService = {
  async ingest(input: IngestTurnInput) {
    logger.info({ turnId: input.turnId, leadExternalId: input.leadExternalId }, '📥 Iniciando ingestão de turno');

    // 1. Verificação Estrita de Idempotência
    const existingTurn = await TurnRepository.findByTurnId(input.turnId);
    if (existingTurn) {
      logger.info({ turnId: input.turnId }, '🔄 Turno duplicado detectado. Ignorando processamento redundante.');

      const conversation = await ConversationRepository.findById(existingTurn.conversationId);
      const leadId = conversation ? conversation.leadId : '';

      return {
        ok: true,
        leadId,
        conversationId: existingTurn.conversationId,
        turnId: existingTurn.id,
        isDuplicate: true,
      };
    }

    // 2. Localizar ou Criar o Lead
    let lead = await LeadRepository.findByExternalId(input.leadExternalId);
    if (!lead) {
      logger.info({ leadExternalId: input.leadExternalId, name: input.leadName }, '👤 Criando novo Lead');
      lead = await LeadRepository.create({
        externalId: input.leadExternalId,
        name: input.leadName,
        source: input.metadata?.source_app,
      });
    }

    // 3. Localizar ou Criar a Conversa Ativa
    let conversation = await ConversationRepository.findActiveByLeadId(lead.id);
    if (!conversation) {
      logger.info({ leadId: lead.id }, '💬 Criando nova Conversa ativa');
      conversation = await ConversationRepository.create({
        leadId: lead.id,
        channel: input.metadata?.source_app || 'unknown',
        title: `Conversa com ${lead.name}`,
      });
    }

    // 4. Salvar o Turno
    const eventAt = input.timestamp ? new Date(input.timestamp) : new Date();
    const newTurn = await TurnRepository.create({
      conversationId: conversation.id,
      turnId: input.turnId,
      role: input.role,
      content: input.content,
      contentType: input.contentType,
      metadataJson: input.metadata,
      eventAt,
    });

    // 4.1 Extração Síncrona de Sinais Comportamentais
    const signals = await SignalExtractionService.extract(input.content);
    for (const sig of signals) {
      await SignalRepository.create({
        leadId: lead.id,
        turnId: newTurn.id,
        signalType: sig.signalType,
        signalValue: sig.signalValue,
        score: sig.score,
        evidenceJson: sig.evidence,
      });
    }

    // 4.2 Atualização da Memória Estruturada baseada em Sinais e Regras Lógicas
    await MemoryService.processSignals(lead.id, signals, newTurn.id);

    // 4.3 Recálculo da Persona Comercial Viva e Gravação de Snapshot
    await PersonaService.recompute(lead.id, newTurn.id);

    // 4.4 Recálculo da Estratégia Comercial Traduzida para IAs
    await StrategyService.recompute(lead.id, newTurn.id);

    // 5. Registrar Evento de Auditoria Geral da Ingestão
    await AuditRepository.create({
      leadId: lead.id,
      eventType: 'turn_ingested',
      payloadJson: {
        turnId: newTurn.id,
        conversationId: conversation.id,
        timestamp: eventAt.toISOString(),
      },
    });

    logger.info({ turnId: newTurn.id, leadId: lead.id }, '✅ Turno ingerido, sinais processados e memória atualizada com sucesso');

    return {
      ok: true,
      leadId: lead.id,
      conversationId: conversation.id,
      turnId: newTurn.id,
      isDuplicate: false,
    };
  },
};
