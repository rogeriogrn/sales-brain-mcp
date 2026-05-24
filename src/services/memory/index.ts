import { MemoryRepository } from '../../repositories/postgres/memory.js';
import { AuditRepository } from '../../repositories/postgres/audit.js';
import { ExtractedSignal } from '../signal-extraction/index.js';
import { logger } from '../../shared/logger/index.js';

export const MemoryService = {
  async processSignals(leadId: string, signals: ExtractedSignal[], turnId: string) {
    logger.info({ leadId, signalCount: signals.length }, '🧠 Processando memória estruturada com novos sinais');

    for (const signal of signals) {
      let memoryScope = 'profile';
      let key = '';
      let status = 'hypothesis';

      // Mapeamento semântico de acordo com as regras comerciais
      switch (signal.signalType) {
        case 'price_sensitivity':
          key = 'price_sensitivity';
          memoryScope = 'profile'; // Sensibilidade a preço é perfil
          status = signal.score > 0.7 ? 'confirmed' : 'hypothesis';
          break;

        case 'urgency':
          key = 'urgency_state';
          memoryScope = 'hot'; // Urgência mora em hot (curto prazo)
          status = 'confirmed';
          break;

        case 'trust_gap':
          key = 'trust_gap';
          memoryScope = 'profile';
          status = signal.score > 0.65 ? 'confirmed' : 'hypothesis';
          break;

        case 'purchase_intent':
          key = 'purchase_intent';
          memoryScope = 'hot';
          status = 'confirmed';
          
          // Regra de Contradição e Retratação Lógica:
          // Se a intenção de compra for altíssima (> 0.8), enfraquecemos quaisquer objeções ativas
          if (signal.score > 0.8) {
            const activeObjection = await MemoryRepository.findSpecific(leadId, 'hot', 'current_objection');
            if (activeObjection && activeObjection.status !== 'retracted') {
              logger.info({ leadId }, '📉 Intenção de compra alta. Enfraquecendo objeção ativa por contradição.');
              await MemoryRepository.upsert({
                leadId,
                memoryScope: 'hot',
                key: 'current_objection',
                valueJson: { value: activeObjection.valueJson.value, score: activeObjection.valueJson.score },
                confidence: Number((activeObjection.confidence * 0.5).toFixed(2)), // Reduz confiança de objeção
                status: 'weakened',
                sourceType: 'rule',
                sourceRef: turnId,
              });

              await AuditRepository.create({
                leadId,
                eventType: 'memory_weakened',
                payloadJson: {
                  key: 'current_objection',
                  reason: 'Contradição com alta intenção de compra',
                  turnId,
                },
              });
            }
          }
          break;

        case 'objection_type':
          key = 'current_objection';
          memoryScope = 'hot'; // Objeções ativas moram na Hot Memory
          status = 'confirmed';
          break;

        default:
          continue;
      }

      // Salvar ou atualizar o item de memória
      const value = {
        value: signal.signalValue,
        score: signal.score,
        lastUpdatedFromTurn: turnId,
      };

      await MemoryRepository.upsert({
        leadId,
        memoryScope,
        key,
        valueJson: value,
        confidence: signal.score,
        status,
        sourceType: 'llm_heuristics',
        sourceRef: turnId,
      });

      // Gravar auditoria para cada promoção de hipótese
      await AuditRepository.create({
        leadId,
        eventType: 'memory_promoted',
        payloadJson: {
          key,
          scope: memoryScope,
          confidence: signal.score,
          status,
          turnId,
        },
      });
    }

    logger.info({ leadId }, '🧠 Processamento de memória concluído com sucesso');
  },
};
