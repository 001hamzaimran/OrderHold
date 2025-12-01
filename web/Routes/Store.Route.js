import { Router } from "express";
import { getShop } from "../Controllers/Store.Controller.js";

const storeRouter = Router();

storeRouter.get("/get-shop", getShop);

export default storeRouter;