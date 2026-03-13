import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { API_SERVICES } from "../../../Services/Apis";

const apiClass = new API_SERVICES();

const initialState = {
    user: null,
    token: null,
    loading: false,
    error: null,
    isAuthenticated: false
};

export const loginUser = createAsyncThunk(
    "user/loginUser",
    async (payload, thunkAPI) => {
        try {
            const data = await apiClass.login(payload);
            // const data = await res.json();

            // password remove
            const { password, ...safeUser } = data.data;

            return safeUser;

        } catch (error) {
            return thunkAPI.rejectWithValue(error.message);
        }
    }
);
const userSlice = createSlice({
    name: "user",
    initialState: initialState,

    reducers: {},

    extraReducers: (builder) => {
        builder

            .addCase(loginUser.pending, (state) => {
                state.loading = true;
            })

            .addCase(loginUser.fulfilled, (state, action) => {
                state.loading = false;
                state.user = action.payload; // password already removed
            })

            .addCase(loginUser.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            });
    }
});
export const { logoutUser } = userSlice.actions;

export default userSlice.reducer;