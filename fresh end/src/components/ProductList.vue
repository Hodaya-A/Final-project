import { useProductStore } from '@/stores/products'
import { onMounted } from 'vue'

const productStore = useProductStore()

onMounted(() => {
  productStore.fetchProducts()
})
