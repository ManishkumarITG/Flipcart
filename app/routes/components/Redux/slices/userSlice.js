import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { API_SERVICES } from "../../../Services/Apis";

const apiClass = new API_SERVICES();

const initialState = {
  user: null,
  token: null,
  loading: false,
  error: null,
  isAuthenticated: false,
};

export const loginUser = createAsyncThunk(
  "user/loginUser",
  async (payload, thunkAPI) => {
    try {
      const data = await apiClass.login(payload);

      if (data?.success && data.data) {
        const { password, ...safeUser } = data.data;
        return safeUser;
      }
      return thunkAPI.rejectWithValue(data?.message || "Login failed");
    } catch (error) {
      return thunkAPI.rejectWithValue(error?.message || "Login failed");
    }
  },
);
const userSlice = createSlice({
  name: "user",
  initialState: initialState,

  reducers: {
    logoutUser: (state) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      state.error = null;
    },
  },

  extraReducers: (builder) => {
    builder

      .addCase(loginUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })

      .addCase(loginUser.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload;
        state.isAuthenticated = true;
      })

      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.isAuthenticated = false;
      });
  },
});
export const { logoutUser } = userSlice.actions;

export default userSlice.reducer;
