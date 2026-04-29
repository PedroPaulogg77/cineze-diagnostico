"use client"

const WA_NUMBER = "5531995147425"

interface WhatsAppCTAProps {
  headline?: string
  body?: string
  buttonLabel?: string
  waMessage?: string
}

export function WhatsAppCTA({
  headline = "Precisa de ajuda para colocar isso em prática?",
  body = "A Cineze pode criar uma estratégia personalizada para resolver exatamente esses pontos.",
  buttonLabel = "Falar com a Cineze",
  waMessage = "Olá! Acabei de ver meu diagnóstico e gostaria de entender como a Cineze pode me ajudar.",
}: WhatsAppCTAProps) {
  const href = `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(waMessage)}`

  return (
    <div
      style={{
        marginTop: 8,
        padding: "18px 22px",
        background: "rgba(37,211,102,0.04)",
        border: "1px solid rgba(37,211,102,0.18)",
        borderRadius: 14,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 20,
        flexWrap: "wrap",
      }}
    >
      <div style={{ flex: 1, minWidth: 200 }}>
        <p style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)", marginBottom: 3 }}>
          {headline}
        </p>
        <p style={{ fontSize: 12, color: "var(--text-secondary)", lineHeight: 1.55, margin: 0 }}>
          {body}
        </p>
      </div>

      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="wa-cta-btn"
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 8,
          padding: "9px 18px",
          background: "#25D366",
          color: "#fff",
          fontSize: 13,
          fontWeight: 600,
          borderRadius: 10,
          textDecoration: "none",
          whiteSpace: "nowrap",
          flexShrink: 0,
          boxShadow: "0 2px 8px rgba(37,211,102,0.22)",
          transition: "opacity .15s ease, transform .15s ease",
        }}
        onMouseEnter={e => {
          const el = e.currentTarget as HTMLElement
          el.style.opacity = "0.88"
          el.style.transform = "translateY(-1px)"
        }}
        onMouseLeave={e => {
          const el = e.currentTarget as HTMLElement
          el.style.opacity = "1"
          el.style.transform = "translateY(0)"
        }}
      >
        <svg width="16" height="16" viewBox="0 0 32 32" fill="none" aria-hidden="true">
          <path
            d="M16 3C8.83 3 3 8.83 3 16c0 2.38.65 4.6 1.79 6.5L3 29l6.76-1.77A13 13 0 0 0 16 29c7.17 0 13-5.83 13-13S23.17 3 16 3Z"
            fill="white"
          />
          <path
            d="M12.7 10.7c.2-.4.8-1.5 1-1.63.2-.16.4-.16.54-.1l1.06.49c.14.07.27.2.13.47l-.6 1.13c-.07.13 0 .27.13.4.67.8 1.47 1.4 2.34 1.73.13.07.27 0 .33-.13l.53-.93c.1-.2.27-.27.47-.2l1.07.4c.2.07.27.27.2.47-.2.66-.8 1.46-1.46 1.6-1.2.27-2.67-.27-4-1.2-.87-.6-1.54-1.4-1.74-2.5Z"
            fill="#25D366"
          />
        </svg>
        {buttonLabel}
      </a>
    </div>
  )
}
