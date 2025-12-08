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

        const savedOrder = await ShopifyOrder.create({
            shopify_store_id: shop,
            shopify_order_id: order.id,
            shopify_graphql_id: order.admin_graphql_api_id,

            order_number: order.order_number,
            order_name: order.name,
            confirmation_number: order.confirmation_number,
            token: order.token,

            payment_gateway: order.payment_gateway_names,
            payment_status: order.financial_status === "paid" ? "paid" : "pending",
            financial_status: order.financial_status,

            total_price: order.total_price,
            subtotal_price: order.subtotal_price,
            total_tax: order.total_tax,
            total_discounts: order.total_discounts,
            currency: order.currency,
            presentment_currency: order.presentment_currency,
            total_price_set: order.total_price_set,

            fulfillment_status: order.fulfillment_status,

            customer: {
                shopify_customer_id: order.customer?.id,
                email: order.customer?.email,
                first_name: order.customer?.first_name,
                last_name: order.customer?.last_name,
                phone: order.customer?.phone
            },

            shipping_address: order.shipping_address,
            billing_address: order.billing_address,

            line_items: order.line_items.map(item => ({
                shopify_line_item_id: item.id,
                product_id: item.product_id,
                variant_id: item.variant_id,
                title: item.title,
                price: item.price,
                quantity: item.quantity,
                vendor: item.vendor,
                fulfillment_status: item.fulfillment_status,
                fulfillment_service: item.fulfillment_service
            })),

            test_order: order.test,
            confirmed: order.confirmed,
            source_name: order.source_name,
            browser_ip: order.browser_ip,
            landing_site: order.landing_site,
            referring_site: order.referring_site,

            shopify_created_at: order.created_at,
            shopify_updated_at: order.updated_at,
            processed_at: order.processed_at
        });
        // Build correct GraphQL ID
        const orderGid = `gid://shopify/Order/${order.id}`;
        console.log(orderGid);
        const response = await client.query({
            data: GET_FULFILLMENT_ORDER,
            variables: { orderId: orderGid }
        });

        const firstFulfillmentOrderId =
            response.body.data.order.fulfillmentOrders.nodes[0].id;

        console.log(firstFulfillmentOrderId);

        const fulfillmentOrderHold = await client.query({
            data: FULFILLMENT_ORDER_HOLD,
            variables: {
                fulfillmentHold: {
                    reason: "OTHER",
                    reasonNotes: "Waiting for Editing Period Complete",
                },
                id: firstFulfillmentOrderId,
            }
        });

        return {
            success: true,
            order: savedOrder,
            fulfillmentOrderId: firstFulfillmentOrderId,
            fulfillmentOrderHold
        };


    } catch (error) {
        console.error(error);
        return
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