-- =============================================================================
-- Migration: schema completo do cineze-diagnostico
-- Data: 2026-04-27
-- Como executar: Supabase Dashboard → SQL Editor → New query → colar este
--                arquivo inteiro → Run
-- Seguro de re-executar: cada bloco usa IF NOT EXISTS / IF EXISTS /
--                         DO $$ com checagens antes de alterar.
-- Tabelas cobertas: profiles, onboarding_respostas, diagnosticos, pedidos
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =============================================================================
-- TABELA: profiles
-- Criada automaticamente pelo trigger on_auth_user_created quando um usuário
-- se cadastra via Supabase Auth. Cada row tem id = auth.users.id.
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.profiles (
  id                 uuid        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nome_responsavel   text        NOT NULL DEFAULT '',
  nome_negocio       text        NOT NULL DEFAULT '',
  cidade_bairro      text,
  segmento           text,
  faturamento_faixa  text,
  pagamento_id       text,
  plano_ativo        boolean     NOT NULL DEFAULT false,
  onboarding_completo boolean    NOT NULL DEFAULT false,
  created_at         timestamptz NOT NULL DEFAULT now(),
  updated_at         timestamptz NOT NULL DEFAULT now()
);

-- Garantir colunas que podem ter sido adicionadas depois
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS nome_responsavel   text        NOT NULL DEFAULT '';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS nome_negocio       text        NOT NULL DEFAULT '';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS cidade_bairro      text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS segmento           text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS faturamento_faixa  text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS pagamento_id       text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS plano_ativo        boolean     NOT NULL DEFAULT false;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS onboarding_completo boolean    NOT NULL DEFAULT false;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS created_at         timestamptz NOT NULL DEFAULT now();
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS updated_at         timestamptz NOT NULL DEFAULT now();

-- Garantir NOT NULL e defaults nos booleanos (em tabela já existente com NULLs)
DO $$
BEGIN
  UPDATE public.profiles SET plano_ativo = false         WHERE plano_ativo         IS NULL;
  UPDATE public.profiles SET onboarding_completo = false WHERE onboarding_completo IS NULL;

  BEGIN
    ALTER TABLE public.profiles ALTER COLUMN plano_ativo         SET NOT NULL;
  EXCEPTION WHEN others THEN NULL;
  END;

  BEGIN
    ALTER TABLE public.profiles ALTER COLUMN onboarding_completo SET NOT NULL;
  EXCEPTION WHEN others THEN NULL;
  END;

  ALTER TABLE public.profiles ALTER COLUMN plano_ativo         SET DEFAULT false;
  ALTER TABLE public.profiles ALTER COLUMN onboarding_completo SET DEFAULT false;
END $$;

-- Trigger: cria linha em profiles quando um novo usuário é criado no Auth
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, nome_responsavel, nome_negocio)
  VALUES (NEW.id, '', '')
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =============================================================================
-- TABELA: onboarding_respostas
-- Uma linha por usuário (UNIQUE user_id). Contém as respostas do formulário
-- de 10 blocos. O upsert usa onConflict: "user_id".
-- ATENÇÃO: sem esta tabela completa (especialmente UNIQUE em user_id),
--          o submit do onboarding falha e o diagnóstico não é gerado.
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.onboarding_respostas (
  id                 uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id            uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  objetivos          text[]      NOT NULL DEFAULT '{}',
  descricao_clientes text,
  canais_ativos      text[]      NOT NULL DEFAULT '{}',
  contexto_extra     text,
  completed          boolean     NOT NULL DEFAULT false,
  created_at         timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT onboarding_respostas_user_id_key UNIQUE (user_id)
);

-- Garantir colunas em tabela pré-existente
ALTER TABLE public.onboarding_respostas ADD COLUMN IF NOT EXISTS objetivos          text[]      NOT NULL DEFAULT '{}';
ALTER TABLE public.onboarding_respostas ADD COLUMN IF NOT EXISTS descricao_clientes text;
ALTER TABLE public.onboarding_respostas ADD COLUMN IF NOT EXISTS canais_ativos      text[]      NOT NULL DEFAULT '{}';
ALTER TABLE public.onboarding_respostas ADD COLUMN IF NOT EXISTS contexto_extra     text;
ALTER TABLE public.onboarding_respostas ADD COLUMN IF NOT EXISTS completed          boolean     NOT NULL DEFAULT false;
ALTER TABLE public.onboarding_respostas ADD COLUMN IF NOT EXISTS created_at         timestamptz NOT NULL DEFAULT now();

-- Garantir NOT NULL e defaults
DO $$
BEGIN
  UPDATE public.onboarding_respostas SET completed     = false  WHERE completed     IS NULL;
  UPDATE public.onboarding_respostas SET objetivos     = '{}'   WHERE objetivos     IS NULL;
  UPDATE public.onboarding_respostas SET canais_ativos = '{}'   WHERE canais_ativos IS NULL;
  UPDATE public.onboarding_respostas SET created_at    = now()  WHERE created_at    IS NULL;

  BEGIN
    ALTER TABLE public.onboarding_respostas ALTER COLUMN completed     SET NOT NULL;
  EXCEPTION WHEN others THEN NULL;
  END;

  BEGIN
    ALTER TABLE public.onboarding_respostas ALTER COLUMN objetivos     SET NOT NULL;
  EXCEPTION WHEN others THEN NULL;
  END;

  BEGIN
    ALTER TABLE public.onboarding_respostas ALTER COLUMN canais_ativos SET NOT NULL;
  EXCEPTION WHEN others THEN NULL;
  END;

  ALTER TABLE public.onboarding_respostas ALTER COLUMN completed     SET DEFAULT false;
  ALTER TABLE public.onboarding_respostas ALTER COLUMN objetivos     SET DEFAULT '{}';
  ALTER TABLE public.onboarding_respostas ALTER COLUMN canais_ativos SET DEFAULT '{}';
  ALTER TABLE public.onboarding_respostas ALTER COLUMN created_at    SET DEFAULT now();
END $$;

-- Garantir PK em id
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.onboarding_respostas'::regclass
      AND contype = 'p'
  ) THEN
    ALTER TABLE public.onboarding_respostas ADD CONSTRAINT onboarding_respostas_pkey PRIMARY KEY (id);
  END IF;
END $$;

-- Garantir UNIQUE em user_id (crítico para onConflict: "user_id")
DO $$
DECLARE
  dup_count int;
BEGIN
  SELECT count(*) INTO dup_count
  FROM (
    SELECT user_id FROM public.onboarding_respostas
    GROUP BY user_id HAVING count(*) > 1
  ) t;

  IF dup_count > 0 THEN
    RAISE EXCEPTION
      'Existem % user_id(s) duplicados em onboarding_respostas. '
      'Identifique com: SELECT user_id, count(*) FROM onboarding_respostas GROUP BY user_id HAVING count(*) > 1. '
      'Remova as linhas extras (keepe a mais recente: DELETE FROM onboarding_respostas WHERE id NOT IN (SELECT DISTINCT ON (user_id) id FROM onboarding_respostas ORDER BY user_id, created_at DESC)) '
      'e re-execute este script.',
      dup_count;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.onboarding_respostas'::regclass
      AND conname  = 'onboarding_respostas_user_id_key'
  ) THEN
    ALTER TABLE public.onboarding_respostas
      ADD CONSTRAINT onboarding_respostas_user_id_key UNIQUE (user_id);
  END IF;
END $$;

-- Garantir FK para auth.users
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.onboarding_respostas'::regclass
      AND conname  = 'onboarding_respostas_user_id_fkey'
  ) THEN
    ALTER TABLE public.onboarding_respostas
      ADD CONSTRAINT onboarding_respostas_user_id_fkey
      FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
END $$;

-- =============================================================================
-- TABELA: diagnosticos
-- Uma linha por tentativa de geração. status: processando | concluido | erro.
-- A UI filtra por status = 'concluido' e pega o mais recente.
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.diagnosticos (
  id                   uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id              uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status               text        NOT NULL DEFAULT 'processando',
  score_geral          integer,
  nivel                text,
  score_visibilidade   integer,
  score_captacao       integer,
  score_conversao      integer,
  score_posicionamento integer,
  score_comunicacao    integer,
  resumo_executivo     text,
  raio_x               jsonb,
  maturidade           jsonb,
  analise_mercado      jsonb,
  sobre_empresa        jsonb,
  comunicacao          jsonb,
  objetivos_smart      jsonb,
  plano_acao           jsonb,
  metricas             jsonb,
  created_at           timestamptz NOT NULL DEFAULT now(),
  concluido_at         timestamptz
);

-- Garantir colunas em tabela pré-existente
ALTER TABLE public.diagnosticos ADD COLUMN IF NOT EXISTS user_id              uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.diagnosticos ADD COLUMN IF NOT EXISTS status               text        NOT NULL DEFAULT 'processando';
ALTER TABLE public.diagnosticos ADD COLUMN IF NOT EXISTS score_geral          integer;
ALTER TABLE public.diagnosticos ADD COLUMN IF NOT EXISTS nivel                text;
ALTER TABLE public.diagnosticos ADD COLUMN IF NOT EXISTS score_visibilidade   integer;
ALTER TABLE public.diagnosticos ADD COLUMN IF NOT EXISTS score_captacao       integer;
ALTER TABLE public.diagnosticos ADD COLUMN IF NOT EXISTS score_conversao      integer;
ALTER TABLE public.diagnosticos ADD COLUMN IF NOT EXISTS score_posicionamento integer;
ALTER TABLE public.diagnosticos ADD COLUMN IF NOT EXISTS score_comunicacao    integer;
ALTER TABLE public.diagnosticos ADD COLUMN IF NOT EXISTS resumo_executivo     text;
ALTER TABLE public.diagnosticos ADD COLUMN IF NOT EXISTS raio_x               jsonb;
ALTER TABLE public.diagnosticos ADD COLUMN IF NOT EXISTS maturidade           jsonb;
ALTER TABLE public.diagnosticos ADD COLUMN IF NOT EXISTS analise_mercado      jsonb;
ALTER TABLE public.diagnosticos ADD COLUMN IF NOT EXISTS sobre_empresa        jsonb;
ALTER TABLE public.diagnosticos ADD COLUMN IF NOT EXISTS comunicacao          jsonb;
ALTER TABLE public.diagnosticos ADD COLUMN IF NOT EXISTS objetivos_smart      jsonb;
ALTER TABLE public.diagnosticos ADD COLUMN IF NOT EXISTS plano_acao           jsonb;
ALTER TABLE public.diagnosticos ADD COLUMN IF NOT EXISTS metricas             jsonb;
ALTER TABLE public.diagnosticos ADD COLUMN IF NOT EXISTS created_at           timestamptz NOT NULL DEFAULT now();
ALTER TABLE public.diagnosticos ADD COLUMN IF NOT EXISTS concluido_at         timestamptz;

-- Garantir CHECK em status (drop e recria)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.diagnosticos'::regclass
      AND conname  = 'diagnosticos_status_check'
  ) THEN
    ALTER TABLE public.diagnosticos
      ADD CONSTRAINT diagnosticos_status_check
      CHECK (status IN ('processando', 'concluido', 'erro'));
  END IF;
END $$;

-- Índice para a query mais comum: último concluido do usuário
CREATE INDEX IF NOT EXISTS diagnosticos_user_status_idx
  ON public.diagnosticos (user_id, status, created_at DESC);

-- =============================================================================
-- TABELA: pedidos
-- Criada/gerenciada apenas por service_role (webhook InfinitePay + API server).
-- RLS desabilitado intencionalmente — a tabela nunca é lida por sessões
-- autenticadas do app; o webhook usa service_role que bypassa RLS.
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.pedidos (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  order_nsu       text        NOT NULL,
  email           text        NOT NULL,
  status          text        NOT NULL DEFAULT 'pendente',
  transaction_nsu text,
  created_at      timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT pedidos_order_nsu_key UNIQUE (order_nsu)
);

ALTER TABLE public.pedidos ADD COLUMN IF NOT EXISTS order_nsu       text        NOT NULL DEFAULT '';
ALTER TABLE public.pedidos ADD COLUMN IF NOT EXISTS email           text        NOT NULL DEFAULT '';
ALTER TABLE public.pedidos ADD COLUMN IF NOT EXISTS status          text        NOT NULL DEFAULT 'pendente';
ALTER TABLE public.pedidos ADD COLUMN IF NOT EXISTS transaction_nsu text;
ALTER TABLE public.pedidos ADD COLUMN IF NOT EXISTS created_at      timestamptz NOT NULL DEFAULT now();

-- UNIQUE em order_nsu para idempotência do webhook
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.pedidos'::regclass
      AND conname  = 'pedidos_order_nsu_key'
  ) THEN
    ALTER TABLE public.pedidos
      ADD CONSTRAINT pedidos_order_nsu_key UNIQUE (order_nsu);
  END IF;
END $$;

-- Índice para lookup por email (usado no webhook para encontrar o pedido)
CREATE INDEX IF NOT EXISTS pedidos_email_idx ON public.pedidos (email);

COMMENT ON TABLE public.pedidos IS
  'Gerenciada exclusivamente via service_role (webhook InfinitePay + API server). '
  'RLS desabilitado intencionalmente — nunca lida por sessões autenticadas do app.';

-- =============================================================================
-- RLS: profiles, onboarding_respostas, diagnosticos
-- (pedidos fica sem RLS — ver comentário acima)
-- =============================================================================

ALTER TABLE public.profiles              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.onboarding_respostas  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.diagnosticos          ENABLE ROW LEVEL SECURITY;

-- profiles
DROP POLICY IF EXISTS users_own_select ON public.profiles;
CREATE POLICY users_own_select ON public.profiles
  FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS users_own_insert ON public.profiles;
CREATE POLICY users_own_insert ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS users_own_update ON public.profiles;
CREATE POLICY users_own_update ON public.profiles
  FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS users_own_delete ON public.profiles;
CREATE POLICY users_own_delete ON public.profiles
  FOR DELETE USING (auth.uid() = id);

-- onboarding_respostas
DROP POLICY IF EXISTS users_own_select ON public.onboarding_respostas;
CREATE POLICY users_own_select ON public.onboarding_respostas
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS users_own_insert ON public.onboarding_respostas;
CREATE POLICY users_own_insert ON public.onboarding_respostas
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS users_own_update ON public.onboarding_respostas;
CREATE POLICY users_own_update ON public.onboarding_respostas
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS users_own_delete ON public.onboarding_respostas;
CREATE POLICY users_own_delete ON public.onboarding_respostas
  FOR DELETE USING (auth.uid() = user_id);

-- diagnosticos
DROP POLICY IF EXISTS users_own_select ON public.diagnosticos;
CREATE POLICY users_own_select ON public.diagnosticos
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS users_own_insert ON public.diagnosticos;
CREATE POLICY users_own_insert ON public.diagnosticos
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS users_own_update ON public.diagnosticos;
CREATE POLICY users_own_update ON public.diagnosticos
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS users_own_delete ON public.diagnosticos;
CREATE POLICY users_own_delete ON public.diagnosticos
  FOR DELETE USING (auth.uid() = user_id);

-- =============================================================================
-- VERIFICAÇÃO FINAL
-- Os dois SELECTs abaixo confirmam o estado após a migration.
-- Execute um por vez no SQL Editor para ler os resultados.
-- =============================================================================

-- 1. Colunas por tabela
SELECT
  table_name,
  count(*)    AS num_colunas
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name IN ('profiles', 'onboarding_respostas', 'diagnosticos', 'pedidos')
GROUP BY table_name
ORDER BY table_name;

-- 2. Policies ativas
SELECT tablename, policyname, cmd
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, cmd;
