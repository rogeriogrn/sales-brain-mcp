# 14. Payloads e Exemplos
## Objetivo
Centralizar exemplos de payloads para desenvolvimento, testes e memória futura.

## 1. Payload de ingestão simples
```json
{
  "turn_id": "turn_001",
  "lead": {
    "external_id": "lead_ext_123",
    "name": "Carlos"
  },
  "conversation": {
    "external_id": "conv_abc",
    "channel": "custom-ui"
  },
  "message": {
    "role": "user",
    "content": "quanto fica no pix e tem garantia?",
    "content_type": "text",
    "timestamp": "2025-01-15T20:11:00Z"
  },
  "metadata": {
    "source_app": "sales-panel"
  }
}
```
## 2. Resposta esperada da ingestão
```json
{
  "ok": true,
  "lead_id": "uuid",
  "conversation_id": "uuid",
  "turn_internal_id": "uuid",
  "snapshot": {
    "stage": "OBJECTION_HANDLING",
    "temperature": "warm",
    "persona": {
      "price_sensitivity": 0.78,
      "trust_gap": 0.71
    },
    "strategy": {
      "tone": "consultive_direct",
      "best_move": "answer_price_with_value_and_reassurance"
    }
  },
  "reply_recommendation": {
    "text": "Tem sim. No pix fica X e eu também te explico rapidamente o que está incluído para fazer sentido no valor."
  }
}
```
## 3. Payload para upsert de fato
```json
{
  "scope": "canonical",
  "key": "payment_preference",
  "value": {
    "method": "pix"
  },
  "confidence": 0.95,
  "source_type": "manual"
}
```
## 4. Payload para retract de fato
```json
{
  "key": "urgent_purchase",
  "reason": "lead informou que só vai analisar no próximo mês",
  "source_type": "manual"
}
```
## 5. Payload para recompute
```json
{
  "recompute": ["persona", "strategy", "snapshot"]
}
```
## 6. Exemplo de resource snapshot
```json
{
  "lead_id": "uuid",
  "snapshot_version": 9,
  "stage": "OBJECTION_HANDLING",
  "temperature": "warm",
  "persona": {
    "analytical": 0.72,
    "price_sensitivity": 0.78,
    "trust_gap": 0.66
  },
  "state": {
    "main_objection": "price",
    "purchase_intent": 0.75,
    "ghosting_risk": 0.21
  },
  "preferences": {
    "message_length": "short_structured",
    "formats": ["comparison", "proof"]
  },
  "strategy": {
    "tone": "consultive_direct",
    "best_move": "answer_price_with_value_and_reassurance",
    "cta": "advance_softly"
  }
}
```
## 7. Exemplo de tool input MCP: recommend_reply
```json
{
  "lead_id": "uuid",
  "last_user_message": "achei um pouco caro ainda",
  "context_mode": "snapshot_only"
}
```
## 8. Exemplo de tool output MCP: recommend_reply
```json
{
  "reply_text": "Faz sentido olhar isso com cuidado. Se quiser, eu te mostro de forma bem direta o que está incluso e por que costuma compensar para esse objetivo."
}
```
## 9. Exemplo de memory item
```json
{
  "memory_scope": "profile",
  "key": "preferred_message_length",
  "value_json": {
    "value": "short_structured"
  },
  "confidence": 0.81,
  "status": "confirmed",
  "source_type": "rule",
  "source_ref": "message_pattern_detector"
}
```
## 10. Exemplo de persona snapshot
```json
{
  "communication_profile": {
    "directness": 0.84,
    "verbosity": 0.30,
    "analytical": 0.77
  },
  "decision_profile": {
    "price_sensitivity": 0.74,
    "trust_gap": 0.63,
    "decision_speed": 0.31
  },
  "response_preferences": {
    "short_text": 0.85,
    "comparison": 0.79,
    "proof": 0.68
  }
}
```
## 11. Exemplo de strategy snapshot
```json
{
  "stage": "OFFER",
  "tone": "consultive_direct",
  "message_length": "short_structured",
  "proof_type": "similar_case_plus_reassurance",
  "offer_pattern": "two_options",
  "cta": "advance_softly",
  "best_move": "justify_value_then_offer_two_options",
  "avoid": ["pressure", "long_pitch"]
}
```
## 12. Exemplo de recomendação de resposta por perfil
Perfil analítico
```json
{
  "reply_text": "Posso te resumir em 3 pontos o que muda entre as opções e qual tende a fazer mais sentido para o que você quer."
}
```
Perfil emocional
```json
{
  "reply_text": "Entendi. O mais importante aqui é você sentir segurança de que isso vai te atender bem, então posso te mostrar um caso bem parecido com o seu."
}
```
Perfil sensível a preço
```json
{
  "reply_text": "Faz sentido olhar valor com calma. Se quiser, eu te mostro a diferença prática entre as opções para você comparar custo-benefício com mais clareza."
}
```
## 13. Conclusão
Manter exemplos reais e pequenos acelera muito o desenvolvimento e reduz retrabalho.
