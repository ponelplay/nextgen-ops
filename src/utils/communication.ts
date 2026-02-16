export function openWhatsApp(phone: string) {
  const cleaned = phone.replace(/[^0-9+]/g, '')
  window.open(`https://wa.me/${cleaned.replace('+', '')}`, '_blank')
}

export function openTelegram(handle: string) {
  const cleaned = handle.replace('@', '')
  window.open(`https://t.me/${cleaned}`, '_blank')
}

export function openPhone(phone: string) {
  window.open(`tel:${phone}`, '_self')
}

export function openEmail(email: string) {
  window.open(`mailto:${email}`, '_self')
}
