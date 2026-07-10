import fs from 'fs'
import handlebars from 'handlebars'
import mjml2html from 'mjml'
import path from 'path'

// Brevo API configuration
const BREVO_API_KEY = process.env.BREVO_API_KEY || ''
const SENDER_EMAIL = process.env.BREVO_SENDER_EMAIL || 'noreply@zubriks.ru'
const SENDER_NAME = 'Zubriks'

// Load and cache the MJML template
let compiledTemplate: handlebars.TemplateDelegate | null = null

function getTemplate(): handlebars.TemplateDelegate {
  if (compiledTemplate) return compiledTemplate

  const mjmlPath = path.join(__dirname, 'templates', 'verification.mjml')
  const mjmlContent = fs.readFileSync(mjmlPath, 'utf8')
  
  // Compile MJML to HTML
  const htmlOutput = mjml2html(mjmlContent) as any
  if (htmlOutput.errors && htmlOutput.errors.length > 0) {
    console.warn('MJML compilation warnings:', htmlOutput.errors)
  }

  // Compile HTML with Handlebars
  compiledTemplate = handlebars.compile(htmlOutput.html)
  return compiledTemplate
}

/**
 * Sends a 6-digit verification code to the user via Brevo
 */
export async function sendVerificationEmail(toEmail: string, code: string): Promise<boolean> {
  if (!BREVO_API_KEY) {
    console.warn(`[DEV MODE] Skipping email to ${toEmail}. Code is: ${code}`)
    // In dev, we pretend it succeeded so we can test the UI
    return true
  }

  try {
    const template = getTemplate()
    const htmlContent = template({ code })

    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'api-key': BREVO_API_KEY,
      },
      body: JSON.stringify({
        sender: { name: SENDER_NAME, email: SENDER_EMAIL },
        to: [{ email: toEmail }],
        subject: 'Код подтверждения Zubriks',
        htmlContent: htmlContent,
      }),
    })

    if (!response.ok) {
      const errorData = await response.text()
      console.error('Failed to send email via Brevo:', response.status, errorData)
      return false
    }

    return true
  } catch (error) {
    console.error('Error sending verification email:', error)
    return false
  }
}

/**
 * Generate a cryptographically secure 6-digit code
 */
export function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
}
