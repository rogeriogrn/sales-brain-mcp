import { MemoryRepository } from '../../repositories/postgres/memory.js';
import { PersonaRepository } from '../../repositories/postgres/persona.js';
import { AuditRepository } from '../../repositories/postgres/audit.js';
import { logger } from '../../shared/logger/index.js';

export interface PersonaProfile {
  communication_profile: {
    directness: number;
    verbosity: number;
    analytical: number;
    emotionality: number;
  };
  decision_profile: {
    price_sensitivity: number;
    trust_gap: number;
    urgency: number;
    decision_speed: number;
  };
}

export const PersonaService = {
  async recompute(leadId: string, turnId?: string): Promise<any> {
    logger.info({ leadId }, '🎭 Recalculando persona comercial viva do lead');

    // 1. Carregar todos os itens de memória estruturada ativos do Lead
    const memoryItems = await MemoryRepository.findByLeadId(leadId);

    // 2. Estabelecer a Baseline (Valores padrão de partida)
    const persona: PersonaProfile = {
      communication_profile: {
        directness: 0.5,
        verbosity: 0.5,
        analytical: 0.5,
        emotionality: 0.5,
      },
      decision_profile: {
        price_sensitivity: 0.5,
        trust_gap: 0.5,
        urgency: 0.5,
        decision_speed: 0.5,
      },
    };

    // 3. Ajustar os eixos baseando-se nos fatos e scores da memória
    for (const item of memoryItems) {
      if (item.status === 'retracted') continue; // Ignora memórias invalidadas

      const score = Number(item.valueJson?.score || item.confidence || 0.5);

      switch (item.key) {
        case 'price_sensitivity':
          persona.decision_profile.price_sensitivity = score;
          // Leads sensíveis a preço tendem a ser um pouco mais analíticos comparando custos
          if (score > 0.7) {
            persona.communication_profile.analytical = Math.max(persona.communication_profile.analytical, 0.65);
          }
          break;

        case 'trust_gap':
          persona.decision_profile.trust_gap = score;
          // Um gap de confiança alto eleva a necessidade de validação e análises
          if (score > 0.6) {
            persona.communication_profile.analytical = Math.max(persona.communication_profile.analytical, 0.7);
            persona.communication_profile.emotionality = Math.max(persona.communication_profile.emotionality, 0.6);
          }
          break;

        case 'urgency_state':
          persona.decision_profile.urgency = score;
          // Urgência alta acelera a tomada de decisão e aumenta a assertividade direta
          if (score > 0.7) {
            persona.decision_profile.decision_speed = Math.max(persona.decision_profile.decision_speed, 0.8);
            persona.communication_profile.directness = Math.max(persona.communication_profile.directness, 0.75);
          }
          break;

        case 'purchase_intent':
          persona.decision_profile.decision_speed = Math.max(persona.decision_profile.decision_speed, score);
          if (score > 0.8) {
            // Intenção alta torna o lead extremamente direto e focado
            persona.communication_profile.directness = Math.max(persona.communication_profile.directness, 0.85);
            persona.communication_profile.verbosity = Math.min(persona.communication_profile.verbosity, 0.35);
          }
          break;

        case 'current_objection':
          if (item.status === 'confirmed') {
            // Objeções ativas reduzem a velocidade de decisão e elevam fenda de confiança
            persona.decision_profile.decision_speed = Math.max(persona.decision_profile.decision_speed - 0.25, 0.1);
            persona.decision_profile.trust_gap = Math.min(persona.decision_profile.trust_gap + 0.15, 0.98);
            persona.communication_profile.emotionality = Math.min(persona.communication_profile.emotionality + 0.2, 0.95);
          } else if (item.status === 'weakened') {
            // Objeções enfraquecidas têm impacto reduzido
            persona.decision_profile.decision_speed = Math.max(persona.decision_profile.decision_speed - 0.1, 0.2);
            persona.decision_profile.trust_gap = Math.min(persona.decision_profile.trust_gap + 0.05, 0.95);
          }
          break;
      }
    }

    // Limitar casas decimais de todos os scores para manter snapshot compacto e limpo
    const roundObj = (obj: any) => {
      for (const k in obj) {
        obj[k] = Number(obj[k].toFixed(2));
      }
    };
    roundObj(persona.communication_profile);
    roundObj(persona.decision_profile);

    // 4. Resolver a Versão do Snapshot
    const versionCount = await PersonaRepository.getVersionCount(leadId);
    const nextVersion = versionCount + 1;

    // 5. Persistir Snapshot
    const snapshot = await PersonaRepository.createSnapshot(leadId, nextVersion, persona, turnId);

    // 6. Registrar Auditoria
    await AuditRepository.create({
      leadId,
      eventType: 'persona_recomputed',
      payloadJson: {
        version: nextVersion,
        turnId,
      },
    });

    logger.info({ leadId, version: nextVersion }, '🎭 Persona recalculada e snapshot versionado salvo');
    return snapshot;
  },
};
