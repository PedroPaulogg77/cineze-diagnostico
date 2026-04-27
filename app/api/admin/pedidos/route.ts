import { NextRequest, NextResponse } from "next/server"
import { createAdminSupabaseClient } from "@/lib/supabase"

export const dynamic = "force-dynamic"

export async function GET(req: NextRequest) {
  try {
    const supabaseAdmin = createAdminSupabaseClient()

    // Fetch orders that are paid but email is still the placeholder (which means the user closed the page before reclaiming)
    const { data: pedidos, error } = await supabaseAdmin
      .from("pedidos")
      .select("id, created_at, status, email, transaction_nsu, order_nsu")
      .eq("status", "pago")
      .eq("email", "aguardando_checkout@cineze.com.br")
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Admin Fetch Error:", error)
      return NextResponse.json({ error: "Erro ao buscar pedidos" }, { status: 500 })
    }

    // Process payload to add the resgate url
    const processedPedidos = pedidos.map(p => {
      return {
        ...p,
        resgate_url: `${process.env.NEXT_PUBLIC_APP_URL}/acesso?order_nsu=${p.order_nsu}`
      }
    })

    return NextResponse.json({ pedidos: processedPedidos })
  } catch (err) {
    return NextResponse.json({ error: "Erro interno" }, { status: 500 })
  }
}
