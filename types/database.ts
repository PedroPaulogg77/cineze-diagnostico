// Tipos que espelham o schema do Supabase
// Compatível com @supabase/supabase-js v2

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          nome_responsavel: string
          nome_negocio: string
          cidade_bairro: string | null
          segmento: string | null
          faturamento_faixa: string | null
          pagamento_id: string | null
          plano_ativo: boolean
          onboarding_completo: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          nome_responsavel: string
          nome_negocio?: string
          cidade_bairro?: string | null
          segmento?: string | null
          faturamento_faixa?: string | null
          pagamento_id?: string | null
          plano_ativo?: boolean
          onboarding_completo?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          nome_responsavel?: string
          nome_negocio?: string
          cidade_bairro?: string | null
          segmento?: string | null
          faturamento_faixa?: string | null
          pagamento_id?: string | null
          plano_ativo?: boolean
          onboarding_completo?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      pedidos: {
        Row: {
          id: string
          order_nsu: string
          email: string
          status: string
          transaction_nsu: string | null
          created_at: string
        }
        Insert: {
          id?: string
          order_nsu: string
          email: string
          status?: string
          transaction_nsu?: string | null
          created_at?: string
        }
        Update: {
          status?: string
          transaction_nsu?: string | null
        }
        Relationships: []
      }
      onboarding_respostas: {
        Row: {
          id: string
          user_id: string
          objetivos: string[]
          descricao_clientes: string | null
          canais_ativos: string[]
          contexto_extra: string | null
          completed: boolean
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          objetivos?: string[]
          descricao_clientes?: string | null
          canais_ativos?: string[]
          contexto_extra?: string | null
          completed?: boolean
          created_at?: string
        }
        Update: {
          objetivos?: string[]
          descricao_clientes?: string | null
          canais_ativos?: string[]
          contexto_extra?: string | null
          completed?: boolean
        }
        Relationships: []
      }
      diagnosticos: {
        Row: {
          id: string
          user_id: string
          status: string
          score_geral: number | null
          nivel: string | null
          score_visibilidade: number | null
          score_captacao: number | null
          score_conversao: number | null
          score_posicionamento: number | null
          score_comunicacao: number | null
          raio_x: Json
          maturidade: Json
          analise_mercado: Json
          sobre_empresa: Json
          comunicacao: Json
          objetivos_smart: Json
          plano_acao: Json
          metricas: Json
          resumo_executivo: string | null
          created_at: string
          concluido_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          status?: string
          score_geral?: number | null
          nivel?: string | null
          score_visibilidade?: number | null
          score_captacao?: number | null
          score_conversao?: number | null
          score_posicionamento?: number | null
          score_comunicacao?: number | null
          raio_x?: Json
          maturidade?: Json
          analise_mercado?: Json
          sobre_empresa?: Json
          comunicacao?: Json
          objetivos_smart?: Json
          plano_acao?: Json
          metricas?: Json
          resumo_executivo?: string | null
          created_at?: string
          concluido_at?: string | null
        }
        Update: {
          status?: string
          score_geral?: number | null
          nivel?: string | null
          score_visibilidade?: number | null
          score_captacao?: number | null
          score_conversao?: number | null
          score_posicionamento?: number | null
          score_comunicacao?: number | null
          raio_x?: Json
          maturidade?: Json
          analise_mercado?: Json
          sobre_empresa?: Json
          comunicacao?: Json
          objetivos_smart?: Json
          plano_acao?: Json
          metricas?: Json
          resumo_executivo?: string | null
          concluido_at?: string | null
        }
        Relationships: []
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}
