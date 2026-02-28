import { NextRequest, NextResponse } from "next/server"
import { GoogleGenerativeAI } from "@google/generative-ai"
import { createServerSupabaseClient, createAdminSupabaseClient } from "@/lib/supabase-server"
import {
  PROMPT_AGENTE_1,
  PROMPT_AGENTE_2,
  PROMPT_AGENTE_3,
  PROMPT_AGENTE_4,
  PROMPT_AGENTE_5,
  PROMPT_SINTETIZADOR,
} from "@/lib/agentes/prompts"
import type { OnboardingFormData, ResultadoDiagnostico } from "@/types"
import type { Json } from "@/types/database"

// Converte qualquer estrutura tipada para o tipo Json do Supabase.
function j<T>(value: T): Json {
  return value as unknown as Json
}

const MODELO_AGENTES = "gemini-2.0-flash-lite"
const MODELO_SINTETIZADOR = "gemini-2.5-pro"

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatarDados(dados: OnboardingFormData): string {
  return `DADOS DO NEGÓCIO:
Nome do negócio: ${dados.nome_negocio}
Responsável: ${dados.nome_responsavel}
Cidade/Bairro: ${dados.cidade_bairro}
Segmento: ${dados.segmento}
Faturamento estimado: ${dados.faturamento_faixa}
Objetivos: ${dados.objetivos.join(", ")}
Canais ativos: ${dados.canais_ativos.join(", ")}
Descrição dos clientes: ${dados.descricao_clientes}
Contexto adicional: ${dados.contexto_extra || "Não informado"}
`
}

function limparJson(texto: string): string {
  return texto
    .replace(/^```json\s*/im, "")
    .replace(/^```\s*/im, "")
    .replace(/\s*```\s*$/im, "")
    .trim()
}

/**
 * Chama um agente Gemini com system prompt e mensagem do usuário.
 * Tenta 2 vezes antes de retornar null.
 */
async function chamarAgente<T = unknown>(
  systemPrompt: string,
  userMessage: string,
  modelName: string,
  temperature: number,
  maxOutputTokens: number
): Promise<T | null> {
  const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY!)
  const model = genAI.getGenerativeModel({
    model: modelName,
    systemInstruction: systemPrompt,
    generationConfig: { temperature, maxOutputTokens },
  })

  async function tentar(): Promise<T> {
    const result = await model.generateContent(userMessage)
    return JSON.parse(limparJson(result.response.text())) as T
  }

  try {
    return await tentar()
  } catch (e1) {
    console.warn(`[agente/${modelName}] falhou na 1ª tentativa:`, e1)
    try {
      return await tentar()
    } catch (e2) {
      console.error(`[agente/${modelName}] falhou na 2ª tentativa:`, e2)
      return null
    }
  }
}

// ─── Route Handler ────────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  // 1. Verificar autenticação
  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
  }

  // 2. Verificar plano ativo
  const admin = createAdminSupabaseClient()

  const { data: profile } = await admin
    .from("profiles")
    .select("plano_ativo")
    .eq("id", user.id)
    .single()

  if (!profile?.plano_ativo) {
    return NextResponse.json(
      { error: "Acesso não autorizado: plano inativo" },
      { status: 403 }
    )
  }

  // 3. Parse do body
  let dados: OnboardingFormData
  try {
    dados = await request.json()
  } catch {
    return NextResponse.json({ error: "Body inválido" }, { status: 400 })
  }

  // 4. Criar registro com status "processando"
  const { data: diagnostico, error: insertError } = await admin
    .from("diagnosticos")
    .insert({ user_id: user.id, status: "processando" })
    .select("id")
    .single()

  if (insertError || !diagnostico) {
    console.error("Erro ao criar registro:", insertError)
    return NextResponse.json(
      { error: "Erro ao iniciar diagnóstico" },
      { status: 500 }
    )
  }

  const diagnosticoId = diagnostico.id
  const dadosFormatados = formatarDados(dados)

  // 5. Rodar os 5 agentes especialistas em paralelo
  const [agente1, agente2, agente3, agente4, agente5] = await Promise.all([
    chamarAgente(PROMPT_AGENTE_1, dadosFormatados, MODELO_AGENTES, 0.2, 2048),
    chamarAgente(PROMPT_AGENTE_2, dadosFormatados, MODELO_AGENTES, 0.2, 2048),
    chamarAgente(PROMPT_AGENTE_3, dadosFormatados, MODELO_AGENTES, 0.2, 2048),
    chamarAgente(PROMPT_AGENTE_4, dadosFormatados, MODELO_AGENTES, 0.2, 2048),
    chamarAgente(PROMPT_AGENTE_5, dadosFormatados, MODELO_AGENTES, 0.2, 2048),
  ])

  // 6. Montar mensagem para o sintetizador com todos os relatórios
  const msgSintetizador = `${dadosFormatados}
RELATÓRIO — AGENTE 1 (Analista de Negócio):
${agente1 ? JSON.stringify(agente1, null, 2) : "Dados não disponíveis"}

RELATÓRIO — AGENTE 2 (Presença Digital):
${agente2 ? JSON.stringify(agente2, null, 2) : "Dados não disponíveis"}

RELATÓRIO — AGENTE 3 (Captação e Conversão):
${agente3 ? JSON.stringify(agente3, null, 2) : "Dados não disponíveis"}

RELATÓRIO — AGENTE 4 (Posicionamento):
${agente4 ? JSON.stringify(agente4, null, 2) : "Dados não disponíveis"}

RELATÓRIO — AGENTE 5 (Retenção e Crescimento):
${agente5 ? JSON.stringify(agente5, null, 2) : "Dados não disponíveis"}`

  // 7. Sintetizador integra tudo e gera o diagnóstico final
  const resultado = await chamarAgente<ResultadoDiagnostico>(
    PROMPT_SINTETIZADOR,
    msgSintetizador,
    MODELO_SINTETIZADOR,
    0.3,
    8192
  )

  if (!resultado) {
    console.error("Sintetizador falhou após 2 tentativas")
    await admin
      .from("diagnosticos")
      .update({ status: "erro" })
      .eq("id", diagnosticoId)

    return NextResponse.json(
      { error: "Não foi possível processar o diagnóstico" },
      { status: 422 }
    )
  }

  // 8. Salvar diagnóstico completo no banco
  const { error: updateError } = await admin
    .from("diagnosticos")
    .update({
      status: "concluido",
      score_geral: resultado.score_geral,
      nivel: resultado.nivel,
      resumo_executivo: resultado.resumo_executivo,
      score_visibilidade: resultado.pilares.visibilidade.score,
      score_captacao: resultado.pilares.captacao.score,
      score_conversao: resultado.pilares.conversao.score,
      score_posicionamento: resultado.pilares.posicionamento.score,
      score_comunicacao: resultado.comunicacao.score,
      raio_x: j(resultado.pilares),
      maturidade: j(resultado.maturidade_canais),
      analise_mercado: j(resultado.analise_mercado),
      sobre_empresa: j(resultado.sobre_empresa),
      comunicacao: j(resultado.comunicacao),
      objetivos_smart: j(resultado.objetivos_smart),
      plano_acao: j(resultado.plano_acao),
      metricas: j(resultado.metricas),
      concluido_at: new Date().toISOString(),
    })
    .eq("id", diagnosticoId)

  if (updateError) {
    console.error("Erro ao salvar resultado:", updateError)
    await admin
      .from("diagnosticos")
      .update({ status: "erro" })
      .eq("id", diagnosticoId)

    return NextResponse.json(
      { error: "Erro ao salvar diagnóstico" },
      { status: 500 }
    )
  }

  // 9. Retornar o id — o client redireciona para o dashboard
  return NextResponse.json({ id: diagnosticoId })
}
