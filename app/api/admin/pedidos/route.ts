import { NextRequest, NextResponse } from "next/server"
import { createAdminSupabaseClient } from "@/lib/supabase"

export const dynamic = "force-dynamic"

export async function GET(req: NextRequest) {
  try {
    const supabaseAdmin = createAdminSupabaseClient()

    // 1. Buscar todos os pedidos pagos
    const { data: pedidos, error: pedidosErr } = await supabaseAdmin
      .from("pedidos")
      .select("id, created_at, status, email, transaction_nsu, order_nsu")
      .eq("status", "pago")
      .order("created_at", { ascending: false })

    if (pedidosErr) throw pedidosErr

    // 2. Buscar todos os usuários (para pegar last_sign_in_at)
    const { data: { users }, error: usersErr } = await supabaseAdmin.auth.admin.listUsers()
    if (usersErr) throw usersErr

    // 3. Buscar todos os perfis (para pegar atividade recente)
    const { data: profiles, error: profilesErr } = await supabaseAdmin
      .from("profiles")
      .select("id, updated_at")
    
    if (profilesErr) throw profilesErr

    // 4. Cruzar os dados
    const processedPedidos = pedidos.map(p => {
      const isPlaceholder = p.email === "aguardando_checkout@cineze.com.br"
      const user = users.find(u => u.email?.toLowerCase() === p.email.toLowerCase())
      const profile = user ? profiles.find(pr => pr.id === user.id) : null

      return {
        ...p,
        resgate_url: `${process.env.NEXT_PUBLIC_APP_URL}/acesso?order_nsu=${p.order_nsu}`,
        is_placeholder: isPlaceholder,
        ultimo_login: user?.last_sign_in_at || null,
        ultima_atividade: profile?.updated_at || null,
        tem_conta: !!user
      }
    })

    return NextResponse.json({ pedidos: processedPedidos })
  } catch (err: any) {
    console.error("Admin API Error:", err)
    return NextResponse.json({ error: err.message || "Erro interno" }, { status: 500 })
  }
}
