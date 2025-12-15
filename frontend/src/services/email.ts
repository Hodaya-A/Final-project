import emailjs from '@emailjs/browser'

/**
 * Send order confirmation email using EmailJS (client-side)
 */
export async function sendOrderConfirmation(
  email: string,
  total: number,
  items: {
    name: string
    quantity: number
    price: number
  }[],
  orderId?: string,
) {
  if (!email) {
    throw new Error('No email provided')
  }

  // EmailJS configuration
  const serviceId = 'service_49p0lal'
  const templateId = 'template_rcano4g'
  const publicKey = 'ZG0JybfpjvHAChnsz'

  // Prepare items list
  const itemList = items.map((it) => `${it.name} (${it.quantity})`).join(', ')

  // Template parameters matching your EmailJS template
  const templateParams = {
    user_email: email,
    title: `הזמנה ${orderId || ''}`,
    order_items: itemList,
    order_total: `₪${total.toFixed(2)}`,
    order_date: new Date().toLocaleString('he-IL'),
  }

  console.log('📧 Sending email via EmailJS (client-side) to:', email)

  const response = await emailjs.send(serviceId, templateId, templateParams, publicKey)

  console.log('✅ Email sent successfully:', response.status, response.text)
  return response
}
