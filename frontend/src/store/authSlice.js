import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { authApi } from '../api/auth'

// Load persisted user from localStorage on app start
const savedUser = (() => {
  try { return JSON.parse(localStorage.getItem('hotel_user')) } catch { return null }
})()

// Async thunk: login
export const loginThunk = createAsyncThunk(
  'auth/login',
  async ({ username, password }, { rejectWithValue }) => {
    try {
      const data = await authApi.login(username, password)
      localStorage.setItem('hotel_token', data.token)
      localStorage.setItem('hotel_user', JSON.stringify(data.user))
      return data.user
    } catch (err) {
      return rejectWithValue(err.message)
    }
  }
)

// Async thunk: register
export const registerThunk = createAsyncThunk(
  'auth/register',
  async ({ username, password, role, name }, { rejectWithValue }) => {
    try {
      await authApi.register(username, password, role, name)
    } catch (err) {
      return rejectWithValue(err.message)
    }
  }
)

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    user: savedUser,
    loading: false,
    error: null,
  },
  reducers: {
    logout(state) {
      state.user = null
      localStorage.removeItem('hotel_token')
      localStorage.removeItem('hotel_user')
    },
    clearError(state) {
      state.error = null
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loginThunk.pending, (state) => {
        state.loading = true; state.error = null
      })
      .addCase(loginThunk.fulfilled, (state, action) => {
        state.loading = false; state.user = action.payload
      })
      .addCase(loginThunk.rejected, (state, action) => {
        state.loading = false; state.error = action.payload
      })
      .addCase(registerThunk.pending, (state) => {
        state.loading = true; state.error = null
      })
      .addCase(registerThunk.fulfilled, (state) => {
        state.loading = false
      })
      .addCase(registerThunk.rejected, (state, action) => {
        state.loading = false; state.error = action.payload
      })
  },
})

export const { logout, clearError } = authSlice.actions
export default authSlice.reducer
