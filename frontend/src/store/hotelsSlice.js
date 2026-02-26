import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { hotelsApi } from '../api/hotels'

export const fetchHotels = createAsyncThunk(
  'hotels/fetchAll',
  async (_, { rejectWithValue }) => {
    try { return await hotelsApi.getAll() }
    catch (err) { return rejectWithValue(err.message) }
  }
)

export const createHotel = createAsyncThunk(
  'hotels/create',
  async (data, { rejectWithValue }) => {
    try { return await hotelsApi.create(data) }
    catch (err) { return rejectWithValue(err.message) }
  }
)

export const updateHotel = createAsyncThunk(
  'hotels/update',
  async ({ id, data }, { rejectWithValue }) => {
    try { return await hotelsApi.update(id, data) }
    catch (err) { return rejectWithValue(err.message) }
  }
)

export const submitHotel = createAsyncThunk(
  'hotels/submit',
  async (id, { rejectWithValue }) => {
    try { return await hotelsApi.submit(id) }
    catch (err) { return rejectWithValue(err.message) }
  }
)

export const approveHotel = createAsyncThunk(
  'hotels/approve',
  async (id, { rejectWithValue }) => {
    try { return await hotelsApi.approve(id) }
    catch (err) { return rejectWithValue(err.message) }
  }
)

export const rejectHotel = createAsyncThunk(
  'hotels/reject',
  async ({ id, reason }, { rejectWithValue }) => {
    try { return await hotelsApi.reject(id, reason) }
    catch (err) { return rejectWithValue(err.message) }
  }
)

export const offlineHotel = createAsyncThunk(
  'hotels/offline',
  async (id, { rejectWithValue }) => {
    try { return await hotelsApi.offline(id) }
    catch (err) { return rejectWithValue(err.message) }
  }
)

export const onlineHotel = createAsyncThunk(
  'hotels/online',
  async (id, { rejectWithValue }) => {
    try { return await hotelsApi.online(id) }
    catch (err) { return rejectWithValue(err.message) }
  }
)

const hotelsSlice = createSlice({
  name: 'hotels',
  initialState: {
    list: [],
    loading: false,
    error: null,
    actionLoading: false, // for approve/reject/offline etc.
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      // Fetch
      .addCase(fetchHotels.pending, (state) => { state.loading = true; state.error = null })
      .addCase(fetchHotels.fulfilled, (state, action) => { state.loading = false; state.list = action.payload })
      .addCase(fetchHotels.rejected, (state, action) => { state.loading = false; state.error = action.payload })
      // All mutation actions share actionLoading
      .addMatcher(
        (action) => action.type.startsWith('hotels/') && action.type.endsWith('/pending') && action.type !== 'hotels/fetchAll/pending',
        (state) => { state.actionLoading = true }
      )
      .addMatcher(
        (action) => action.type.startsWith('hotels/') && (action.type.endsWith('/fulfilled') || action.type.endsWith('/rejected')) && action.type !== 'hotels/fetchAll/fulfilled' && action.type !== 'hotels/fetchAll/rejected',
        (state) => { state.actionLoading = false }
      )
  },
})

export default hotelsSlice.reducer
