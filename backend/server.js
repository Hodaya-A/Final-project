const express = require('express')
const mongoose = require('mongoose')
const cors = require('cors')
require('dotenv').config()

const app = express()
app.use(cors())
app.use(express.json())

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('✅ מחובר ל-MongoDB'))
  .catch(err => console.error('❌ שגיאה בחיבור למונגו:', err))

const productRoutes = require('./routes/products')
app.use('/api/products', productRoutes)

const PORT = process.env.PORT || 3000
app.listen(PORT, () => {
  console.log(`🚀 שרת פועל על http://localhost:${PORT}`)
})
