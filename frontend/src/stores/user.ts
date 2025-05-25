import { defineStore } from 'pinia'

export interface User {
  uid: string
  email: string | null
  displayName?: string
  role?: string
}

export const useUserStore = defineStore('user', {
  state: () => ({
    currentUser: null as User | null,
  }),

  actions: {
    setUser(user: User) {
      this.currentUser = user
    },

    logout() {
      this.currentUser = null
    },
  },
})
