import { combineReducers } from "@reduxjs/toolkit";
import StoreSlice from "../Slices/StoreSlice.js";

const rootReducer = combineReducers({
    store: StoreSlice
});

export { rootReducer }