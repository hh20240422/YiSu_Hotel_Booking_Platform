import api from './axiosInstance'

/**
 * Hash a password with SHA-256 using the browser's built-in SubtleCrypto API.
 * This prevents the raw password from ever leaving the browser in plaintext.
 *
 * NOTE: This is a defense-in-depth measure, NOT a substitute for HTTPS.
 * In production, always serve over HTTPS (TLS) to encrypt the entire request.
 * Client-side hashing alone cannot prevent replay attacks.
 */
async function hashPassword(password) {
  const encoder = new TextEncoder()
  const data = encoder.encode(password)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
}

export const authApi = {
  login: async (username, password) => {
    const hashedPassword = await hashPassword(password)
    return api.post('/login', { username, password: hashedPassword })
  },

  register: async (username, password, role, name) => {
    const hashedPassword = await hashPassword(password)
    return api.post('/register', { username, password: hashedPassword, role, name })
  },
}
