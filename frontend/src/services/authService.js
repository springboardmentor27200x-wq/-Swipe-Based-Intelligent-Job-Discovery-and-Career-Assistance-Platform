import { api, tokenStore } from './api'

export const authService = {
  async register(payload) {
    const { data } = await api.post('/auth/register/', payload)
    tokenStore.setTokens(data.data.tokens)
    return data.data.user
  },

  async login(email, password) {
    const { data } = await api.post('/auth/login/', { email, password })
    tokenStore.setTokens(data.data.tokens)
    return data.data.user
  },

  async logout() {
    const refresh = tokenStore.getRefresh()
    try {
      if (refresh) await api.post('/auth/logout/', { refresh })
    } finally {
      tokenStore.clear()
    }
  },

  async fetchMe() {
    const { data } = await api.get('/users/me/')
    return data.data
  },

  async changePassword(payload) {
    const { data } = await api.post('/auth/change-password/', payload)
    return data
  },

  async requestPasswordReset(email) {
    const { data } = await api.post('/auth/password-reset/', { email })
    return data
  },

  async confirmPasswordReset(payload) {
    const { data } = await api.post('/auth/password-reset/confirm/', payload)
    return data
  },

  async verifyEmail(token) {
    const { data } = await api.post('/auth/verify-email/', { token })
    return data
  },

  async resendVerification() {
    const { data } = await api.post('/auth/verify-email/resend/')
    return data
  },

  isAuthenticated() {
    return !!tokenStore.getAccess()
  },
}
