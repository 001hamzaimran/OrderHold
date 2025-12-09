import { FULFILLMENT_ORDER_HOLD } from "../Graphql/Mutation/FulfillmentOrderHold.js";
import { EditOrderBegin } from "../Graphql/Mutation/OrderEditBegin.graphql.js";
import { GET_FULFILLMENT_ORDER } from "../Graphql/Query/GetFulfillmentOrder.js";
import sendEditEmail from "../Middlewares/Email/Email.config.js";
import ShopifyOrder from "../Models/Orders.Model.js";
import shopify from "../shopify.js";

export const createShopifyOrder = async (payload, shop, session) => {
    try {
        const order = payload;
        const client = new shopify.api.clients.Graphql({ session });

        // Save order to database first
        const savedOrder = await ShopifyOrder.create({
            // ... your existing order creation code
        });

        // Build correct GraphQL ID (NO quotes in the string)
        const orderGid = `gid://shopify/Order/${order.id}`;
        console.log("Fetching fulfillment orders for:", orderGid);

        // Get fulfillment orders
        const fulfillmentResponse = await client.request({
            query: GET_FULFILLMENT_ORDER,
            variables: { orderId: orderGid }
        });

        // Check if we got any fulfillment orders
        const fulfillmentOrders = fulfillmentResponse.body.data.order.fulfillmentOrders.nodes;

        if (!fulfillmentOrders || fulfillmentOrders.length === 0) {
            console.log("No fulfillment orders found for order:", orderGid);
            return {
                success: true,
                order: savedOrder,
                message: "No fulfillment orders to put on hold"
            };
        }

        const firstFulfillmentOrderId = fulfillmentOrders[0].id;
        console.log("First fulfillment order ID:", firstFulfillmentOrderId);

        // Try to put fulfillment order on hold
        try {
            const fulfillmentOrderHold = await client.request({
                query: FULFILLMENT_ORDER_HOLD,
                variables: {
                    fulfillmentHold: {
                        reason: "OTHER",
                        reasonNotes: "Waiting for Editing Period Complete",
                    },
                    id: firstFulfillmentOrderId,
                }
            });

            // Check for user errors in the response
            const userErrors = fulfillmentOrderHold.body.data?.fulfillmentOrderHold?.userErrors;
            if (userErrors && userErrors.length > 0) {
                console.warn("User errors from fulfillmentOrderHold:", userErrors);
                // Continue execution even if hold fails
            }

            return {
                success: true,
                order: savedOrder,
                fulfillmentOrderId: firstFulfillmentOrderId,
                fulfillmentOrderHold: fulfillmentOrderHold.body.data?.fulfillmentOrderHold || null
            };

        } catch (holdError) {
            // Log the hold error but don't fail the entire process
            console.error("Error putting fulfillment order on hold:", {
                error: holdError.message,
                fulfillmentOrderId: firstFulfillmentOrderId,
                orderId: order.id
            });

            // Return success anyway since the order was saved
            return {
                success: true,
                order: savedOrder,
                warning: "Fulfillment hold failed",
                error: holdError.message
            };
        }

    } catch (error) {
        console.error("Error in createShopifyOrder:", {
            message: error.message,
            stack: error.stack,
            orderId: payload?.id,
            shop: shop
        });
        throw error;
    }
};


export const getShopifyOrders = async (req, res) => {
    try {
        const shop = req.params.shop;

        if (!shop) {
            return res.status(400).json({ success: false, message: "Shop is missing" });
        }

        const orders = await ShopifyOrder.find({ shopify_store_id: shop });

        return res.status(200).json({ success: true, orders });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ success: false, error: error.message });
    }
};

export const getOrder = async (req, res) => {
    try {
        const { orderId, shop } = req.params;
        const order = await ShopifyOrder.find({ shopify_order_id: orderId, shopify_store_id: shop });
        if (!order) {
            return res.status(404).json({ success: false, message: "Order not found" });
        }

        return res.status(200).json({ success: true, order });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ success: false, error: error.message });
    }
};

export const sendEditOrderMail = async (shop, payload) => {
    try {
        const order = payload;
        await sendEditEmail(order.customer.email, shop, order.id);
        return ({ success: true });
    } catch (error) {
        console.error(error);
        return
    }
};

export const OrderEditBegin = async (req, res) => {
    try {
        const { orderId } = req.body;

        const gid = `${orderId}`;

        const client = new shopify.api.clients.Graphql({
            session: res.locals.shopify.session
        });

        const query = EditOrderBegin;

        const variables = {
            id: gid
        };

        const response = await client.request(query, { variables });

        return res.status(200).json({
            success: true,
            response
        });

    } catch (error) {
        console.error("OrderEditBegin Error:", error);
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};