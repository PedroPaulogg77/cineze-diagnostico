import { z } from "zod"

export const onboardingFormSchema = z.object({
  nome_responsavel: z.string().min(1).max(200),
  nome_negocio: z.string().min(1).max(200),
  cidade_bairro: z.string().min(1).max(200),
  segmento: z.string().min(1).max(300),
  faturamento_faixa: z.string().min(1).max(100),
  objetivos: z.array(z.string().max(300)).max(10),
  descricao_clientes: z.string().min(1).max(1000),
  canais_ativos: z.array(z.string().max(200)).max(30),
  contexto_extra: z.string().max(5000),
})

export type ValidatedOnboardingData = z.infer<typeof onboardingFormSchema>
