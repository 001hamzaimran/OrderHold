import { Router } from "express";
import { AddDiscount, AddProductToOrder, CancelOrderEdit, CommitChanges, GetCalculatedOrder, getOrder, getShopifyOrders, OrderEditBegin, RemoveLineItem, UpdateCustomerInfo, UpdateLineItem, UpdateShippingAddress } from "../Controller/Orders.Controller.js";
import getProducts from "../Controller/Product.Controller.js";

const OrderRouter = Router();

OrderRouter.get("/get-All-Orders/:shop", getShopifyOrders);
OrderRouter.get("/get-Orders/:shop/:orderId", getOrder);
OrderRouter.post("/Order-Edit-Begin", OrderEditBegin);

OrderRouter.post('/add-product-to-order', AddProductToOrder);
OrderRouter.post('/remove-line-item', RemoveLineItem);
OrderRouter.post('/update-line-item', UpdateLineItem);
OrderRouter.post('/update-customer-info', UpdateCustomerInfo);
OrderRouter.post('/update-shipping-address', UpdateShippingAddress);
OrderRouter.post('/commit-changes', CommitChanges);
OrderRouter.post('/get-calculated-order', GetCalculatedOrder);
OrderRouter.post('/add-discount', AddDiscount);
OrderRouter.post('/cancel-order-edit', CancelOrderEdit);

OrderRouter.get("/get-Products/:shop", getProducts);

export default OrderRouter;