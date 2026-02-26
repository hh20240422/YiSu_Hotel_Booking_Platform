import { createSlice } from '@reduxjs/toolkit'

const uiSlice = createSlice({
  name: 'ui',
  initialState: {
    toasts: [],
  },
  reducers: {
    addToast(state, action) {
      state.toasts.push({ id: Date.now(), ...action.payload })
    },
    removeToast(state, action) {
      state.toasts = state.toasts.filter(t => t.id !== action.payload)
    },
  },
})

export const { addToast, removeToast } = uiSlice.actions
export default uiSlice.reducer

// Helper to dispatch toast from anywhere
export const toast = {
  success: (msg) => addToast({ msg, type: 'success' }),
  error: (msg) => addToast({ msg, type: 'error' }),
  info: (msg) => addToast({ msg, type: 'info' }),
}
