import { Router } from "express";
import { addEditTimer, getShop } from "../Controller/Store.Controller.js";

const storeRouter = Router();

storeRouter.get("/get-shop", getShop);
storeRouter.post("/add-edit-timer", addEditTimer);

export default storeRouter;