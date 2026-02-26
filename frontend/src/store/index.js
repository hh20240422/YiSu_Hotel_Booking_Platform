import { configureStore } from '@reduxjs/toolkit'
import authReducer from './authSlice'
import hotelsReducer from './hotelsSlice'
import uiReducer from './uiSlice'

export const store = configureStore({
  reducer: {
    auth: authReducer,
    hotels: hotelsReducer,
    ui: uiReducer,
  },
})
