const express = require('express')
const mongoose = require('mongoose')
const cors = require('cors')

const app = express()

app.use(cors())
app.use(express.json())

// חיבור ל־MongoDB (מסד מקומי, אפשר לשנות ל-Atlas)

mongoose.connect('mongodb://localhost:27017/freshend')

// API – החזרת כל המוצרים
app.get('/api/products', async (req, res) => {
  const products = await Product.find()
  res.json(products)
})



// בדיקה: דף הבית של השרת
app.get('/', (req, res) => {
  res.send('🚀 Server is running and connected to MongoDB!')
})

// מאזין לפורט 3000
app.listen(3000, () => {
  console.log('🌐 Server listening at http://localhost:3000')
})
