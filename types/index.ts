import type { Database } from "./database"

// ─── Aliases das linhas do banco ─────────────────────────────────────────────

export type Profile = Database["public"]["Tables"]["profiles"]["Row"]
export type ProfileUpdate = Database["public"]["Tables"]["profiles"]["Update"]

export type OnboardingRespostas = Database["public"]["Tables"]["onboarding_respostas"]["Row"]
export type OnboardingRespostasInsert = Database["public"]["Tables"]["onboarding_respostas"]["Insert"]

export type Diagnostico = Database["public"]["Tables"]["diagnosticos"]["Row"]
export type DiagnosticoInsert = Database["public"]["Tables"]["diagnosticos"]["Insert"]
export type DiagnosticoUpdate = Database["public"]["Tables"]["diagnosticos"]["Update"]

// ─── Formulário de Onboarding ─────────────────────────────────────────────────

export interface OnboardingFormData {
  nome_responsavel: string
  nome_negocio: string
  cidade_bairro: string
  segmento: string
  faturamento_faixa: string
  objetivos: string[]
  descricao_clientes: string
  canais_ativos: string[]
  contexto_extra: string
}

// ─── Resultado do Diagnóstico (JSON retornado pelo Gemini) ────────────────────

export type NivelDiagnostico =
  | "Presença Crítica"
  | "Em Construção"
  | "Em Crescimento"
  | "Presença Sólida"
  | "Referência na região"

export interface Pilar {
  score: number
  diagnostico: string
  recomendacoes: string[]
}

export interface Pilares {
  visibilidade: Pilar
  captacao: Pilar
  conversao: Pilar
  posicionamento: Pilar
}

export type StatusCanal = "Inexistente" | "Básico" | "Ativo" | "Avançado"

export interface MaturidadeCanal {
  canal: string
  score: number
  status: StatusCanal
  diagnostico: string
  o_que_falta: string[]
}

export interface AnaliseMercado {
  panorama: string
  desafios: string[]
  investimento_mensal_recomendado: number
  cpm_estimado: number
  cpc_estimado: number
  oportunidade: string
}

export interface CanalIdentificado {
  canal: string
  status: string
  link: string
}

export interface CanalAusente {
  canal: string
  oportunidade: string
}

export interface Persona {
  descricao: string
  tags: string[]
  interesses: string[]
  onde_encontrar: string[]
}

export interface SobreEmpresa {
  canais_identificados: CanalIdentificado[]
  canais_ausentes: CanalAusente[]
  persona: Persona
}

export type NivelProblema = "critico" | "moderado" | "leve"

export interface ProblemaComunicacao {
  nivel: NivelProblema
  problema: string
  solucao: string
}

export interface Comunicacao {
  score: number
  analise_geral: string
  proposta_de_valor: string
  tom_de_voz: string
  cta: string
  problemas: ProblemaComunicacao[]
}

export interface ObjetivoSMART {
  titulo: string
  meta: string
  especifico: string
  mensuravel: string
  atingivel: string
  relevante: string
  temporal: string
}

export type PrioridadeAcao = "Alta" | "Média" | "Baixa"

export interface AcaoPlano {
  numero: number
  titulo: string
  prioridade: PrioridadeAcao
  semana: 1 | 2 | 3 | 4
  meta: string
  por_que_agora: string
  passos: string[]
}

export type FrequenciaMetrica = "diária" | "semanal" | "mensal"

export interface Metrica {
  nome: string
  baseline: string
  meta: string
  como_medir: string
  frequencia: FrequenciaMetrica
}

export interface ResultadoDiagnostico {
  score_geral: number
  nivel: NivelDiagnostico
  resumo_executivo: string
  pilares: Pilares
  maturidade_canais: MaturidadeCanal[]
  analise_mercado: AnaliseMercado
  sobre_empresa: SobreEmpresa
  comunicacao: Comunicacao
  objetivos_smart: ObjetivoSMART[]
  plano_acao: AcaoPlano[]
  metricas: Metrica[]
}

// ─── Pagamento ────────────────────────────────────────────────────────────────

export interface PagamentoWebhookPayload {
  user_id: string
  payment_id: string
  status: "approved" | "pending" | "refused"
  valor: number
}
