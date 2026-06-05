import { BrevoClient } from '@getbrevo/brevo'
import { statutLabel } from './utils'

// ── Helpers communs ──────────────────────────────────────────────────────────

/** Nettoie un numéro de téléphone en format Brevo (sans espaces ni +) */
function formatPhoneForSms(phone: string): string {
  const cleaned = phone.replace(/[\s\-().+]/g, '')
  // Numéro français 0XXXXXXXXX → 33XXXXXXXXX
  if (cleaned.startsWith('0') && cleaned.length === 10) return `33${cleaned.slice(1)}`
  return cleaned
}

function getClient() {
  const key = process.env.BREVO_API_KEY
  if (!key) return null
  return new BrevoClient({ apiKey: key })
}

const SENDER = {
  name: process.env.BREVO_SENDER_NAME ?? 'TransLog',
  email: process.env.BREVO_SENDER_EMAIL ?? 'noreply@translog.app',
}

async function send(opts: {
  to: { email: string; name?: string }
  subject: string
  htmlContent: string
}) {
  const client = getClient()
  if (!client) return // Brevo non configuré — no-op silencieux
  try {
    await client.transactionalEmails.sendTransacEmail({
      sender: SENDER,
      to: [opts.to],
      subject: opts.subject,
      htmlContent: opts.htmlContent,
    })
  } catch (err) {
    console.error('[Brevo] Send error:', err)
  }
}

function baseHtml(tenantName: string, content: string) {
  return `<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"><style>
  body{font-family:Arial,sans-serif;background:#f0f2f5;margin:0;padding:20px}
  .wrap{max-width:580px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,.08)}
  .header{background:#1e3a5f;padding:24px 28px;color:#fff}
  .header h1{margin:0;font-size:18px;font-weight:bold}
  .header p{margin:4px 0 0;font-size:13px;opacity:.7}
  .body{padding:28px}
  .body p{color:#374151;font-size:14px;line-height:1.6;margin:0 0 12px}
  .ref{background:#f0f4ff;border:1px solid #c7d2fe;border-radius:8px;padding:12px 16px;font-family:monospace;font-size:16px;font-weight:bold;color:#1e3a5f;margin:16px 0}
  .badge{display:inline-block;padding:4px 12px;border-radius:20px;font-size:12px;font-weight:600}
  .cta{display:inline-block;background:#1e3a5f;color:#fff!important;padding:12px 24px;border-radius:8px;text-decoration:none;font-size:14px;font-weight:600;margin:16px 0}
  .footer{padding:16px 28px;border-top:1px solid #f3f4f6;font-size:11px;color:#9ca3af;text-align:center}
</style></head>
<body><div class="wrap">
  <div class="header"><h1>${tenantName}</h1><p>Transport France → Maghreb / Afrique</p></div>
  <div class="body">${content}</div>
  <div class="footer">Cet email a ete envoye automatiquement par TransLog. Ne pas repondre directement.</div>
</div></body></html>`
}

// ── Email 1 : Nouveau dossier ────────────────────────────────────────────────

export async function sendDossierCreated(opts: {
  clientEmail: string
  clientNom: string
  tenantName: string
  reference: string
  typeColisLabel: string
  villeDepart: string
  villeArrivee: string
  paysArrivee: string
  appUrl: string
}) {
  await send({
    to: { email: opts.clientEmail, name: opts.clientNom },
    subject: `Votre colis ${opts.reference} a ete enregistre - ${opts.tenantName}`,
    htmlContent: baseHtml(opts.tenantName, `
      <p>Bonjour <strong>${opts.clientNom}</strong>,</p>
      <p>Votre demande de transport a ete enregistree avec succes.</p>
      <div class="ref">${opts.reference}</div>
      <p><strong>Details de votre envoi :</strong></p>
      <p>
        Type : ${opts.typeColisLabel}<br>
        Depart : ${opts.villeDepart}<br>
        Destination : ${opts.villeArrivee}, ${opts.paysArrivee}
      </p>
      <p>Suivez votre colis en temps reel :</p>
      <a class="cta" href="${opts.appUrl}/client">Suivre mon colis</a>
      <p style="color:#6b7280;font-size:13px">Entrez la reference <strong>${opts.reference}</strong> sur la page de suivi.</p>
    `),
  })
}

// ── Email 2 : Statut mis à jour ──────────────────────────────────────────────

const STATUT_COLORS: Record<string, string> = {
  recu: '#e5e7eb', confirme: '#dbeafe', en_transit: '#fef3c7',
  arrive: '#f3e8ff', livre: '#dcfce7', annule: '#fee2e2',
}
const STATUT_TEXT: Record<string, string> = {
  recu: '#374151', confirme: '#1d4ed8', en_transit: '#b45309',
  arrive: '#6d28d9', livre: '#15803d', annule: '#b91c1c',
}
const STATUT_MSGS: Record<string, string> = {
  confirme:   'Votre envoi a ete confirme et sera pris en charge prochainement.',
  en_transit: 'Votre colis est en route ! Il est actuellement en transit.',
  arrive:     'Votre colis est arrive a destination. La livraison finale sera effectuee prochainement.',
  livre:      'Votre colis a ete livre avec succes. Merci de votre confiance !',
  annule:     'Votre dossier a ete annule. Pour toute question, contactez-nous.',
}

export async function sendStatutUpdated(opts: {
  clientEmail: string
  clientNom: string
  tenantName: string
  reference: string
  newStatut: string
  appUrl: string
}) {
  const label = statutLabel(opts.newStatut)
  const bgColor = STATUT_COLORS[opts.newStatut] ?? '#e5e7eb'
  const textColor = STATUT_TEXT[opts.newStatut] ?? '#374151'
  const msg = STATUT_MSGS[opts.newStatut] ?? 'Statut mis a jour.'

  await send({
    to: { email: opts.clientEmail, name: opts.clientNom },
    subject: `Colis ${opts.reference} - Statut : ${label}`,
    htmlContent: baseHtml(opts.tenantName, `
      <p>Bonjour <strong>${opts.clientNom}</strong>,</p>
      <p>Le statut de votre colis a ete mis a jour.</p>
      <div class="ref">${opts.reference}</div>
      <p>Nouveau statut :</p>
      <span class="badge" style="background:${bgColor};color:${textColor}">${label}</span>
      <p style="margin-top:16px">${msg}</p>
      <a class="cta" href="${opts.appUrl}/client">Voir le suivi</a>
    `),
  })
}

// ── Email 3 : Bienvenue transporteur ─────────────────────────────────────────

export async function sendWelcomeTransporteur(opts: {
  adminEmail: string
  adminNom: string
  tenantName: string
  plan: string
  appUrl: string
}) {
  await send({
    to: { email: opts.adminEmail, name: opts.adminNom || opts.tenantName },
    subject: `Bienvenue sur TransLog - ${opts.tenantName} est pret !`,
    htmlContent: baseHtml('TransLog V2', `
      <p>Bonjour,</p>
      <p>Votre espace <strong>${opts.tenantName}</strong> est maintenant cree !</p>
      <p>Vous beneficiez de <strong>14 jours d'essai gratuit</strong> sur le plan <strong>${opts.plan.toUpperCase()}</strong>.</p>
      <p><strong>Prochaines etapes :</strong></p>
      <p>
        1. Configurez votre grille tarifaire<br>
        2. Creez votre premier dossier client<br>
        3. Partagez le lien de suivi a vos clients
      </p>
      <a class="cta" href="${opts.appUrl}/dashboard">Acceder a mon espace</a>
      <p style="color:#6b7280;font-size:13px">
        Des questions ?
        <a href="mailto:support@cybermons.fr" style="color:#1e3a5f">support@cybermons.fr</a>
      </p>
    `),
  })
}

// ── SMS transactionnels ───────────────────────────────────────────────────────

async function sendSms(phone: string, content: string) {
  const client = getClient()
  if (!client) return
  const sender = process.env.BREVO_SMS_SENDER ?? 'TransLog'
  try {
    await client.transactionalSms.sendAsyncTransactionalSms({
      recipient: formatPhoneForSms(phone),
      sender,
      content,
      type: 'transactional',
    })
  } catch (err) {
    console.error('[Brevo SMS]', err)
  }
}

export async function sendSmsNouveauDossier(opts: {
  clientPhone: string
  clientNom: string
  reference: string
  villeArrivee: string
  paysArrivee: string
  appUrl: string
}) {
  await sendSms(
    opts.clientPhone,
    `Bonjour ${opts.clientNom}, votre colis ${opts.reference} vers ${opts.villeArrivee} (${opts.paysArrivee}) a ete enregistre. Suivi : ${opts.appUrl}/client`
  )
}

export async function sendSmsStatutUpdated(opts: {
  clientPhone: string
  clientNom: string
  reference: string
  newStatut: string
}) {
  const msgs: Record<string, string> = {
    confirme:   'confirme et pris en charge',
    en_transit: 'en transit',
    arrive:     'arrive a destination',
    livre:      'livre ! Merci de votre confiance',
    annule:     'annule',
  }
  const msg = msgs[opts.newStatut]
  if (!msg) return
  await sendSms(
    opts.clientPhone,
    `Bonjour ${opts.clientNom}, votre colis ${opts.reference} est ${msg}.`
  )
}
