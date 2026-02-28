"use client"

import { useState, useCallback, useRef } from "react"
import { useRouter } from "next/navigation"
import { createBrowserSupabaseClient } from "@/lib/supabase-client"
import type { OnboardingFormData } from "@/types"
import type { Database } from "@/types/database"

function getSupabase() {
  return createBrowserSupabaseClient()
}

// ─── Types ────────────────────────────────────────────────────────────────────

type FormValue = string | string[] | null
type FormData = Record<string, FormValue>

interface SimpleField {
  id: string
  type: "text" | "number" | "textarea"
  label: string
  hint?: string
  optional?: boolean
  max?: number
  symbol?: string
}
interface SelectField {
  id: string
  type: "select"
  label: string
  hint?: string
  optional?: boolean
  options: string[]
}
interface CardsField {
  id: string
  type: "cards" | "cards_grid"
  label: string
  hint?: string
  optional?: boolean
  multi: boolean
  maxSelect?: number | null
  options: string[]
}
type SubField = SimpleField | SelectField | CardsField
interface CardsCondField {
  id: string
  type: "cards_cond"
  label: string
  hint?: string
  optional?: boolean
  multi: boolean
  options: string[]
  condMatch: string | string[]
  multipleMatch?: boolean
  condField?: SubField
  condFields?: SubField[]
}
type Field = SimpleField | SelectField | CardsField | CardsCondField
interface Block {
  id: number
  name: string
  title: string
  subtitle: string
  fields: Field[]
}

// ─── Blocks Data ──────────────────────────────────────────────────────────────

const BLOCKS: Block[] = [
  {
    id: 1, name: "O NEGÓCIO", title: "Vamos começar pelo básico.",
    subtitle: "Essas informações contextualizam todo o diagnóstico.",
    fields: [
      { id: "b1_nome", type: "text", label: "Qual o nome do seu negócio?" },
      { id: "b1_tempo", type: "select", label: "Há quanto tempo ele existe?", options: ["", "Menos de 1 ano", "1 a 3 anos", "3 a 5 anos", "Mais de 5 anos"] },
      { id: "b1_resumo", type: "textarea", label: "Em uma frase: o que você faz e para quem?", hint: "Ex: Ajudo mulheres acima de 40 anos a emagrecer com acompanhamento nutricional.", max: 120 },
      { id: "b1_formato", type: "cards", multi: false, label: "Você atua de forma:", options: ["Só presencial", "Presencial + online", "Só online"] },
      { id: "b1_local", type: "text", label: "Cidade e bairro onde atua" },
      { id: "b1_equipe", type: "select", label: "Quantas pessoas trabalham no negócio hoje (incluindo você)?", options: ["", "Só eu", "2-3 pessoas", "4-10 pessoas", "Mais de 10"] },
    ],
  },
  {
    id: 2, name: "FINANÇAS", title: "Vamos entender a saúde financeira.",
    subtitle: "Essas informações são confidenciais e só servem para calibrar o diagnóstico.",
    fields: [
      { id: "b2_fat", type: "select", label: "Faturamento médio mensal nos últimos 3 meses:", options: ["", "Até R$5k", "R$5-15k", "R$15-30k", "R$30-60k", "R$60-100k", "Acima de R$100k"] },
      { id: "b2_tendencia", type: "cards_grid", multi: false, label: "Nos últimos 6 meses, seu faturamento está:", options: ["Crescendo", "Estável", "Caindo", "Muito instável"] },
      { id: "b2_ticket", type: "select", label: "Ticket médio do seu serviço ou produto principal:", options: ["", "Até R$150", "R$150-500", "R$500-1.500", "R$1.500-5.000", "Acima de R$5.000"] },
      { id: "b2_cac", type: "cards_cond", multi: false, label: "Você sabe quanto custa para conseguir um cliente novo?", options: ["Sei exatamente", "Tenho uma ideia", "Não faço ideia"], condMatch: "Sei exatamente", condField: { id: "b2_cac_valor", type: "number", label: "R$", symbol: "R$" } },
      { id: "b2_problema", type: "cards", multi: true, maxSelect: 2, label: "Qual o maior problema financeiro do negócio agora?", options: ["Faturamento irregular — meses bons e ruins sem previsibilidade", "Muitos clientes mas margem baixa", "Poucos clientes, preciso crescer o volume", "Custo operacional alto demais", "Dependo de poucos clientes grandes — risco concentrado", "Não sei ao certo — as contas fecham mas não sobra"] },
    ],
  },
  {
    id: 3, name: "CLIENTES E MERCADO", title: "Agora vamos falar sobre quem você atende.",
    subtitle: "Quanto mais específico, mais preciso fica o diagnóstico.",
    fields: [
      { id: "b3_ideal", type: "textarea", label: "Descreva seu cliente ideal com o máximo de detalhes:", hint: "Pense em: idade, profissão, problema principal, por que fechou com você e não com o concorrente.", max: 300 },
      { id: "b3_valor", type: "cards", multi: true, maxSelect: 3, label: "O que seu cliente mais valoriza no que você entrega?", options: ["Resultado rápido", "Atendimento personalizado e próximo", "Preço acessível", "Confiança / reputação / indicação", "Localização / conveniência", "Expertise / especialização", "Garantia ou segurança"] },
      { id: "b3_desistencia", type: "cards", multi: true, maxSelect: 2, label: "O que faz um cliente desistir de fechar com você?", options: ["Preço — acha caro", "Não entendeu bem o que oferece", "Foi para um concorrente", "Sumiu sem explicação", "Quis pensar e não voltou", "Não sei — perco clientes e não entendo por quê"] },
      { id: "b3_concorrentes", type: "textarea", label: "Você tem concorrentes que te incomodam? Quem?", hint: "Nome do negócio ou 'tem vários mas não sei os nomes'", max: 150 },
      { id: "b3_melhor", type: "textarea", label: "No que você é objetivamente melhor que seus concorrentes?", hint: "Se não souber, escreva: 'Ainda não sei ao certo'", max: 150 },
    ],
  },
  {
    id: 4, name: "CAPTAÇÃO DE CLIENTES", title: "De onde vêm seus clientes hoje?",
    subtitle: "Vamos mapear sua captação atual.",
    fields: [
      { id: "b4_origem", type: "cards", multi: true, maxSelect: 3, label: "De onde vêm a maioria dos seus clientes? (escolha até 3)", options: ["Indicação de clientes atuais", "Instagram orgânico", "Google (busca ou Maps)", "Facebook", "Anúncios pagos (Meta ou Google Ads)", "WhatsApp (lista, grupos)", "Eventos / networking presencial", "Fachada física / movimento local", "Outros"] },
      { id: "b4_novos", type: "select", label: "Quantos clientes novos por mês em média?", options: ["", "0-2", "3-5", "6-10", "11-20", "21-50", "Mais de 50"] },
      { id: "b4_fecham", type: "select", label: "De cada 10 pessoas interessadas, quantas fecham?", options: ["", "1-2 fecham", "3-4 fecham", "5-6 fecham", "7-8 fecham", "9-10 fecham", "Não sei"] },
      { id: "b4_obstaculo", type: "textarea", label: "Qual o maior obstáculo para captar mais clientes?", hint: "Seja honesto. Aqui não tem resposta certa.", max: 200 },
      { id: "b4_nfunciona", type: "textarea", label: "Você já tentou algo que NÃO funcionou?", hint: "Ex: Fiz anúncios no Facebook e gastei R$800 sem retorno", max: 200 },
    ],
  },
  {
    id: 5, name: "PRESENÇA DIGITAL", title: "Vamos auditar sua presença digital.",
    subtitle: "Canal por canal.",
    fields: [
      { id: "b5_insta", type: "cards_cond", multi: false, label: "Instagram — como está seu perfil?", options: ["Não tenho para o negócio", "Tenho mas posto raramente", "Posto 2-3x por semana", "Posto todo dia com estratégia"], condMatch: ["Tenho mas posto raramente", "Posto 2-3x por semana", "Posto todo dia com estratégia"], multipleMatch: true, condFields: [{ id: "b5_insta_handle", type: "text", label: "@handle (seu @ no Instagram)" }, { id: "b5_insta_seguidores", type: "select", label: "Número de seguidores", options: ["", "até 500", "500-2k", "2k-10k", "10k-50k", "+50k"] }] },
      { id: "b5_gmn", type: "cards", multi: false, label: "Google Meu Negócio — como está?", options: ["Não tenho / não sei o que é", "Tenho mas está incompleto", "Tenho completo, poucas avaliações", "Completo e bem avaliado (4+ estrelas, 20+ avaliações)"] },
      { id: "b5_site", type: "cards_cond", multi: false, label: "Você tem site ou landing page?", options: ["Não tenho", "Tenho mas não converte", "Tenho e funciona bem"], condMatch: ["Tenho mas não converte", "Tenho e funciona bem"], multipleMatch: true, condField: { id: "b5_site_url", type: "text", label: "URL do site" } },
      { id: "b5_ads", type: "cards_cond", multi: false, label: "Investe em anúncios pagos atualmente?", options: ["Nunca investi", "Já investi mas parei — não vi resultado", "Sim, invisto atualmente", "Estou começando agora"], condMatch: ["Sim, invisto atualmente", "Estou começando agora"], multipleMatch: true, condFields: [{ id: "b5_ads_orcamento", type: "select", label: "Orçamento mensal", options: ["", "Até R$500/mês", "R$500-1.500", "R$1.500-5.000", "+R$5.000"] }, { id: "b5_ads_plats", type: "cards_grid", multi: true, label: "Quais plataformas?", options: ["Meta Ads", "Google Ads", "TikTok Ads", "Outros"] }] },
      { id: "b5_wpp", type: "cards", multi: false, label: "WhatsApp Business — como usa?", options: ["Uso WhatsApp pessoal misturado com negócio", "Tenho WA Business básico", "WA Business com catálogo e respostas automáticas", "Não uso WhatsApp para negócio"] },
    ],
  },
  {
    id: 6, name: "PROCESSO DE VENDAS", title: "Como você converte interesse em cliente?",
    subtitle: "Aqui a maioria dos negócios perde mais dinheiro do que imagina.",
    fields: [
      { id: "b6_tempo", type: "cards", multi: false, label: "Quando alguém entra em contato, você responde em quanto tempo?", options: ["Menos de 1h", "1 a 3h", "Até 24h", "Mais de 24h", "Depende do dia"] },
      { id: "b6_script", type: "cards", multi: false, label: "Você tem script ou processo definido para atender e fechar?", options: ["Não — atendo de forma intuitiva", "Tenho alguns pontos mas não é padronizado", "Sim, processo definido e sigo sempre"] },
      { id: "b6_followup", type: "cards", multi: false, label: "Você faz follow-up com quem não fechou na hora?", options: ["Não — se não fechou, deixo para lá", "Às vezes, quando lembro", "Sim, tenho cadência definida"] },
      { id: "b6_captura", type: "cards", multi: false, label: "Você captura o contato de quem visita seu Instagram ou site?", options: ["Não — só falo com quem me chama", "Tenho formulário mas pouco usado", "Sim, tenho funil ativo de captura"] },
      { id: "b6_perde", type: "textarea", label: "Qual a principal razão pela qual você PERDE vendas?", max: 200 },
    ],
  },
  {
    id: 7, name: "POSICIONAMENTO", title: "O que te diferencia no mercado?",
    subtitle: "Essa é a pergunta que a maioria dos donos de negócio não sabe responder bem.",
    fields: [
      { id: "b7_porque", type: "textarea", label: "Se um cliente perguntar 'por que você e não o concorrente?', o que você responde?", hint: "Pode ser honesto se ainda não sabe responder bem.", max: 250 },
      { id: "b7_diferencial", type: "cards", multi: true, maxSelect: null, label: "Você tem algum elemento de diferenciação claro?", options: ["Especialização em nicho específico", "Metodologia ou processo próprio", "Garantia de resultado", "Atendimento exclusivo / personalizado", "Preço mais acessível", "Localização privilegiada", "Tempo de mercado / reputação", "Ainda não tenho diferencial claro"] },
      { id: "b7_preco", type: "cards", multi: false, label: "Como você se posiciona em relação ao preço?", options: ["Sou o mais barato — preço é meu diferencial", "Tenho preço médio do mercado", "Cobro mais caro — entrego mais valor", "Não sei onde estou vs concorrentes"] },
      { id: "b7_prova", type: "cards", multi: false, label: "Você usa depoimentos e provas sociais ativamente?", options: ["Não tenho ou não uso", "Tenho alguns mas não divulgo direito", "Sim, uso resultados e depoimentos ativamente"] },
    ],
  },
  {
    id: 8, name: "RETENÇÃO", title: "Seus clientes ficam com você?",
    subtitle: "Crescer fica muito mais fácil quando os clientes voltam.",
    fields: [
      { id: "b8_voltam", type: "cards", multi: false, label: "Seus clientes voltam a comprar ou contratar?", options: ["Raramente — transação única na maioria dos casos", "Alguns voltam mas não é a maioria", "A maioria vira recorrente", "Tenho modelo de assinatura / mensalidade"] },
      { id: "b8_contato", type: "cards", multi: true, maxSelect: null, label: "Você tem estratégia para manter contato com quem já comprou?", options: ["Não — perco o contato após o serviço", "WhatsApp eventual", "Email marketing", "Redes sociais", "Programa de fidelidade", "Comunidade (grupo, app)"] },
      { id: "b8_indicam", type: "cards", multi: false, label: "Clientes satisfeitos te indicam para outras pessoas?", options: ["Raramente — nunca incentivei isso", "Às vezes, por conta própria", "Sim, tenho programa de indicação ativo", "Indicação é minha principal fonte hoje"] },
    ],
  },
  {
    id: 9, name: "OPERAÇÃO", title: "Como está sua operação hoje?",
    subtitle: "Crescer sem estrutura quebra o negócio.",
    fields: [
      { id: "b9_capacidade", type: "cards", multi: false, label: "Sua capacidade atual de atendimento:", options: ["Já estou no limite — não consigo mais clientes", "Tenho margem de até 30% a mais", "Tenho muito espaço — falta clientes, não capacidade", "Não sei calcular minha capacidade"] },
      { id: "b9_tempo", type: "cards", multi: true, maxSelect: null, label: "O que mais consome seu tempo além de atender clientes?", options: ["Administração / financeiro / burocracia", "Redes sociais e marketing", "Atendimento e suporte pós-venda", "Prospecção e vendas", "Gestão de equipe", "Tudo ao mesmo tempo"] },
      { id: "b9_sistemas", type: "cards", multi: true, maxSelect: null, label: "Que sistemas de gestão você usa hoje?", options: ["Nenhum — gestão na memória ou papel", "Planilha Excel / Google Sheets", "WhatsApp como CRM informal", "Sistema de agendamento (Calendly, Doctoralia etc.)", "CRM ou sistema de gestão de clientes", "ERP ou sistema mais completo"] },
    ],
  },
  {
    id: 10, name: "OBJETIVOS E CONTEXTO FINAL", title: "Últimas perguntas — e as mais importantes.",
    subtitle: "Aqui a IA calibra as recomendações para o que você realmente precisa.",
    fields: [
      { id: "b10_objetivo", type: "cards", multi: false, label: "Objetivo de faturamento para os próximos 12 meses:", options: ["Manter o que tenho com mais estabilidade", "Crescer até 30%", "Dobrar o faturamento", "Triplicar ou mais", "Ainda não defini"] },
      { id: "b10_unico", type: "textarea", label: "Se você pudesse resolver APENAS UMA COISA no seu negócio agora, o que seria?", max: 200 },
      { id: "b10_travado", type: "cards", multi: false, label: "Há quanto tempo você sente que o crescimento está travado?", options: ["Estou crescendo — quero acelerar", "Estagnado há menos de 6 meses", "Estagnado há 6 a 12 meses", "Estagnado há mais de 1 ano", "Na verdade estou diminuindo"] },
      { id: "b10_agencia", type: "cards_cond", multi: false, label: "Você já trabalhou com agência ou consultor de marketing?", options: ["Não, nunca", "Sim — e foi bom", "Sim — e foi frustrante, não vi resultado", "Tentei fazer sozinho com cursos"], condMatch: "Sim — e foi frustrante, não vi resultado", condField: { id: "b10_agencia_frust", type: "textarea", label: "O que deu errado?", max: 150 } },
      { id: "b10_extra", type: "textarea", label: "Tem algo importante sobre seu negócio que não foi perguntado?", hint: "Opcional — mas pode fazer diferença no diagnóstico", max: 400, optional: true },
    ],
  },
]

// ─── Helpers ──────────────────────────────────────────────────────────────────

function str(v: FormValue): string {
  if (!v) return "N/A"
  if (Array.isArray(v)) return v.join(", ") || "N/A"
  return v || "N/A"
}

function buildRichContext(data: FormData): string {
  const lines = [
    `TEMPO DE MERCADO: ${str(data.b1_tempo)}`,
    `FORMATO DE ATUAÇÃO: ${str(data.b1_formato)}`,
    `TAMANHO DA EQUIPE: ${str(data.b1_equipe)}`,
    `TENDÊNCIA DE FATURAMENTO: ${str(data.b2_tendencia)}`,
    `TICKET MÉDIO: ${str(data.b2_ticket)}`,
    `CONHECE CAC: ${str(data.b2_cac)}`,
    data.b2_cac_valor ? `CAC ATUAL: R$${data.b2_cac_valor}` : null,
    `PROBLEMAS FINANCEIROS: ${str(data.b2_problema)}`,
    `O QUE CLIENTES VALORIZAM: ${str(data.b3_valor)}`,
    `POR QUE CLIENTES DESISTEM: ${str(data.b3_desistencia)}`,
    `CONCORRENTES: ${str(data.b3_concorrentes)}`,
    `DIFERENCIAL VS CONCORRENTES: ${str(data.b3_melhor)}`,
    `CLIENTES NOVOS/MÊS: ${str(data.b4_novos)}`,
    `TAXA DE FECHAMENTO: ${str(data.b4_fecham)}`,
    `OBSTÁCULO CAPTAÇÃO: ${str(data.b4_obstaculo)}`,
    `O QUE NÃO FUNCIONOU: ${str(data.b4_nfunciona)}`,
    `INSTAGRAM: ${str(data.b5_insta)}`,
    data.b5_insta_handle ? `INSTAGRAM HANDLE: @${data.b5_insta_handle}` : null,
    data.b5_insta_seguidores ? `SEGUIDORES: ${data.b5_insta_seguidores}` : null,
    `GOOGLE MEU NEGÓCIO: ${str(data.b5_gmn)}`,
    `SITE: ${str(data.b5_site)}`,
    data.b5_site_url ? `URL SITE: ${data.b5_site_url}` : null,
    `ANÚNCIOS PAGOS: ${str(data.b5_ads)}`,
    data.b5_ads_orcamento ? `ORÇAMENTO ADS: ${data.b5_ads_orcamento}` : null,
    data.b5_ads_plats ? `PLATAFORMAS ADS: ${str(data.b5_ads_plats)}` : null,
    `WHATSAPP BUSINESS: ${str(data.b5_wpp)}`,
    `TEMPO RESPOSTA LEADS: ${str(data.b6_tempo)}`,
    `PROCESSO DE VENDAS: ${str(data.b6_script)}`,
    `FAZ FOLLOW-UP: ${str(data.b6_followup)}`,
    `CAPTURA CONTATOS: ${str(data.b6_captura)}`,
    `POR QUE PERDE VENDAS: ${str(data.b6_perde)}`,
    `PITCH VS CONCORRENTES: ${str(data.b7_porque)}`,
    `DIFERENCIAIS: ${str(data.b7_diferencial)}`,
    `POSICIONAMENTO DE PREÇO: ${str(data.b7_preco)}`,
    `USA PROVA SOCIAL: ${str(data.b7_prova)}`,
    `RECORRÊNCIA DE CLIENTES: ${str(data.b8_voltam)}`,
    `ESTRATÉGIA PÓS-VENDA: ${str(data.b8_contato)}`,
    `INDICAÇÕES: ${str(data.b8_indicam)}`,
    `CAPACIDADE DE ATENDIMENTO: ${str(data.b9_capacidade)}`,
    `O QUE CONSOME TEMPO: ${str(data.b9_tempo)}`,
    `SISTEMAS USADOS: ${str(data.b9_sistemas)}`,
    `TEMPO ESTAGNADO: ${str(data.b10_travado)}`,
    `PROBLEMA ÚNICO A RESOLVER: ${str(data.b10_unico)}`,
    `EXPERIÊNCIA COM AGÊNCIA: ${str(data.b10_agencia)}`,
    data.b10_agencia_frust ? `FRUSTRAÇÃO COM AGÊNCIA: ${data.b10_agencia_frust}` : null,
  ].filter(Boolean) as string[]

  const richCtx = lines.join("\n")
  const extraDoUsuario = typeof data.b10_extra === "string" && data.b10_extra.trim()
    ? `\n\nCONTEXTO ADICIONAL DO EMPRESÁRIO:\n${data.b10_extra}`
    : ""
  return richCtx + extraDoUsuario
}

function buildApiPayload(data: FormData, userEmail: string): OnboardingFormData {
  const canaisAtivos: string[] = []
  if (Array.isArray(data.b4_origem)) canaisAtivos.push(...data.b4_origem)

  const insta = data.b5_insta as string
  if (insta && insta !== "Não tenho para o negócio") canaisAtivos.push(`Instagram (${insta})`)
  const gmn = data.b5_gmn as string
  if (gmn && !gmn.startsWith("Não tenho")) canaisAtivos.push(`Google Meu Negócio (${gmn})`)
  const site = data.b5_site as string
  if (site && site !== "Não tenho") canaisAtivos.push(`Site (${site})`)
  const wpp = data.b5_wpp as string
  if (wpp && !wpp.includes("Não uso")) canaisAtivos.push(`WhatsApp (${wpp})`)

  const objetivo = data.b10_objetivo as string

  return {
    nome_responsavel: userEmail,
    nome_negocio: (data.b1_nome as string) || "",
    cidade_bairro: (data.b1_local as string) || "",
    segmento: (data.b1_resumo as string) || "",
    faturamento_faixa: (data.b2_fat as string) || "",
    objetivos: objetivo ? [objetivo] : [],
    descricao_clientes: (data.b3_ideal as string) || "",
    canais_ativos: canaisAtivos.filter((v, i, a) => a.indexOf(v) === i),
    contexto_extra: buildRichContext(data),
  }
}

// ─── Sub-components ───────────────────────────────────────────────────────────

const INPUT_BASE = "w-full bg-[#0A1628] border border-[#1A3050] text-white rounded-xl px-4 py-3.5 text-base outline-none focus:border-[#0066FF] transition-colors"
const SELECT_BASE = `${INPUT_BASE} appearance-none cursor-pointer`

function CardGroup({ field, value, onChange }: {
  field: CardsField
  value: FormValue
  onChange: (v: FormValue) => void
}) {
  const selected = Array.isArray(value) ? value : value ? [value] : []
  const isRow = field.type === "cards_grid"

  function toggle(opt: string) {
    if (field.multi) {
      if (selected.includes(opt)) {
        onChange(selected.filter(s => s !== opt))
      } else {
        if (field.maxSelect && selected.length >= field.maxSelect) return
        onChange([...selected, opt])
      }
    } else {
      onChange(opt)
    }
  }

  const limitReached = field.multi && field.maxSelect != null && selected.length >= field.maxSelect

  return (
    <div className={`grid gap-2.5 ${isRow ? "grid-cols-2 sm:grid-cols-4" : "grid-cols-1"}`}>
      {field.options.map(opt => {
        const isSelected = selected.includes(opt)
        const isDisabled = limitReached && !isSelected
        return (
          <button
            key={opt}
            type="button"
            onClick={() => !isDisabled && toggle(opt)}
            className={[
              "px-4 py-4 rounded-xl border text-left text-[15px] leading-snug transition-all select-none",
              isRow ? "text-center justify-center" : "",
              isSelected
                ? "bg-[#0A1F3A] border-[#0066FF] text-white"
                : isDisabled
                  ? "bg-[#0D1F35] border-[#1A3050] text-[#8B9DB5] opacity-50 cursor-not-allowed"
                  : "bg-[#0D1F35] border-[#1A3050] text-white hover:border-[#8B9DB5] cursor-pointer",
            ].join(" ")}
          >
            {opt}
          </button>
        )
      })}
    </div>
  )
}

function FieldRenderer({ field, data, onChange }: {
  field: SubField | Field
  data: FormData
  onChange: (id: string, value: FormValue) => void
}) {
  const value = data[field.id] ?? ""

  if (field.type === "text") {
    return (
      <input
        type="text"
        value={value as string}
        onChange={e => onChange(field.id, e.target.value)}
        className={INPUT_BASE}
      />
    )
  }

  if (field.type === "number") {
    return (
      <div className="relative flex items-center">
        {field.symbol && (
          <span className="absolute left-4 text-[#8B9DB5] text-base pointer-events-none">{field.symbol}</span>
        )}
        <input
          type="number"
          value={value as string}
          onChange={e => onChange(field.id, e.target.value)}
          className={`${INPUT_BASE} ${field.symbol ? "pl-10" : ""}`}
        />
      </div>
    )
  }

  if (field.type === "select") {
    return (
      <div className="relative">
        <select
          value={value as string}
          onChange={e => onChange(field.id, e.target.value)}
          className={SELECT_BASE}
          style={{ backgroundImage: `url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%238B9DB5' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e")`, backgroundRepeat: "no-repeat", backgroundPosition: "right 1rem center", backgroundSize: "1em" }}
        >
          {field.options.map(opt => (
            <option key={opt} value={opt} disabled={opt === ""}>
              {opt === "" ? "Selecione uma opção" : opt}
            </option>
          ))}
        </select>
      </div>
    )
  }

  if (field.type === "textarea") {
    return (
      <textarea
        value={value as string}
        onChange={e => onChange(field.id, e.target.value)}
        maxLength={field.max}
        rows={4}
        className={`${INPUT_BASE} resize-y min-h-[100px]`}
      />
    )
  }

  if (field.type === "cards" || field.type === "cards_grid") {
    return (
      <CardGroup
        field={field as CardsField}
        value={data[field.id] ?? null}
        onChange={v => onChange(field.id, v)}
      />
    )
  }

  if (field.type === "cards_cond") {
    const f = field as CardsCondField
    const selectedVal = data[f.id] as string | undefined
    const matches = Array.isArray(f.condMatch) ? f.condMatch : [f.condMatch]
    const showCond = selectedVal ? matches.includes(selectedVal) : false
    const subFields = f.condFields ?? (f.condField ? [f.condField] : [])

    return (
      <>
        <CardGroup
          field={{ id: f.id, type: "cards", multi: f.multi, label: f.label, options: f.options }}
          value={data[f.id] ?? null}
          onChange={v => onChange(f.id, v)}
        />
        {showCond && subFields.length > 0 && (
          <div className="flex flex-col gap-5 mt-1 animate-in fade-in duration-200">
            {subFields.map(sf => (
              <div key={sf.id} className="flex flex-col gap-3">
                <label className="text-[15px] font-semibold text-white">{sf.label}</label>
                <FieldRenderer field={sf} data={data} onChange={onChange} />
              </div>
            ))}
          </div>
        )}
      </>
    )
  }

  return null
}

// ─── Main Component ────────────────────────────────────────────────────────────

export default function OnboardingForm() {
  const router = useRouter()
  const [currentBlock, setCurrentBlock] = useState(0)
  const [formData, setFormData] = useState<FormData>({})
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [animClass, setAnimClass] = useState("")
  const [isNavigating, setIsNavigating] = useState(false)
  const [submitError, setSubmitError] = useState("")

  const block = BLOCKS[currentBlock]
  const isLastBlock = currentBlock === BLOCKS.length - 1
  const progressPct = (currentBlock / 10) * 100

  const updateField = useCallback((id: string, value: FormValue) => {
    setFormData(prev => ({ ...prev, [id]: value }))
    setErrors(prev => {
      if (!prev[id]) return prev
      const next = { ...prev }
      delete next[id]
      return next
    })
  }, [])

  function validateCurrentBlock(): boolean {
    const newErrors: Record<string, string> = {}

    for (const field of block.fields) {
      if (field.optional) continue
      const val = formData[field.id]

      if (field.type === "cards" || field.type === "cards_grid") {
        const f = field as CardsField
        if (f.multi) {
          if (!Array.isArray(val) || val.length === 0) newErrors[field.id] = "Selecione ao menos uma opção."
        } else {
          if (!val) newErrors[field.id] = "Selecione uma opção."
        }
      } else if (field.type === "cards_cond") {
        const f = field as CardsCondField
        if (!val) {
          newErrors[field.id] = "Selecione uma opção."
        } else {
          // Validate visible conditional sub-fields
          const matches = Array.isArray(f.condMatch) ? f.condMatch : [f.condMatch]
          if (matches.includes(val as string)) {
            const subFields = f.condFields ?? (f.condField ? [f.condField] : [])
            for (const sf of subFields) {
              if ((sf as SimpleField).optional) continue
              // Skip multi cards inside condFields (optional validation)
              if (sf.type === "cards" || sf.type === "cards_grid") continue
              const sv = formData[sf.id]
              if (!sv || (typeof sv === "string" && sv.trim() === "")) {
                newErrors[sf.id] = "Este campo é obrigatório."
              }
            }
          }
        }
      } else if (field.type === "select") {
        if (!val || val === "") newErrors[field.id] = "Selecione uma opção."
      } else {
        const sv = val as string
        if (!sv || sv.trim() === "") newErrors[field.id] = "Este campo é obrigatório."
      }
    }

    setErrors(newErrors)

    if (Object.keys(newErrors).length > 0) {
      // Scroll to first error
      const firstErrId = Object.keys(newErrors)[0]
      const el = document.getElementById(`group_${firstErrId}`)
      el?.scrollIntoView({ behavior: "smooth", block: "center" })
      return false
    }
    return true
  }

  function navigate(direction: "forward" | "backward") {
    if (isNavigating) return
    setIsNavigating(true)
    setAnimClass(direction === "forward" ? "slide-out-l" : "slide-out-r")
    setTimeout(() => {
      setCurrentBlock(prev => prev + (direction === "forward" ? 1 : -1))
      setAnimClass(direction === "forward" ? "slide-in-r" : "slide-in-l")
      setIsNavigating(false)
      window.scrollTo({ top: 0, behavior: "instant" })
    }, 280)
  }

  function handleNext() {
    if (!validateCurrentBlock()) return
    navigate("forward")
  }

  function handlePrev() {
    navigate("backward")
  }

  async function handleSubmit() {
    if (!validateCurrentBlock()) return
    setSubmitError("")

    const supabase = getSupabase()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setSubmitError("Sessão expirada. Recarregue a página."); return }

    // Build payload for the API
    const payload = buildApiPayload(formData, user.email ?? "")

    // Persist to onboarding_respostas
    const objetivo = formData.b10_objetivo
    await supabase.from("onboarding_respostas").upsert({
      user_id: user.id,
      objetivos: objetivo ? (Array.isArray(objetivo) ? objetivo : [objetivo]) : [],
      descricao_clientes: (formData.b3_ideal as string) || "",
      canais_ativos: Array.isArray(formData.b4_origem) ? formData.b4_origem : [],
      contexto_extra: buildRichContext(formData),
      completed: true,
    }, { onConflict: "user_id" })

    // Update profile with extracted basic fields
    await supabase.from("profiles").update({
      nome_negocio: (formData.b1_nome as string) || "",
      cidade_bairro: (formData.b1_local as string) || "",
      segmento: (formData.b1_resumo as string) || "",
      faturamento_faixa: (formData.b2_fat as string) || "",
      onboarding_completo: true,
    }).eq("id", user.id)

    // Hand off to loading page via sessionStorage
    sessionStorage.setItem("cineze_onboarding_payload", JSON.stringify(payload))

    router.push("/loading")
  }

  return (
    <>
      {/* Keyframe animations */}
      <style dangerouslySetInnerHTML={{
        __html: `
        @keyframes slideInR { from { transform: translateX(30px); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
        @keyframes slideInL { from { transform: translateX(-30px); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
        .slide-in-r { animation: slideInR 280ms forwards; }
        .slide-in-l { animation: slideInL 280ms forwards; }
        .slide-out-l { transform: translateX(-30px) !important; opacity: 0 !important; transition: transform 280ms ease, opacity 280ms ease; }
        .slide-out-r { transform: translateX(30px) !important; opacity: 0 !important; transition: transform 280ms ease, opacity 280ms ease; }
      ` }} />

      <div className="flex flex-col min-h-screen pb-[80px]" style={{ backgroundColor: "#060D1A", color: "#FFFFFF", fontFamily: "Inter, sans-serif" }}>
        {/* Header */}
        <header className="text-center pt-8 pb-0">
          <div className="text-2xl font-bold tracking-tight mb-1">cineze</div>
          <div className="w-full h-1" style={{ backgroundColor: "#1A3050" }}>
            <div
              className="h-full transition-all duration-300"
              style={{ width: `${progressPct}%`, background: "linear-gradient(135deg, #0066FF, #06B7D8)" }}
            />
          </div>
        </header>

        {/* Main content */}
        <main className="flex-1 w-full max-w-[640px] mx-auto px-5 pt-10 pb-5">
          {/* Block header */}
          <div className="mb-8">
            <span className="block text-[13px] uppercase tracking-wide mb-3" style={{ color: "#8B9DB5" }}>
              Bloco {block.id} de 10 — {block.name}
            </span>
            <h1 className="text-[28px] font-bold mb-2">{block.title}</h1>
            <p className="text-base leading-relaxed" style={{ color: "#8B9DB5" }}>{block.subtitle}</p>
          </div>

          {/* Animated fields container */}
          <div className={animClass}>
            <div className="flex flex-col gap-6">
              {block.fields.map(field => (
                <div key={field.id} id={`group_${field.id}`} className="flex flex-col gap-3">
                  <label className="text-[15px] font-semibold">{field.label}</label>
                  {field.hint && (
                    <p className="text-[13px] -mt-1" style={{ color: "#8B9DB5" }}>{field.hint}</p>
                  )}
                  <FieldRenderer field={field} data={formData} onChange={updateField} />
                  {errors[field.id] && (
                    <p className="text-[13px]" style={{ color: "#FF4A4A" }}>{errors[field.id]}</p>
                  )}
                  {/* Conditional sub-field errors for cards_cond */}
                  {field.type === "cards_cond" &&
                    ((field as CardsCondField).condFields ?? ((field as CardsCondField).condField ? [(field as CardsCondField).condField!] : [])).map(sf =>
                      errors[sf.id] ? (
                        <p key={sf.id} className="text-[13px]" style={{ color: "#FF4A4A" }}>{errors[sf.id]}</p>
                      ) : null
                    )
                  }
                </div>
              ))}
            </div>
          </div>

          {submitError && (
            <p className="mt-4 text-center text-[14px]" style={{ color: "#FF4A4A" }}>{submitError}</p>
          )}
        </main>

        {/* Footer */}
        <footer
          className="fixed bottom-0 left-0 w-full px-5 py-4 flex items-center justify-between z-10"
          style={{ backgroundColor: "rgba(6,13,26,0.95)", backdropFilter: "blur(10px)" }}
        >
          <div className="w-full max-w-[640px] mx-auto flex items-center justify-between">
            {currentBlock > 0 ? (
              <button
                type="button"
                onClick={handlePrev}
                disabled={isNavigating}
                className="px-7 py-3.5 rounded-xl text-base font-semibold border transition-colors disabled:opacity-50"
                style={{ borderColor: "#1A3050", color: "#FFFFFF", background: "transparent" }}
              >
                Voltar
              </button>
            ) : (
              <div />
            )}

            {!isLastBlock ? (
              <button
                type="button"
                onClick={handleNext}
                disabled={isNavigating}
                className="min-w-[140px] px-7 py-3.5 rounded-xl text-base font-semibold text-white transition-all disabled:opacity-50"
                style={{ background: "linear-gradient(135deg, #0066FF, #06B7D8)" }}
              >
                Avançar
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={isNavigating}
                className="flex-1 ml-4 py-[18px] rounded-xl text-base font-bold text-white transition-all disabled:opacity-50"
                style={{ background: "linear-gradient(135deg, #0066FF, #06B7D8)" }}
              >
                GERAR MEU DIAGNÓSTICO →
              </button>
            )}
          </div>
        </footer>
      </div>
    </>
  )
}
