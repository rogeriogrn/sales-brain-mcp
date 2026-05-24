import { logger } from '../../shared/logger/index.js';

export interface ExtractedSignal {
  signalType: string;
  signalValue: string;
  score: number;
  evidence: {
    matchedKeywords: string[];
    originalText: string;
  };
}

export const SignalExtractionService = {
  async extract(content: string): Promise<ExtractedSignal[]> {
    logger.debug({ content }, '🔍 Analisando conteúdo do turno para extração de sinais');
    
    const signals: ExtractedSignal[] = [];
    const normalizedText = content.toLowerCase();

    // 1. Sensibilidade a Preço (Price Sensitivity)
    const priceKeywords = ['preço', 'preco', 'custo', 'quanto fica', 'pix', 'desconto', 'barato', 'valor', 'promoção', 'promocao', 'cobrar', 'orçamento', 'orcamento'];
    const matchedPrice = priceKeywords.filter(kw => normalizedText.includes(kw));
    if (matchedPrice.length > 0) {
      // Score proporcional ao número de ocorrências, com teto de 0.95
      const score = Math.min(0.3 + matchedPrice.length * 0.15, 0.95);
      signals.push({
        signalType: 'price_sensitivity',
        signalValue: score > 0.7 ? 'HIGH' : 'MEDIUM',
        score,
        evidence: {
          matchedKeywords: matchedPrice,
          originalText: content,
        },
      });
    }

    // 2. Urgência (Urgency)
    const urgencyKeywords = ['urgente', 'rapido', 'rápido', 'hoje', 'agora', 'imediatamente', 'pressa', 'pra ontem', 'o quanto antes', 'timing', 'prazo'];
    const matchedUrgency = urgencyKeywords.filter(kw => normalizedText.includes(kw));
    if (matchedUrgency.length > 0) {
      const score = Math.min(0.4 + matchedUrgency.length * 0.2, 0.95);
      signals.push({
        signalType: 'urgency',
        signalValue: score > 0.6 ? 'HIGH' : 'MEDIUM',
        score,
        evidence: {
          matchedKeywords: matchedUrgency,
          originalText: content,
        },
      });
    }

    // 3. Fenda de Confiança (Trust Gap)
    const trustKeywords = ['garantia', 'seguro', 'confiável', 'confiavel', 'cnpj', 'depoimento', 'prova', 'devolução', 'devolucao', 'segurança', 'seguranca', 'reclame aqui'];
    const matchedTrust = trustKeywords.filter(kw => normalizedText.includes(kw));
    if (matchedTrust.length > 0) {
      const score = Math.min(0.35 + matchedTrust.length * 0.15, 0.95);
      signals.push({
        signalType: 'trust_gap',
        signalValue: score > 0.65 ? 'HIGH' : 'MEDIUM',
        score,
        evidence: {
          matchedKeywords: matchedTrust,
          originalText: content,
        },
      });
    }

    // 4. Intenção de Compra (Purchase Intent)
    const purchaseKeywords = ['quero fechar', 'como compro', 'quero comprar', 'link de pagamento', 'fechar negocio', 'fechar negócio', 'me manda o link', 'como faço para pagar', 'aceita cartão', 'aceita cartao'];
    const matchedPurchase = purchaseKeywords.filter(kw => normalizedText.includes(kw));
    if (matchedPurchase.length > 0) {
      const score = Math.min(0.5 + matchedPurchase.length * 0.2, 0.98);
      signals.push({
        signalType: 'purchase_intent',
        signalValue: score > 0.75 ? 'HIGH' : 'MEDIUM',
        score,
        evidence: {
          matchedKeywords: matchedPurchase,
          originalText: content,
        },
      });
    }

    // 5. Objeções Ativas (Objections)
    const objectionKeywords = ['caro', 'concorrente', 'outra loja', 'pensar', 'depois vejo', 'muito alto', 'inseguro', 'não sei se', 'nao sei se', 'pesquisar'];
    const matchedObjections = objectionKeywords.filter(kw => normalizedText.includes(kw));
    if (matchedObjections.length > 0) {
      const score = Math.min(0.4 + matchedObjections.length * 0.2, 0.95);
      signals.push({
        signalType: 'objection_type',
        signalValue: normalizedText.includes('caro') || normalizedText.includes('alto') ? 'PRICE_OBJECTION' : 'TRUST_OBJECTION',
        score,
        evidence: {
          matchedKeywords: matchedObjections,
          originalText: content,
        },
      });
    }

    logger.debug({ signalCount: signals.length }, '🔍 Extração de sinais comportamentais concluída');
    return signals;
  },
};
