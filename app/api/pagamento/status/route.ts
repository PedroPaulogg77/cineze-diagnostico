import { NextRequest, NextResponse } from "next/server"
import { createAdminSupabaseClient } from "@/lib/supabase-server"

export async function GET(request: NextRequest) {
  const orderNsu = request.nextUrl.searchParams.get("order_nsu")

  if (!orderNsu) {
    return NextResponse.json({ error: "order_nsu obrigatório" }, { status: 400 })
  }

  const supabase = createAdminSupabaseClient()

  const { data: pedido, error } = await supabase
    .from("pedidos")
    .select("status, email")
    .eq("order_nsu", orderNsu)
    .single()

  if (error || !pedido) {
    return NextResponse.json({ pago: false, email: null })
  }

  return NextResponse.json({
    pago: pedido.status === "pago",
    email: pedido.status === "pago" ? pedido.email : null,
  })
}
