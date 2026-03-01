-- Persiste as respostas brutas do formulário e o payload pronto para a API
-- Roda no Supabase SQL Editor ou via migration tool

ALTER TABLE public.onboarding_respostas ADD COLUMN IF NOT EXISTS form_data JSONB;
ALTER TABLE public.onboarding_respostas ADD COLUMN IF NOT EXISTS api_payload JSONB;
