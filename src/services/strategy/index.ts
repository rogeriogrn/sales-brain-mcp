import { MemoryRepository } from '../../repositories/postgres/memory.js';
import { PersonaRepository } from '../../repositories/postgres/persona.js';
import { StrategyRepository } from '../../repositories/postgres/strategy.js';
import { AuditRepository } from '../../repositories/postgres/audit.js';
import { logger } from '../../shared/logger/index.js';

export interface StrategyJson {
  tone_directives: string[];
  message_length: 'short_direct' | 'medium_balanced' | 'detailed_analytical';
  best_move: string;
  do_not_do: string;
  cta_style: string;
  risks_detected: string[];
}

export const StrategyService = {
  async recompute(leadId: string, turnId?: string): Promise<any> {
    logger.info({ leadId }, '🎯 Calculando estratégia comercial traduzida e inteligível para IAs');

    // 1. Carregar Dados de Memória e Persona
    const memoryItems = await MemoryRepository.findByLeadId(leadId);
    const latestPersonaSnapshot = await PersonaRepository.findLatestByLeadId(leadId);

    // 2. Determinar o Estágio Comercial (Funil de Vendas)
    let stage = 'QUALIFICATION'; // Padrão

    const activeObjection = memoryItems.find(item => item.key === 'current_objection' && item.status === 'confirmed');
    const purchaseIntent = memoryItems.find(item => item.key === 'purchase_intent' && item.status === 'confirmed');

    if (purchaseIntent && Number(purchaseIntent.valueJson?.score || 0) > 0.8) {
      stage = 'CLOSING'; // Pronto para fechar
    } else if (activeObjection) {
      stage = 'OBJECTION_HANDLING'; // Tratamento de Objeção Ativa
    } else {
      const trustGap = memoryItems.find(item => item.key === 'trust_gap' && item.status === 'confirmed');
      if (trustGap && Number(trustGap.valueJson?.score || 0) > 0.7) {
        stage = 'VALUE_PROOF'; // Precisa de prova de valor e autoridade
      }
    }

    // 3. Traduzir e Gerar as Diretrizes Inteligíveis para qualquer LLM/IA (Prompt Directives)
    const strategy: StrategyJson = {
      tone_directives: ['Consultivo', 'Profissional'],
      message_length: 'medium_balanced',
      best_move: 'Qualificar as necessidades básicas do lead e criar rapport.',
      do_not_do: 'Não empurre produtos sem entender o real interesse do cliente.',
      cta_style: ' CTA Suave: Fazer uma pergunta aberta para engajar.',
      risks_detected: [],
    };

    // Extrair preferências de Persona se existirem
    const persona = latestPersonaSnapshot?.personaJson;
    const directness = persona?.communication_profile?.directness || 0.5;
    const verbosity = persona?.communication_profile?.verbosity || 0.5;
    const analytical = persona?.communication_profile?.analytical || 0.5;
    const priceSensitivity = persona?.decision_profile?.price_sensitivity || 0.5;
    const trustGapScore = persona?.decision_profile?.trust_gap || 0.5;

    // A) Definir tamanho da mensagem
    if (directness > 0.7 && verbosity < 0.4) {
      strategy.message_length = 'short_direct';
      strategy.tone_directives.push('Direto e objetivo', 'Sem rodeios ou textos longos');
    } else if (analytical > 0.7) {
      strategy.message_length = 'detailed_analytical';
      strategy.tone_directives.push('Extremamente técnico e detalhado', 'Responda com tópicos estruturados (bullets)');
    }

    // B) Mapear Ações baseadas no Estágio e Objeções
    if (stage === 'OBJECTION_HANDLING' && activeObjection) {
      const objectionValue = activeObjection.valueJson?.value;
      if (objectionValue === 'PRICE_OBJECTION') {
        strategy.best_move = 'Justificar o valor agregado e a qualidade antes de falar de descontos. Apresente duas opções de pagamento.';
        strategy.do_not_do = 'Evite dar desconto logo de cara sem antes restabelecer o valor do produto.';
        strategy.cta_style = 'CTA Seguro: Perguntar se a forma de parcelamento aliviaria o orçamento.';
        if (priceSensitivity > 0.7) {
          strategy.risks_detected.push('Alta sensibilidade a preço detectada. Lead pode sumir (ghosting) se for pressionado com ofertas agressivas.');
        }
      } else if (objectionValue === 'TRUST_OBJECTION') {
        strategy.best_move = 'Apresentar dados institucionais sólidos, prints de depoimentos reais ou termos de garantia incondicional.';
        strategy.do_not_do = 'Não tente acelerar o fechamento. Foque em passar segurança e construir confiança.';
        strategy.cta_style = 'CTA Informativo: Enviar o link de garantia e se colocar à disposição para tirar dúvidas.';
      }
    } else if (stage === 'CLOSING') {
      strategy.best_move = 'Facilitar o fechamento. Enviar o link direto de pagamento ou chave Pix com instruções claras.';
      strategy.do_not_do = 'Não adicione informações redundantes ou explicações longas agora. Vá direto ao fechamento.';
      strategy.cta_style = 'CTA Direto: Perguntar se prefere pagar via Pix ou Cartão para liberação imediata.';
    } else if (stage === 'VALUE_PROOF') {
      strategy.best_move = 'Apresentar provas de autoridade e segurança (CNPJ, tempo de mercado, depoimentos) para diminuir a fenda de confiança.';
      strategy.cta_style = 'CTA Suave: Perguntar se gostaria de ver um exemplo de sucesso de outro cliente.';
    }

    // C) Ajustes finais baseados em fenda de confiança
    if (trustGapScore > 0.7) {
      strategy.tone_directives.push('Transparência absoluta', 'Foque em segurança e garantias');
      strategy.do_not_do += ' Evite usar gatilhos de escassez ou urgência falsos, pois isso aumentará a desconfiança.';
    }

    // 4. Salvar Snapshot de Estratégia
    const versionCount = await StrategyRepository.getVersionCount(leadId);
    const nextVersion = versionCount + 1;

    const snapshot = await StrategyRepository.createSnapshot(leadId, nextVersion, stage, strategy, turnId);

    // 5. Registrar Evento de Auditoria
    await AuditRepository.create({
      leadId,
      eventType: 'strategy_recomputed',
      payloadJson: {
        version: nextVersion,
        stage,
        turnId,
      },
    });

    logger.info({ leadId, version: nextVersion, stage }, '🎯 Snapshot de estratégia comercial versionado salvo com sucesso');
    return snapshot;
  },
};
