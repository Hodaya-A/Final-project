import emailjs from 'emailjs-com'

const SERVICE_ID = 'service_49p0lal'
const TEMPLATE_ID = 'template_rcano4g'
const USER_ID = 'ZG0JybfpjvHAChnsz' // public key

/**
 * שליחת מייל אישור הזמנה למשתמש
 */
export async function sendOrderConfirmation(
  email: string,
  total: number,
  items: {
    name: string
    quantity: number
    price: number
  }[]
) {
  try {
    const itemList = items
      .map((item) => `${item.name} (${item.quantity})`)
      .join(', ')

    const date = new Date().toLocaleDateString('he-IL')

    const params = {
      user_email: email,
      order_total: total.toFixed(2),
      order_items: itemList,
      order_date: date,
    }

    const result = await emailjs.send(SERVICE_ID, TEMPLATE_ID, params, USER_ID)
    console.log('EmailJS success:', result.text)
  } catch (err) {
    console.error('שגיאה בשליחת המייל:', err)
    throw err // חשוב לזרוק את השגיאה אם רוצים להציג שגיאה למשתמש
  }
}
