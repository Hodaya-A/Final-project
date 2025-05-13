const express = require('express')
const mongoose = require('mongoose')
const cors = require('cors')

const app = express()
app.use(cors())
app.use(express.json())

mongoose.connect('mongodb://localhost:27017/freshend')
  .then(() => console.log('✅ MongoDB connected'))
  .catch(err => console.error('MongoDB error:', err))

// דוגמה לנתיב בדיקה
app.get('/', (req, res) => {
  res.send('Server is running!')
})

app.listen(3000, () => {
  console.log('🚀 Server on http://localhost:3000')
})
