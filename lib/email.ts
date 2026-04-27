import { Resend } from "resend"

const resend = new Resend(process.env.RESEND_API_KEY)

// The domain should ideally be dynamic or environment-based, but hardcoding the standard verified domain if available is common.
// Since we don't know the verified domain, we use a placeholder that the user must replace, or standard `onboarding@resend.dev` for testing.
// However, the user said they configured it. Let's use `suporte@cineze.com.br` or whatever their email is. If it fails, they will see it.
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || "Equipe Cineze <suporte@cineze.com.br>"

export async function enviarEmailBoasVindas(paraEmail: string, senhaAleatoria?: string) {
  if (!process.env.RESEND_API_KEY) {
    console.error("ERRO: RESEND_API_KEY não configurada no ambiente.")
    return { error: "Serviço de email indisponível" }
  }

  const loginUrl = `${process.env.NEXT_PUBLIC_APP_URL || "https://diagnostico.cineze.com.br"}/login`

  const html = `
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Bem-vindo ao Diagnóstico Cineze</title>
    </head>
    <body style="margin: 0; padding: 0; background-color: #030712; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
      <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #030712; padding: 40px 0;">
        <tr>
          <td align="center">
            <table border="0" cellpadding="0" cellspacing="0" width="600" style="background-color: #111827; border-radius: 12px; overflow: hidden; border: 1px solid #1f2937;">
              
              <!-- Header -->
              <tr>
                <td align="center" style="padding: 40px 0; border-bottom: 1px solid #1f2937;">
                  <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: bold; letter-spacing: -0.5px;">
                    CINEZE <span style="color: #06b6d4;">PRO</span>
                  </h1>
                </td>
              </tr>

              <!-- Body -->
              <tr>
                <td style="padding: 40px 30px;">
                  <h2 style="color: #f3f4f6; font-size: 20px; font-weight: 600; margin: 0 0 20px 0;">Seu acesso foi liberado!</h2>
                  
                  <p style="color: #9ca3af; font-size: 16px; line-height: 1.6; margin: 0 0 30px 0;">
                    Olá! Recebemos a confirmação do seu pagamento. Seu Diagnóstico de Negócios exclusivo está pronto para ser acessado.
                  </p>

                  <p style="color: #9ca3af; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                    Você pode acessar o painel a qualquer momento usando seu e-mail de compra na nossa página de login:
                  </p>

                  ${senhaAleatoria ? `
                  <div style="background-color: #0f172a; border: 1px solid #1e293b; border-radius: 8px; padding: 20px; margin-bottom: 30px; text-align: center;">
                    <p style="color: #9ca3af; font-size: 14px; margin: 0 0 10px 0;">Sua senha provisória de acesso é:</p>
                    <p style="color: #06b6d4; font-size: 24px; font-weight: bold; letter-spacing: 2px; margin: 0;">${senhaAleatoria}</p>
                  </div>
                  ` : ''}

                  <!-- CTA Button -->
                  <table border="0" cellpadding="0" cellspacing="0" width="100%">
                    <tr>
                      <td align="center">
                        <a href="${loginUrl}" style="display: inline-block; padding: 16px 32px; background-color: #06b6d4; color: #030712; text-decoration: none; font-weight: bold; font-size: 16px; border-radius: 8px; box-shadow: 0 4px 6px -1px rgba(6, 182, 212, 0.2);">
                          ACESSAR MEU PAINEL
                        </a>
                      </td>
                    </tr>
                  </table>

                  <p style="color: #6b7280; font-size: 14px; line-height: 1.5; margin: 40px 0 0 0; text-align: center;">
                    Caso tenha qualquer dúvida, responda a este e-mail.
                  </p>
                </td>
              </tr>

              <!-- Footer -->
              <tr>
                <td align="center" style="padding: 24px; background-color: #0f172a;">
                  <p style="color: #475569; font-size: 12px; margin: 0;">
                    © ${new Date().getFullYear()} Cineze. Todos os direitos reservados.
                  </p>
                </td>
              </tr>
              
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `

  try {
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: paraEmail,
      subject: "Seu acesso ao Diagnóstico Cineze",
      html: html,
    })

    if (error) {
      console.error("Erro do Resend ao enviar email:", error)
      return { error: error.message }
    }

    return { success: true, data }
  } catch (err: any) {
    console.error("Exceção fatal no Resend:", err)
    return { error: err.message || "Erro desconhecido ao enviar email" }
  }
}

export async function enviarEmailRecuperacaoSenha(paraEmail: string, linkRecuperacao: string) {
  if (!process.env.RESEND_API_KEY) {
    console.error("ERRO: RESEND_API_KEY não configurada no ambiente.")
    return { error: "Serviço de email indisponível" }
  }

  const html = `
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Redefinição de Senha</title>
    </head>
    <body style="margin: 0; padding: 0; background-color: #030712; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
      <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #030712; padding: 40px 0;">
        <tr>
          <td align="center">
            <table border="0" cellpadding="0" cellspacing="0" width="600" style="background-color: #111827; border-radius: 12px; overflow: hidden; border: 1px solid #1f2937;">
              
              <!-- Header -->
              <tr>
                <td align="center" style="padding: 40px 0; border-bottom: 1px solid #1f2937;">
                  <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: bold; letter-spacing: -0.5px;">
                    CINEZE <span style="color: #06b6d4;">PRO</span>
                  </h1>
                </td>
              </tr>

              <!-- Body -->
              <tr>
                <td style="padding: 40px 30px;">
                  <h2 style="color: #f3f4f6; font-size: 20px; font-weight: 600; margin: 0 0 20px 0;">Redefinição de Senha</h2>
                  
                  <p style="color: #9ca3af; font-size: 16px; line-height: 1.6; margin: 0 0 30px 0;">
                    Olá! Recebemos um pedido para redefinir a senha da sua conta no Diagnóstico Cineze.
                  </p>

                  <p style="color: #9ca3af; font-size: 16px; line-height: 1.6; margin: 0 0 40px 0;">
                    Clique no botão abaixo para criar sua nova senha de acesso seguro:
                  </p>

                  <!-- CTA Button -->
                  <table border="0" cellpadding="0" cellspacing="0" width="100%">
                    <tr>
                      <td align="center">
                        <a href="${linkRecuperacao}" style="display: inline-block; padding: 16px 32px; background-color: #06b6d4; color: #030712; text-decoration: none; font-weight: bold; font-size: 16px; border-radius: 8px; box-shadow: 0 4px 6px -1px rgba(6, 182, 212, 0.2);">
                          CRIAR NOVA SENHA
                        </a>
                      </td>
                    </tr>
                  </table>

                  <p style="color: #6b7280; font-size: 14px; line-height: 1.5; margin: 40px 0 0 0; text-align: center;">
                    Se você não solicitou essa redefinição, apenas ignore este e-mail.
                  </p>
                </td>
              </tr>

              <!-- Footer -->
              <tr>
                <td align="center" style="padding: 24px; background-color: #0f172a;">
                  <p style="color: #475569; font-size: 12px; margin: 0;">
                    © ${new Date().getFullYear()} Cineze. Todos os direitos reservados.
                  </p>
                </td>
              </tr>
              
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `

  try {
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: paraEmail,
      subject: "Redefinição de Senha - Diagnóstico Cineze",
      html: html,
    })

    if (error) {
      console.error("Erro do Resend ao enviar email de recuperação:", error)
      return { error: error.message }
    }

    return { success: true, data }
  } catch (err: any) {
    console.error("Exceção fatal no Resend (Recuperação):", err)
    return { error: err.message || "Erro desconhecido ao enviar email" }
  }
}
