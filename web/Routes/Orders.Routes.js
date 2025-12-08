import { Router } from "express";
import { getOrder, getShopifyOrders, OrderEditBegin } from "../Controller/Orders.Controller.js";

const OrderRouter = Router();

OrderRouter.get("/get-All-Orders/:shop", getShopifyOrders);
OrderRouter.get("/get-Orders/:shop/:orderId", getOrder);
OrderRouter.post("/Order-Edit-Begin", OrderEditBegin );

export default OrderRouter;