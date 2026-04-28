# Migrations

Convenção: `YYYYMMDD_descricao.sql` — ordem lexicográfica = ordem de aplicação.

## Como aplicar

1. Abrir **Supabase Dashboard → SQL Editor → New query**
2. Colar o conteúdo do arquivo de migration
3. Clicar **Run**
4. Verificar o output (cada migration inclui SELECTs de verificação no final)

Os scripts são **idempotentes** — podem ser re-executados sem efeito colateral.

## Histórico

| Arquivo | O que faz |
|---|---|
| `20260427_schema_completo.sql` | Cria/reconcilia as 4 tabelas do projeto (`profiles`, `onboarding_respostas`, `diagnosticos`, `pedidos`), RLS, trigger `on_auth_user_created` e índices |

## Notas

- `pedidos` não tem RLS habilitado — gerenciada exclusivamente via `service_role` no webhook InfinitePay
- O trigger `on_auth_user_created` fica em `auth.users` (schema do Supabase Auth); requer `SECURITY DEFINER` na função
- `pgcrypto` já vem instalado por default no Supabase; a linha `CREATE EXTENSION IF NOT EXISTS` é no-op
