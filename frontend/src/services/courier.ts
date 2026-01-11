import axios from 'axios'

export async function getAvailableDeliveries() {
  try {
    console.log('🔗 Calling: GET /api/orders/available-deliveries/list')
    const response = await axios.get('http://localhost:3000/api/orders/available-deliveries/list')
    console.log('✅ Response:', response.data)
    return response.data
  } catch (error) {
    console.error('❌ Error fetching available deliveries:', error)
    throw error
  }
}

export async function acceptDelivery(orderId: string, courierId: string) {
  try {
    const response = await axios.post(
      `http://localhost:3000/api/orders/accept-delivery/${orderId}`,
      {
        courierId,
      },
    )
    return response.data
  } catch (error) {
    console.error('Error accepting delivery:', error)
    throw error
  }
}

export async function getMyDeliveries(courierId: string) {
  try {
    const response = await axios.get(`http://localhost:3000/api/orders/my-deliveries/${courierId}`)
    return response.data
  } catch (error) {
    console.error('Error fetching my deliveries:', error)
    throw error
  }
}
