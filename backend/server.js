const express = require('express')
const mongoose = require('mongoose')
const cors = require('cors')
require('dotenv').config()

// Express app
const app = express()
app.use(cors())
app.use(express.json())

// חיבור ל-MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('✅ מחובר ל-MongoDB'))
  .catch(err => console.error('❌ שגיאה בחיבור למונגו:', err))

// ראוטים למוצרים
const productRoutes = require('./routes/products')
app.use('/api/products', productRoutes)

// חיבור ל-Firebase Admin
const { auth, db } = require('./config/firebaseAdmin')

/**
 * מחיקת משתמש גם מ-Firestore וגם מ-Authentication
 */
app.delete('/api/users/:uid', async (req, res) => {
  const uid = req.params.uid

  try {
    await db.collection('users').doc(uid).delete()
    await auth.deleteUser(uid)

    res.status(200).send({ success: true, message: 'User deleted' })
  } catch (err) {
    console.error(err)
    res.status(500).send({ success: false, message: 'Error deleting user' })
  }
})

/**
 * עדכון תפקיד משתמש (admin/user)
 */
app.put('/api/users/:uid/role', async (req, res) => {
  const uid = req.params.uid
  const newRole = req.body.role

  if (!['admin', 'user'].includes(newRole)) {
    return res.status(400).send({ success: false, message: 'Invalid role' })
  }

  try {
    await db.collection('users').doc(uid).update({ role: newRole })
    res.status(200).send({ success: true, message: 'Role updated' })
  } catch (err) {
    console.error(err)
    res.status(500).send({ success: false, message: 'Error updating role' })
  }
})

// הפעלת השרת
const PORT = process.env.PORT || 3000
app.listen(PORT, () => {
  console.log(`🚀 שרת פועל על http://localhost:${PORT}`)
})
