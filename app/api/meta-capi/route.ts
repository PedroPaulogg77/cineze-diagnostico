import { NextRequest, NextResponse } from "next/server";

export async function OPTIONS() {
  const headers = new Headers();
  headers.set("Access-Control-Allow-Origin", "*");
  headers.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization");

  return new NextResponse(null, { status: 200, headers });
}

export async function POST(request: NextRequest) {
  // Configurar CORS no POST também
  const headers = new Headers();
  headers.set("Access-Control-Allow-Origin", "*");
  headers.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization");

  try {
    const body = await request.json();
    const { event_name, event_id, source_url } = body;

    const PIXEL_ID = process.env.META_PIXEL_ID;
    const ACCESS_TOKEN = process.env.META_ACCESS_TOKEN;

    if (!PIXEL_ID || !ACCESS_TOKEN) {
      console.warn("[CAPI] Variáveis de ambiente ausentes.");
      return NextResponse.json({ error: "Missing config" }, { status: 500, headers });
    }

    const clientIp = request.headers.get("x-forwarded-for")?.split(",")[0] || "127.0.0.1";
    const clientUa = request.headers.get("user-agent") || "";

    const payload = {
      data: [
        {
          event_name: event_name || "PageView",
          event_time: Math.floor(Date.now() / 1000),
          action_source: "website",
          event_source_url: source_url || request.headers.get("referer") || "https://cineze.com.br",
          event_id: event_id, // Usado para deduplicação com o Browser
          user_data: {
            client_ip_address: clientIp,
            client_user_agent: clientUa,
          },
        },
      ],
    };

    const res = await fetch(`https://graph.facebook.com/v19.0/${PIXEL_ID}/events?access_token=${ACCESS_TOKEN}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await res.json();
    console.log(`[CAPI] Evento ${event_name} enviado. Deduplicação ID: ${event_id}`, data);

    return NextResponse.json({ success: true, event_id }, { status: 200, headers });
  } catch (error) {
    console.error("[CAPI] Erro ao processar webhook Meta CAPI:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500, headers });
  }
}
