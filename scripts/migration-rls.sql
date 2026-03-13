-- ============================================================================
-- RLS (Row Level Security) — Cineze Diagnóstico
-- Rodar no SQL Editor do Supabase
-- ============================================================================

-- profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users read own profile" ON profiles;
DROP POLICY IF EXISTS "Users update own profile" ON profiles;
CREATE POLICY "Users read own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

-- onboarding_respostas
ALTER TABLE onboarding_respostas ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users read own onboarding" ON onboarding_respostas;
DROP POLICY IF EXISTS "Users insert own onboarding" ON onboarding_respostas;
DROP POLICY IF EXISTS "Users update own onboarding" ON onboarding_respostas;
CREATE POLICY "Users read own onboarding" ON onboarding_respostas FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own onboarding" ON onboarding_respostas FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own onboarding" ON onboarding_respostas FOR UPDATE USING (auth.uid() = user_id);

-- diagnosticos
ALTER TABLE diagnosticos ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users read own diagnosticos" ON diagnosticos;
CREATE POLICY "Users read own diagnosticos" ON diagnosticos FOR SELECT USING (auth.uid() = user_id);

-- pedidos: acesso apenas via service role (webhook)
ALTER TABLE pedidos ENABLE ROW LEVEL SECURITY;
