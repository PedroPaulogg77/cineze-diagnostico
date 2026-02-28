import type { OnboardingFormData } from "@/types"

export function buildPrompt(dados: OnboardingFormData): string {
  const canaisLista = dados.canais_ativos?.length
    ? dados.canais_ativos.join(", ")
    : "Nenhum canal informado"

  const objetivosLista = dados.objetivos?.length
    ? dados.objetivos.map((o, i) => `${i + 1}. ${o}`).join("\n")
    : "Não informado"

  return `Você é um especialista em marketing digital e estratégia de negócios para pequenas e médias empresas brasileiras.

Analise os dados abaixo e gere um diagnóstico de presença digital completo e personalizado.

## DADOS DA EMPRESA

- **Responsável:** ${dados.nome_responsavel}
- **Nome do negócio:** ${dados.nome_negocio}
- **Localização:** ${dados.cidade_bairro || "Não informado"}
- **Segmento:** ${dados.segmento || "Não informado"}
- **Faturamento mensal atual:** ${dados.faturamento_faixa || "Não informado"}
- **Canais digitais ativos:** ${canaisLista}
- **Descrição dos clientes:** ${dados.descricao_clientes || "Não informado"}
- **Objetivos do negócio:**
${objetivosLista}
- **Contexto adicional:** ${dados.contexto_extra || "Nenhum"}

## INSTRUÇÕES DE ANÁLISE

- Seja direto, específico e prático. Evite generalizações.
- Contextualize para a realidade brasileira e para o porte da empresa.
- Os scores devem refletir a situação real: uma empresa sem presença digital deve ter scores baixos (1-3).
- Para "maturidade_canais", inclua TODOS os canais informados em "canais_ativos" e também os 3-5 canais digitais mais relevantes para o segmento que estão AUSENTES.
- Para "sobre_empresa.canais_identificados", liste os canais que o negócio já usa.
- Para "sobre_empresa.canais_ausentes", liste canais importantes que estão faltando.
- Para "plano_acao", gere entre 8 e 12 ações concretas distribuídas pelas 4 semanas do primeiro mês.
- Para "objetivos_smart", gere exatamente 3 objetivos relevantes para os objetivos informados.
- Para "metricas", gere entre 5 e 8 métricas acionáveis.
- Os valores de "analise_mercado.investimento_mensal_recomendado", "cpm_estimado" e "cpc_estimado" devem ser números realistas em reais para o mercado brasileiro.

## FORMATO DE RESPOSTA

Retorne APENAS o JSON abaixo, sem markdown, sem texto antes ou depois, sem blocos de código.

{
  "score_geral": <número decimal 0-10>,
  "nivel": "<Presença Crítica|Em Construção|Em Crescimento|Presença Sólida|Referência na região>",
  "resumo_executivo": "<2-3 frases diretas e honestas sobre a situação atual da presença digital>",

  "pilares": {
    "visibilidade": {
      "score": <0-10>,
      "diagnostico": "<3-4 frases sobre como o negócio está sendo encontrado online>",
      "recomendacoes": ["ação concreta 1", "ação concreta 2", "ação concreta 3", "ação concreta 4", "ação concreta 5"]
    },
    "captacao": {
      "score": <0-10>,
      "diagnostico": "<3-4 frases sobre como o negócio atrai novos clientes>",
      "recomendacoes": ["ação concreta 1", "ação concreta 2", "ação concreta 3", "ação concreta 4", "ação concreta 5"]
    },
    "conversao": {
      "score": <0-10>,
      "diagnostico": "<3-4 frases sobre como o negócio converte interesse em vendas>",
      "recomendacoes": ["ação concreta 1", "ação concreta 2", "ação concreta 3", "ação concreta 4", "ação concreta 5"]
    },
    "posicionamento": {
      "score": <0-10>,
      "diagnostico": "<3-4 frases sobre como o negócio se diferencia da concorrência>",
      "recomendacoes": ["ação concreta 1", "ação concreta 2", "ação concreta 3", "ação concreta 4", "ação concreta 5"]
    }
  },

  "maturidade_canais": [
    {
      "canal": "<nome do canal: Instagram, Google Meu Negócio, WhatsApp Business, TikTok, Facebook, YouTube, LinkedIn, Site próprio, etc.>",
      "score": <0-10>,
      "status": "<Inexistente|Básico|Ativo|Avançado>",
      "diagnostico": "<2-3 frases específicas sobre o uso atual deste canal>",
      "o_que_falta": ["item faltante 1", "item faltante 2", "item faltante 3"]
    }
  ],

  "analise_mercado": {
    "panorama": "<2-3 parágrafos sobre o mercado local no segmento informado e oportunidades na região>",
    "desafios": ["desafio específico 1", "desafio específico 2", "desafio específico 3"],
    "investimento_mensal_recomendado": <número inteiro em reais, ex: 800>,
    "cpm_estimado": <número decimal, custo por mil impressões em reais, ex: 12.50>,
    "cpc_estimado": <número decimal, custo por clique em reais, ex: 1.80>,
    "oportunidade": "<2-3 frases sobre o espaço disponível no mercado digital local>"
  },

  "sobre_empresa": {
    "canais_identificados": [
      { "canal": "<nome>", "status": "ativo", "link": "" }
    ],
    "canais_ausentes": [
      { "canal": "<nome>", "oportunidade": "<por que este canal é importante para o negócio>" }
    ],
    "persona": {
      "descricao": "<2-3 frases descrevendo o cliente ideal com base nos dados>",
      "tags": ["tag1", "tag2", "tag3", "tag4"],
      "interesses": ["interesse1", "interesse2", "interesse3"],
      "onde_encontrar": ["canal digital 1", "canal digital 2", "canal digital 3"]
    }
  },

  "comunicacao": {
    "score": <inteiro 0-100>,
    "analise_geral": "<2-3 frases sobre a qualidade geral da comunicação digital>",
    "proposta_de_valor": "<análise de como o negócio comunica seu diferencial>",
    "tom_de_voz": "<análise do tom usado nas comunicações>",
    "cta": "<análise das chamadas para ação utilizadas>",
    "problemas": [
      { "nivel": "<critico|moderado|leve>", "problema": "<título do problema>", "solucao": "<ação corretiva específica>" }
    ]
  },

  "objetivos_smart": [
    {
      "titulo": "<objetivo claro e direto>",
      "meta": "<descrição da meta>",
      "especifico": "<o que exatamente será feito>",
      "mensuravel": "<número ou indicador para medir>",
      "atingivel": "<por que é possível alcançar>",
      "relevante": "<por que este objetivo importa agora>",
      "temporal": "<prazo realista, ex: 90 dias>"
    }
  ],

  "plano_acao": [
    {
      "numero": 1,
      "titulo": "<título da ação>",
      "prioridade": "<Alta|Média|Baixa>",
      "semana": <1, 2, 3 ou 4>,
      "meta": "<resultado esperado desta ação>",
      "por_que_agora": "<justificativa de urgência>",
      "passos": ["passo 1", "passo 2", "passo 3", "passo 4"]
    }
  ],

  "metricas": [
    {
      "nome": "<nome da métrica>",
      "baseline": "<valor atual estimado ou 'Não medido'>",
      "meta": "<valor alvo em 90 dias>",
      "como_medir": "<ferramenta ou método específico>",
      "frequencia": "<diária|semanal|mensal>"
    }
  ]
}`
}
