import { NextRequest, NextResponse } from "next/server"
import { createAdminSupabaseClient } from "@/lib/supabase"

// ─── Helpers ──────────────────────────────────────────────────────────────────

function gerarOrderNsu(): string {
  const timestamp = Date.now()
  const random = Math.random().toString(36).substring(2, 6).toUpperCase()
  return `cineze-${timestamp}-${random}`
}

// ─── Route Handler ────────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  // 1. Validar body
  let email: string
  try {
    const body = await request.json()
    email = (body.email ?? "").toLowerCase().trim()
  } catch {
    return NextResponse.json({ error: "Body inválido" }, { status: 400 })
  }

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "Email inválido" }, { status: 400 })
  }

  const handle = process.env.INFINITEPAY_HANDLE
  const appUrl = process.env.NEXT_PUBLIC_APP_URL

  if (!handle || !appUrl) {
    console.error("Variáveis INFINITEPAY_HANDLE ou NEXT_PUBLIC_APP_URL não configuradas")
    return NextResponse.json({ error: "Serviço indisponível" }, { status: 503 })
  }

  // 2. Gerar order_nsu único e salvar no banco
  const orderNsu = gerarOrderNsu()

  const supabase = createAdminSupabaseClient()

  const { error: insertError } = await supabase
    .from("pedidos")
    .insert({ order_nsu: orderNsu, email, status: "pendente" })

  if (insertError) {
    console.error("Erro ao salvar pedido:", insertError)
    return NextResponse.json({ error: "Erro ao registrar pedido" }, { status: 500 })
  }

  // 3. Criar link de checkout na InfinitePay
  //
  //    POST https://api.infinitepay.io/invoices/public/checkout/links
  //
  let checkoutUrl: string

  try {
    const ipResponse = await fetch(
      "https://api.infinitepay.io/invoices/public/checkout/links",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          handle,
          items: [
            {
              quantity: 1,
              price: 6700, // R$67,00 em centavos
              description: "Diagnóstico Cineze IA",
            },
          ],
          order_nsu: orderNsu,
          redirect_url: `${appUrl}/acesso?order_nsu=${orderNsu}`,
          webhook_url: `${appUrl}/api/pagamento/webhook`,
          customer: { email },
        }),
      }
    )

    if (!ipResponse.ok) {
      const errorBody = await ipResponse.text()
      console.error("InfinitePay erro:", ipResponse.status, errorBody)
      return NextResponse.json(
        { error: "Erro ao gerar link de pagamento" },
        { status: 502 }
      )
    }

    const ipData = await ipResponse.json()

    // A InfinitePay pode retornar o link em diferentes campos
    checkoutUrl = ipData.url ?? ipData.link ?? ipData.checkout_url ?? ipData.payment_url

    if (!checkoutUrl) {
      console.error("InfinitePay não retornou URL de checkout:", ipData)
      return NextResponse.json(
        { error: "Link de pagamento não gerado" },
        { status: 502 }
      )
    }
  } catch (err) {
    console.error("Erro na chamada à InfinitePay:", err)
    return NextResponse.json(
      { error: "Erro de comunicação com o gateway de pagamento" },
      { status: 502 }
    )
  }

  // 4. Retornar o link para o frontend redirecionar o usuário
  return NextResponse.json({ checkout_url: checkoutUrl })
}
