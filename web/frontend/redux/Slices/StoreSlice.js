import { createSlice } from "@reduxjs/toolkit";

const initialState = {
    storeDetail: null,
    User: null,
};

const StoreSlice = createSlice({
    name: "store",
    initialState,
    reducers: {
        setStoreDetail: (state, action) => {
            state.storeDetail = action.payload;
        },
        setUser: (state, action) => {
            state.User = action.payload;
        },
    },
});

export const { setStoreDetail, setUser } = StoreSlice.actions;
export default StoreSlice.reducer;
