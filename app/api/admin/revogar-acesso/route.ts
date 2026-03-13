import { NextResponse } from "next/server"
import { timingSafeEqual } from "crypto"
import { createAdminSupabaseClient } from "@/lib/supabase-server"

function safeCompare(a: string, b: string): boolean {
  const bufA = Buffer.from(a)
  const bufB = Buffer.from(b)
  if (bufA.length !== bufB.length) return false
  return timingSafeEqual(bufA, bufB)
}

export async function POST(request: Request) {
  // 1. Validar Authorization header
  const authHeader = request.headers.get("Authorization")
  const adminSecret = process.env.ADMIN_SECRET

  if (!adminSecret) {
    return NextResponse.json({ error: "ADMIN_SECRET não configurado" }, { status: 500 })
  }

  if (!authHeader || !safeCompare(authHeader, `Bearer ${adminSecret}`)) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
  }

  // 2. Ler body
  let email: string
  try {
    const body = await request.json()
    email = body.email?.trim()
    if (!email) throw new Error("email ausente")
  } catch {
    return NextResponse.json({ error: "Body inválido — envie { email: string }" }, { status: 400 })
  }

  const supabase = createAdminSupabaseClient()

  // 3. Buscar usuário pelo email
  const { data: listData, error: listError } = await supabase.auth.admin.listUsers()
  if (listError) {
    return NextResponse.json({ error: "Erro ao buscar usuários", detail: listError.message }, { status: 500 })
  }

  const user = listData.users.find((u) => u.email?.toLowerCase() === email.toLowerCase())
  if (!user) {
    return NextResponse.json({ error: `Usuário não encontrado: ${email}` }, { status: 404 })
  }

  // 4. Setar plano_ativo = false
  const { error: profileError } = await supabase
    .from("profiles")
    .update({ plano_ativo: false })
    .eq("id", user.id)

  if (profileError) {
    return NextResponse.json({ error: "Erro ao atualizar perfil", detail: profileError.message }, { status: 500 })
  }

  // 5. Invalidar todas as sessões ativas
  const { error: signOutError } = await supabase.auth.admin.signOut(user.id, "global")
  if (signOutError) {
    // Não bloqueia o retorno — plano já foi revogado
    console.error("Erro ao invalidar sessões:", signOutError.message)
  }

  return NextResponse.json({ success: true, email, userId: user.id })
}
