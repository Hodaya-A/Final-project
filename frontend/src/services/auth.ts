import { createUserWithEmailAndPassword } from 'firebase/auth'
import { auth, db } from '@/services/firebase'
import { doc, setDoc } from 'firebase/firestore'

export async function register(email: string, password: string, name: string) {
  const userCredential = await createUserWithEmailAndPassword(auth, email, password)
  const uid = userCredential.user.uid

  await setDoc(doc(db, 'users', uid), {
    email,
    name,
    role: 'user',  // אם את יוצרת אדמין, אפשר גם 'admin'
    uid
  })
}
