import { Router } from "express";
import { getShopifyOrders } from "../Controllers/Orders.Controller.js";

const OrderRouter = Router();

OrderRouter.get("/get-All-Orders/:shop", getShopifyOrders);

export default OrderRouter;