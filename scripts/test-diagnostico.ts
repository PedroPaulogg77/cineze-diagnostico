/**
 * Script de teste: roda o diagnóstico completo como o usuário teste@teste.com
 * Executar com: npx tsx scripts/test-diagnostico.ts
 */

import { readFileSync, writeFileSync } from "fs"
import { join } from "path"
import { createClient } from "@supabase/supabase-js"
import { GoogleGenerativeAI } from "@google/generative-ai"
import {
  PROMPT_AGENTE_1,
  PROMPT_AGENTE_2,
  PROMPT_AGENTE_3,
  PROMPT_AGENTE_4,
  PROMPT_AGENTE_5,
  PROMPT_SINTETIZADOR,
} from "../lib/agentes/prompts"

// ─── 1. Carregar .env.local ────────────────────────────────────────────────────

const envRaw = readFileSync(join(process.cwd(), ".env.local"), "utf-8")
const env: Record<string, string> = {}
for (const line of envRaw.split("\n")) {
  const trimmed = line.trim()
  if (!trimmed || trimmed.startsWith("#")) continue
  const eqIdx = trimmed.indexOf("=")
  if (eqIdx === -1) continue
  env[trimmed.slice(0, eqIdx).trim()] = trimmed.slice(eqIdx + 1).trim()
}

const SUPABASE_URL      = env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_ANON_KEY = env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const SUPABASE_SVC_KEY  = env.SUPABASE_SERVICE_ROLE_KEY!
const GOOGLE_KEY        = env.GOOGLE_AI_API_KEY!

// ─── 2. Dados realistas do negócio de teste ───────────────────────────────────

const NEGOCIO = {
  nome:        "Studio Forma & Saúde",
  responsavel: "teste@teste.com",
  cidade:      "Belo Horizonte, MG — Bairro Funcionários",
  segmento:    "Personal trainer e instrutora de Pilates para mulheres adultas acima de 35 anos que buscam saúde, correção postural e emagrecimento com acompanhamento individualizado.",
  faturamento: "R$5-15k",
  objetivos:   ["Crescer até 30%"],
  canais:      ["Indicação de clientes atuais", "Instagram orgânico", "Google (busca ou Maps)", "WhatsApp (lista, grupos)"],
  clientes:    "Mulheres entre 35 e 55 anos, classes A e B, profissionais liberais e executivas de BH, principalmente do Funcionários, Savassi e Lourdes. Geralmente chegam com queixas de dor lombar, sedentarismo pós-pandemia ou indicação médica para Pilates. Fecham quando confiam no método e na atenção personalizada.",
  contexto: `TEMPO DE MERCADO: 1 a 3 anos
FORMATO DE ATUAÇÃO: Só presencial
TAMANHO DA EQUIPE: Só eu
TENDÊNCIA DE FATURAMENTO: Estável
TICKET MÉDIO: R$500-1.500
CONHECE CAC: Tenho uma ideia
PROBLEMAS FINANCEIROS: Faturamento irregular — meses bons e ruins sem previsibilidade, Poucos clientes, preciso crescer o volume
O QUE CLIENTES VALORIZAM: Atendimento personalizado e próximo, Expertise / especialização, Resultado rápido
POR QUE CLIENTES DESISTEM: Preço — acha caro, Quis pensar e não voltou
CONCORRENTES: Varios studios de pilates na Savassi e Lourdes. Os maiores são: Studio Corpo & Alma (30+ alunos), Move Pilates Savassi, e freelancers que cobram mais barato em domicilio.
DIFERENCIAL VS CONCORRENTES: Atendimento individual sem turmas grandes. Máximo 4 alunos por aula. Especialização em mulheres acima de 40 com histórico de lesão ou problema postural. Faço avaliação postural completa antes de começar.
CLIENTES NOVOS/MÊS: 3-5
TAXA DE FECHAMENTO: 3-4 fecham
OBSTÁCULO CAPTAÇÃO: Não tenho visibilidade. Quem não me conhece não me acha. Dependo quase 100% de indicação, quando o fluxo de indicações para, fico sem clientes novos. Já tentei postar mais no Instagram mas não converte.
O QUE NÃO FUNCIONOU: Tentei fazer impulsionamento de post no Instagram gastei R$300 e não veio nenhum cliente. Fiz também panfleto em condomínio próximo sem retorno nenhum.
INSTAGRAM: Posto 2-3x por semana
INSTAGRAM HANDLE: @studioformaesaude_bh
SEGUIDORES: 500-2k
GOOGLE MEU NEGÓCIO: Tenho mas está incompleto
SITE: Não tenho
ANÚNCIOS PAGOS: Já investi mas parei — não vi resultado
WHATSAPP BUSINESS: Tenho WA Business básico
TEMPO RESPOSTA LEADS: 1 a 3h
PROCESSO DE VENDAS: Tenho alguns pontos mas não é padronizado
FAZ FOLLOW-UP: Às vezes, quando lembro
CAPTURA CONTATOS: Não — só falo com quem me chama
POR QUE PERDE VENDAS: A pessoa pede orçamento, eu mando o preço no WhatsApp, ela some. Acho que não consigo mostrar o valor antes de falar o preço. Fico sem argumento quando dizem que é caro.
PITCH VS CONCORRENTES: Respondo que meu atendimento é mais personalizado e que tenho formação especializada, mas não tenho muito argumento estruturado.
DIFERENCIAIS: Especialização em nicho específico, Atendimento exclusivo / personalizado, Tempo de mercado / reputação
POSICIONAMENTO DE PREÇO: Tenho preço médio do mercado
USA PROVA SOCIAL: Tenho alguns mas não divulgo direito
RECORRÊNCIA DE CLIENTES: A maioria vira recorrente
ESTRATÉGIA PÓS-VENDA: WhatsApp eventual, Redes sociais
INDICAÇÕES: Às vezes, por conta própria
CAPACIDADE DE ATENDIMENTO: Tenho margem de até 30% a mais
O QUE CONSOME TEMPO: Redes sociais e marketing, Atendimento e suporte pós-venda, Administração / financeiro / burocracia
SISTEMAS USADOS: WhatsApp como CRM informal, Planilha Excel / Google Sheets
TEMPO ESTAGNADO: Estagnado há 6 a 12 meses
PROBLEMA ÚNICO A RESOLVER: Quero ter um fluxo constante de clientes novos sem depender só de indicação. Preciso aparecer para quem está buscando Pilates em BH agora.
EXPERIÊNCIA COM AGÊNCIA: Não, nunca

CONTEXTO ADICIONAL DO EMPRESÁRIO:
Tenho CREF, sou formada em Educação Física pela UFMG e fiz especializações em Pilates Clínico e Fisioterapia do Trabalho. Meu studio tem 2 aparelhos Reformer, Cadillac e acessórios de solo. Atendo no contra-turno de executivas (manhã cedo e fim do dia). Já tive até 22 alunas no pico mas hoje estou com 14. Perdi 4 alunas nos últimos 3 meses por mudança ou questão financeira e não consigo repor. Meu maior medo é não ter previsibilidade — alguns meses ganho R$12k, outros R$7k sem entender o que mudou.`,
}

// ─── 3. Helpers ───────────────────────────────────────────────────────────────

const MODELO_AGENTES      = "gemini-2.0-flash-lite"
const MODELO_SINTETIZADOR = "gemini-2.5-pro"

function limparJson(texto: string): string {
  return texto
    .replace(/^```json\s*/im, "")
    .replace(/^```\s*/im, "")
    .replace(/\s*```\s*$/im, "")
    .trim()
}

async function chamarAgente<T>(
  systemPrompt: string,
  userMessage: string,
  modelName: string,
  temperature: number,
  maxOutputTokens: number
): Promise<T | null> {
  const genAI = new GoogleGenerativeAI(GOOGLE_KEY)
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
    console.warn(`  ⚠ ${modelName} falhou na 1ª tentativa, tentando novamente...`)
    try { return await tentar() } catch (e2) {
      console.error(`  ✗ ${modelName} falhou na 2ª tentativa:`, e2)
      return null
    }
  }
}

function formatarDados(): string {
  return `DADOS DO NEGÓCIO:
Nome do negócio: ${NEGOCIO.nome}
Responsável: ${NEGOCIO.responsavel}
Cidade/Bairro: ${NEGOCIO.cidade}
Segmento: ${NEGOCIO.segmento}
Faturamento estimado: ${NEGOCIO.faturamento}
Objetivos: ${NEGOCIO.objetivos.join(", ")}
Canais ativos: ${NEGOCIO.canais.join(", ")}
Descrição dos clientes: ${NEGOCIO.clientes}
Contexto adicional: ${NEGOCIO.contexto}
`
}

// ─── 4. Main ──────────────────────────────────────────────────────────────────

async function main() {
  console.log("\n╔══════════════════════════════════════════════╗")
  console.log("║   CINEZE — Teste de Diagnóstico Completo     ║")
  console.log("╚══════════════════════════════════════════════╝\n")

  // Clientes Supabase
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  const admin    = createClient(SUPABASE_URL, SUPABASE_SVC_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  // ── Login
  console.log("→ Fazendo login como teste@teste.com...")
  const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
    email: "teste@teste.com",
    password: "teste123",
  })
  if (loginError || !loginData.user) {
    console.error("✗ Falha no login:", loginError?.message)
    process.exit(1)
  }
  const userId = loginData.user.id
  console.log(`✓ Login OK — user_id: ${userId}`)

  // ── Garantir plano ativo
  console.log("→ Ativando plano no perfil...")
  const { error: profileError } = await admin
    .from("profiles")
    .update({ plano_ativo: true, onboarding_completo: false })
    .eq("id", userId)
  if (profileError) {
    console.error("✗ Erro ao atualizar perfil:", profileError.message)
    process.exit(1)
  }
  console.log("✓ Perfil atualizado")

  // ── Criar registro de diagnóstico
  console.log("→ Criando registro de diagnóstico...")
  const { data: diagRow, error: insertError } = await admin
    .from("diagnosticos")
    .insert({ user_id: userId, status: "processando" })
    .select("id")
    .single()
  if (insertError || !diagRow) {
    console.error("✗ Erro ao criar diagnóstico:", insertError?.message)
    process.exit(1)
  }
  const diagnosticoId = diagRow.id
  console.log(`✓ Diagnóstico criado — id: ${diagnosticoId}`)

  const dadosFormatados = formatarDados()

  // ── Rodar 5 agentes em paralelo
  console.log("\n→ Rodando 5 agentes especialistas em paralelo...")
  const t0 = Date.now()
  const [agente1, agente2, agente3, agente4, agente5] = await Promise.all([
    chamarAgente(PROMPT_AGENTE_1, dadosFormatados, MODELO_AGENTES, 0.2, 2048).then(r => { console.log("  ✓ Agente 1 (Negócio)");       return r }),
    chamarAgente(PROMPT_AGENTE_2, dadosFormatados, MODELO_AGENTES, 0.2, 2048).then(r => { console.log("  ✓ Agente 2 (Presença Digital)"); return r }),
    chamarAgente(PROMPT_AGENTE_3, dadosFormatados, MODELO_AGENTES, 0.2, 2048).then(r => { console.log("  ✓ Agente 3 (Captação)");       return r }),
    chamarAgente(PROMPT_AGENTE_4, dadosFormatados, MODELO_AGENTES, 0.2, 2048).then(r => { console.log("  ✓ Agente 4 (Posicionamento)");  return r }),
    chamarAgente(PROMPT_AGENTE_5, dadosFormatados, MODELO_AGENTES, 0.2, 2048).then(r => { console.log("  ✓ Agente 5 (Retenção)");        return r }),
  ])
  console.log(`  ⏱ Agentes concluídos em ${((Date.now() - t0) / 1000).toFixed(1)}s`)

  // ── Sintetizador
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

  console.log("\n→ Rodando Sintetizador (Gemini 2.5 Pro)...")
  const t1 = Date.now()
  const resultado = await chamarAgente<any>(
    PROMPT_SINTETIZADOR,
    msgSintetizador,
    MODELO_SINTETIZADOR,
    0.3,
    8192
  )
  console.log(`  ⏱ Sintetizador concluído em ${((Date.now() - t1) / 1000).toFixed(1)}s`)

  if (!resultado) {
    await admin.from("diagnosticos").update({ status: "erro" }).eq("id", diagnosticoId)
    console.error("✗ Sintetizador falhou. Diagnóstico marcado como erro.")
    process.exit(1)
  }

  // ── Salvar no banco
  console.log("\n→ Salvando diagnóstico completo no Supabase...")
  const j = (v: any) => v
  const { error: updateError } = await admin
    .from("diagnosticos")
    .update({
      status:             "concluido",
      score_geral:        resultado.score_geral,
      nivel:              resultado.nivel,
      resumo_executivo:   resultado.resumo_executivo,
      score_visibilidade: resultado.pilares?.visibilidade?.score ?? 0,
      score_captacao:     resultado.pilares?.captacao?.score ?? 0,
      score_conversao:    resultado.pilares?.conversao?.score ?? 0,
      score_posicionamento: resultado.pilares?.posicionamento?.score ?? 0,
      score_comunicacao:  resultado.comunicacao?.score ?? 0,
      raio_x:             j(resultado.pilares),
      maturidade:         j(resultado.maturidade_canais),
      analise_mercado:    j(resultado.analise_mercado),
      sobre_empresa:      j(resultado.sobre_empresa),
      comunicacao:        j(resultado.comunicacao),
      objetivos_smart:    j(resultado.objetivos_smart),
      plano_acao:         j(resultado.plano_acao),
      metricas:           j(resultado.metricas),
      concluido_at:       new Date().toISOString(),
    })
    .eq("id", diagnosticoId)

  if (updateError) {
    console.error("✗ Erro ao salvar:", updateError.message)
    await admin.from("diagnosticos").update({ status: "erro" }).eq("id", diagnosticoId)
    process.exit(1)
  }

  // ── Atualizar perfil com dados do negócio
  await admin.from("profiles").update({
    nome_negocio:       NEGOCIO.nome,
    cidade_bairro:      NEGOCIO.cidade,
    segmento:           NEGOCIO.segmento,
    faturamento_faixa:  NEGOCIO.faturamento,
    onboarding_completo: true,
  }).eq("id", userId)

  // ── Salvar resultado em arquivo
  const output = {
    metadata: {
      negocio:        NEGOCIO.nome,
      cidade:         NEGOCIO.cidade,
      usuario:        "teste@teste.com",
      diagnostico_id: diagnosticoId,
      gerado_em:      new Date().toISOString(),
    },
    agentes: { agente1, agente2, agente3, agente4, agente5 },
    resultado,
  }
  const outputPath = join(process.cwd(), "scripts", "resultado-teste.json")
  writeFileSync(outputPath, JSON.stringify(output, null, 2), "utf-8")

  // ── Resumo no console
  console.log("\n╔══════════════════════════════════════════════╗")
  console.log("║              ✓ TESTE CONCLUÍDO               ║")
  console.log("╚══════════════════════════════════════════════╝")
  console.log(`\nNegócio:    ${NEGOCIO.nome}`)
  console.log(`Score Geral: ${resultado.score_geral}/10`)
  console.log(`Nível:       ${resultado.nivel}`)
  console.log(`\nResumo Executivo:\n${resultado.resumo_executivo}`)
  console.log(`\nProblema Raiz: ${resultado.problema_raiz}`)
  console.log(`\nPilares:`)
  console.log(`  Visibilidade:    ${resultado.pilares?.visibilidade?.score}/10`)
  console.log(`  Captação:        ${resultado.pilares?.captacao?.score}/10`)
  console.log(`  Conversão:       ${resultado.pilares?.conversao?.score}/10`)
  console.log(`  Posicionamento:  ${resultado.pilares?.posicionamento?.score}/10`)
  console.log(`\nPlano de Ação (${resultado.plano_acao?.length ?? 0} ações):`)
  resultado.plano_acao?.forEach((a: any) => {
    console.log(`  [${a.prioridade}] Sem. ${a.semana} — ${a.titulo}`)
  })
  console.log(`\nObjetivos SMART: ${resultado.objetivos_smart?.length ?? 0} gerados`)
  console.log(`\n📄 Resultado completo salvo em: scripts/resultado-teste.json`)
  console.log(`🔗 Acesse o dashboard logado como teste@teste.com para ver o diagnóstico.\n`)
}

main().catch(err => {
  console.error("\n✗ Erro inesperado:", err)
  process.exit(1)
})
