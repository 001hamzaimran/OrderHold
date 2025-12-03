import { Router } from "express";
import { getOrder, getShopifyOrders } from "../Controller/Orders.Controller.js";

const OrderRouter = Router();

OrderRouter.get("/get-All-Orders/:shop", getShopifyOrders);
OrderRouter.get("/get-Orders/:shop/:orderId", getOrder);

export default OrderRouter;