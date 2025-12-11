import { FULFILLMENT_ORDER_HOLD } from "../Graphql/Mutation/FulfillmentOrderHold.js";
import { EditOrderBegin } from "../Graphql/Mutation/OrderEditBegin.graphql.js";
import { GET_FULFILLMENT_ORDER } from "../Graphql/Query/GetFulfillmentOrder.js";
import sendEditEmail from "../Middlewares/Email/Email.config.js";
import ShopifyOrder from "../Models/Orders.Model.js";
import storeModel from "../Models/Store.Model.js";
import shopify from "../shopify.js";

export const createShopifyOrder = async (payload, shop, session) => {
    try {
        const order = payload;
        const client = new shopify.api.clients.Graphql({ session });

        // Save order to DB (unchanged)
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

        return {
            success: true,
            order: savedOrder,
        };

    } catch (error) {
        console.error("createShopifyOrder error:", error);

        // More detailed error logging
        if (error.response) {
            console.error("Error response status:", error.response.code || error.response.status);
            console.error("Error response body:", JSON.stringify(error.response.body, null, 2));
            console.error("Error response headers:", error.response.headers);
        }

        if (error instanceof shopify.api.clients.HttpResponseError) {
            console.error("HttpResponseError details:", {
                code: error.code,
                statusText: error.statusText,
                body: error.body
            });
        }

        return { success: false, error: error.message };
    }
};

export const orderOnHold = async (payload, shop, session) => {
    try {
        console.log("🔵 [orderOnHold] Starting function with order ID:", payload.admin_graphql_api_id);

        const client = new shopify.api.clients.Graphql({ session });

        // 1. Get fulfillment orders
        const fulfillmentResponse = await client.request(GET_FULFILLMENT_ORDER, {
            variables: { orderId: payload.admin_graphql_api_id }
        });

        console.log("🔵 [orderOnHold] Full response structure:", JSON.stringify(fulfillmentResponse, null, 2));

        // The response is already the data, so access it directly
        const fulfillmentOrders = fulfillmentResponse?.data?.order?.fulfillmentOrders?.nodes;

        console.log("🔵 [orderOnHold] Extracted fulfillment orders:", fulfillmentOrders);

        if (!fulfillmentOrders || fulfillmentOrders.length === 0) {
            console.log("🔴 [orderOnHold] No fulfillment orders found for order:", payload.id);
            return { success: false, error: "No fulfillment orders found" };
        }

        console.log("🟢 [orderOnHold] Found", fulfillmentOrders.length, "fulfillment orders");

        // 2. Hold the first fulfillment order
        const fulfillmentOrderId = fulfillmentOrders[0].id;
        console.log("🔵 [orderOnHold] Using fulfillment order ID:", fulfillmentOrderId);

        // CORRECTED: Pass id and fulfillmentHold as separate variables
        const holdVariables = {
            id: fulfillmentOrderId,  // Separate id parameter
            fulfillmentHold: {        // Separate fulfillmentHold object
                reason: "OTHER",
                notes: "Order placed on hold"
            }
        };

        console.log("🔵 [orderOnHold] Sending hold mutation with variables:", JSON.stringify(holdVariables, null, 2));

        const response = await client.request(FULFILLMENT_ORDER_HOLD, {
            variables: holdVariables
        });

        console.log("🟢 [orderOnHold] Hold mutation response:", JSON.stringify(response, null, 2));
        return response;

    } catch (error) {
        console.error("🔴 [orderOnHold] Error:", error);
        console.error("🔴 [orderOnHold] Error details:", {
            message: error.message,
            stack: error.stack,
            response: error.response?.body
        });
        return { success: false, error: error.message };
    }
}

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

        const shopifyShop = await storeModel.findOne({ domain: shop });

        if (!shopifyShop) {
            return res.status(404).json({ success: false, message: "Shop not found" });
        }

        const order = await ShopifyOrder.findOne({
            shopify_order_id: orderId,
            shopify_store_id: shop
        });

        if (!order) {
            return res.status(404).json({ success: false, message: "Order not found" });
        }

        // Convert dates
        // const createdAt = new Date(order.createdAt);
        // const now = new Date();

        // // Difference in minutes
        // const diffMinutes = Math.floor((now - createdAt) / (1000 * 60));

        // // Check allowed edit time
        // if (diffMinutes > shopifyShop.orderEditTime) {
        //     return res.status(403).json({
        //         success: false,
        //         message: "Editing Time Expired"
        //     });
        // }

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
        const { orderId, shop } = req.body;

        const gid = `gid://shopify/Order/${orderId}`;
        const sessions = await shopify.config.sessionStorage.findSessionsByShop(shop);
        if (!sessions || sessions.length === 0) {
            throw new Error(`No session found for shop: ${shop}`);
        }
        console.log("gid", gid);
        const session = sessions[0];

        const client = new shopify.api.clients.Graphql({
            session: session
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


// controllers/addProductToOrder.js
export const AddProductToOrder = async (req, res) => {
    try {
        const { calculatedOrderId, variantId, quantity, shop, orderId } = req.body;

        const sessions = await shopify.config.sessionStorage.findSessionsByShop(shop);
        if (!sessions || sessions.length === 0) {
            throw new Error(`No session found for shop: ${shop}`);
        }

        const session = sessions[0];
        const client = new shopify.api.clients.Graphql({ session });

        const query = `
            mutation orderEditAddVariant($id: ID!, $variantId: ID!, $quantity: Int!) {
                orderEditAddVariant(id: $id, variantId: $variantId, quantity: $quantity) {
                    calculatedOrder {
                        id
                        addedLineItems(first: 10) {
                            edges {
                                node {
                                    id
                                    title
                                    quantity
                                    variant {
                                        id
                                        title
                                    }
                                }
                            }
                        }
                    }
                    userErrors {
                        field
                        message
                    }
                }
            }
        `;

        const variables = {
            id: calculatedOrderId,
            variantId: variantId, // full gid
            quantity: parseInt(quantity)
        };

        const response = await client.request(query, { variables });

        console.log("GRAPHQL RAW RESPONSE:", response);

        const result = response.data?.orderEditAddVariant;

        if (!result) {
            throw new Error("Shopify did not return orderEditAddVariant. Check API version or mutation.");
        }

        if (result.userErrors?.length > 0) {
            throw new Error(result.userErrors[0].message);
        }

        // const getOrder = await ShopifyOrder.findOne({ shopify_order_id: orderId, shopify_store_id: shop });

        return res.status(200).json({
            success: true,
            calculatedOrderId,
            addedLineItem: result.calculatedOrder.addedLineItems.edges[0]?.node
        });

    } catch (error) {
        console.error("AddProductToOrder Error:", error);
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};


export const RemoveLineItem = async (req, res) => {
    try {
        const { calculatedOrderId, lineItemId, shop } = req.body;

        const sessions = await shopify.config.sessionStorage.findSessionsByShop(shop);
        if (!sessions || sessions.length === 0) {
            throw new Error(`No session found for shop: ${shop}`);
        }

        const session = sessions[0];
        const client = new shopify.api.clients.Graphql({ session });

        const query = `
            mutation orderEditRemoveLineItem($id: ID!, $lineItemIds: [ID!]!) {
                orderEditRemoveLineItem(id: $id, lineItemIds: $lineItemIds) {
                    calculatedOrder {
                        id
                        addedLineItems(first: 10) {
                            edges {
                                node {
                                    id
                                    title
                                    quantity
                                }
                            }
                        }
                    }
                    userErrors {
                        field
                        message
                    }
                }
            }
        `;

        const variables = {
            id: calculatedOrderId,
            lineItemIds: [lineItemId]
        };

        const response = await client.request(query, { variables });

        if (response.orderEditRemoveLineItem.userErrors && response.orderEditRemoveLineItem.userErrors.length > 0) {
            throw new Error(response.orderEditRemoveLineItem.userErrors[0].message);
        }

        return res.status(200).json({
            success: true,
            removedLineItemId: lineItemId,
            calculatedOrderId: calculatedOrderId
        });

    } catch (error) {
        console.error("RemoveLineItem Error:", error);
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

export const UpdateLineItem = async (req, res) => {
    try {
        const { calculatedOrderId, lineItemId, quantity, shop, orderId } = req.body;

        // Input validation
        if (!calculatedOrderId || !lineItemId || !quantity || !shop) {
            return res.status(400).json({
                success: false,
                message: "Missing required parameters: calculatedOrderId, lineItemId, quantity, shop"
            });
        }

        const sessions = await shopify.config.sessionStorage.findSessionsByShop(shop);
        if (!sessions || sessions.length === 0) {
            return res.status(401).json({
                success: false,
                message: `No session found for shop: ${shop}`
            });
        }

        const session = sessions[0];
        const client = new shopify.api.clients.Graphql({ session });

        const query = `
            mutation orderEditSetQuantity($id: ID!, $lineItemId: ID!, $quantity: Int!) {
                orderEditSetQuantity(id: $id, lineItemId: $lineItemId, quantity: $quantity) {
                    calculatedOrder {
                        id
                        addedLineItems(first: 5) {
                            edges {
                                node {
                                    id
                                    quantity
                                }
                            }
                        }
                    }
                    userErrors {
                        field
                        message
                    }
                }
            }
        `;

        const variables = {
            id: calculatedOrderId,
            lineItemId: lineItemId,
            quantity: parseInt(quantity, 10)
        };

        console.log("Executing GraphQL mutation with variables:", variables);

        const response = await client.request(query, { variables });

        // Debug: log full response
        console.log("GraphQL Response structure:", Object.keys(response));
        console.log("Response data:", JSON.stringify(response.data, null, 2));

        // Check if data exists and has the mutation field
        if (!response || !response.data || !response.data.orderEditSetQuantity) {
            // Check for GraphQL errors in the response
            if (response.errors) {
                throw new Error(`GraphQL Error: ${JSON.stringify(response.errors)}`);
            }
            throw new Error("No data returned from mutation");
        }

        const mutationResult = response.data.orderEditSetQuantity;

        // Check for userErrors
        if (mutationResult.userErrors && mutationResult.userErrors.length > 0) {
            throw new Error(mutationResult.userErrors[0].message);
        }

        const updateOrder = await ShopifyOrder.findOne({ shopify_order_id: orderId, shopify_store_id: shop });

        if (!updateOrder) {
            throw new Error("Order not found");
        }
        const splittedLineItemId = Number(lineItemId.split("/").pop());

        // Find the line item
        const lineItem = updateOrder.line_items.find(
            (item) => item.shopify_line_item_id === splittedLineItemId
        );

        if (!lineItem) {
            throw new Error("Line item not found");
        }

        // Update quantity correctly
        lineItem.quantity = parseInt(quantity, 10);

        // Save order
        await updateOrder.save();


        // Note: Your mutation succeeded but returned a different line item ID
        // This might be because the line item you tried to update doesn't exist or 
        // the CalculatedOrder has different line items than expected
        console.log("Mutation successful. Updated line items:",
            mutationResult.calculatedOrder.addedLineItems.edges.map(edge => ({
                id: edge.node.id,
                quantity: edge.node.quantity
            }))
        );

        return res.status(200).json({
            success: true,
            updatedLineItemId: lineItemId,
            newQuantity: quantity,
            calculatedOrderId: calculatedOrderId,
            data: mutationResult.calculatedOrder
        });

    } catch (error) {
        console.error("UpdateLineItem Error:", error.message);
        console.error("Stack trace:", error.stack);

        return res.status(500).json({
            success: false,
            message: error.message || "Internal server error",
            error: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
}
    ;
export const UpdateCustomerInfo = async (req, res) => {
    try {
        const { calculatedOrderId, firstName, lastName, email, shop } = req.body;

        const sessions = await shopify.config.sessionStorage.findSessionsByShop(shop);
        if (!sessions || sessions.length === 0) {
            throw new Error(`No session found for shop: ${shop} `);
        }

        const session = sessions[0];
        const client = new shopify.api.clients.Graphql({ session });

        // First, we need to get the order edit
        const getOrderEditQuery = `
            query getOrderEdit($id: ID!) {
            orderEdit(id: $id) {
                id
                    order {
                    id
                        customer {
                        id
                    }
                }
            }
        }
        `;

        const getVariables = { id: calculatedOrderId };
        const orderEditResponse = await client.request(getOrderEditQuery, { variables: getVariables });

        const customerId = orderEditResponse.orderEdit.order.customer.id;

        // Update customer information
        const updateCustomerQuery = `
            mutation customerUpdate($input: CustomerInput!) {
            customerUpdate(input: $input) {
                    customer {
                    id
                    firstName
                    lastName
                    email
                }
                    userErrors {
                    field
                    message
                }
            }
        }
        `;

        const updateVariables = {
            input: {
                id: customerId,
                firstName: firstName,
                lastName: lastName,
                email: email
            }
        };

        const response = await client.request(updateCustomerQuery, { variables: updateVariables });

        if (response.customerUpdate.userErrors && response.customerUpdate.userErrors.length > 0) {
            throw new Error(response.customerUpdate.userErrors[0].message);
        }

        return res.status(200).json({
            success: true,
            customer: response.customerUpdate.customer,
            calculatedOrderId: calculatedOrderId
        });

    } catch (error) {
        console.error("UpdateCustomerInfo Error:", error);
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

export const UpdateShippingAddress = async (req, res) => {
    try {
        const { calculatedOrderId, shippingAddress, shop } = req.body;

        const { first_name, last_name, address1, city, country, zip } = shippingAddress;

        const sessions = await shopify.config.sessionStorage.findSessionsByShop(shop);
        if (!sessions || sessions.length === 0) {
            throw new Error(`No session found for shop: ${shop} `);
        }

        const session = sessions[0];
        const client = new shopify.api.clients.Graphql({ session });

        const query = `
            mutation orderEditUpdateShippingAddress($id: ID!, $shippingAddress: MailingAddressInput!) {
            orderEditUpdateShippingAddress(id: $id, shippingAddress: $shippingAddress) {
                    calculatedOrder {
                    id
                        shippingAddress {
                        firstName
                        lastName
                        address1
                        city
                        country
                        zip
                    }
                }
                    userErrors {
                    field
                    message
                }
            }
        }
        `;

        const variables = {
            id: calculatedOrderId,
            shippingAddress: {
                firstName: first_name,
                lastName: last_name,
                address1: address1,
                city: city,
                country: country,
                zip: zip
            }
        };

        const response = await client.request(query, { variables });

        if (response.orderEditUpdateShippingAddress.userErrors &&
            response.orderEditUpdateShippingAddress.userErrors.length > 0) {
            throw new Error(response.orderEditUpdateShippingAddress.userErrors[0].message);
        }

        return res.status(200).json({
            success: true,
            shippingAddress: response.orderEditUpdateShippingAddress.calculatedOrder.shippingAddress,
            calculatedOrderId: calculatedOrderId
        });

    } catch (error) {
        console.error("UpdateShippingAddress Error:", error);
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

export const CommitChanges = async (req, res) => {
    try {
        const { calculatedOrderId, shop } = req.body;

        // Input validation
        if (!calculatedOrderId || !shop) {
            return res.status(400).json({
                success: false,
                message: "Missing required parameters: calculatedOrderId, shop"
            });
        }

        const sessions = await shopify.config.sessionStorage.findSessionsByShop(shop);
        if (!sessions || sessions.length === 0) {
            return res.status(401).json({
                success: false,
                message: `No session found for shop: ${shop}`
            });
        }

        const session = sessions[0];
        const client = new shopify.api.clients.Graphql({ session });

        const query = `
            mutation orderEditCommit($id: ID!, $notifyCustomer: Boolean, $staffNote: String) {
                orderEditCommit(id: $id, notifyCustomer: $notifyCustomer, staffNote: $staffNote) {
                    order {
                            id
                        }
                            userErrors {
                            field
                            message
                            }
                }
            }
        `;

        const variables = {
            id: calculatedOrderId,
            notifyCustomer: false,  // Changed to false as per docs example, but you can keep true if needed
            staffNote: "Order edited by customer via Order Edit App"
        };

        const response = await client.request(query, { variables });

        // Debug: log response structure
        console.log("CommitChanges Response keys:", Object.keys(response));
        if (response.data) {
            const data = response.data; // keep it as an object
            console.log("CommitChanges Response data111:", JSON.stringify(data, null, 2));

            if (data.orderEditCommit?.userErrors?.length > 0) {
                const message = data.orderEditCommit.userErrors[0].message;
                console.log("CommitChanges Error message:", message);

                // Send JSON response
                return res.status(400).json({ success: false, message });
            }

            // If no userErrors, proceed normally
            return res.status(200).json({ success: true, data: data.orderEditCommit });
        }


        // Check if data exists and has the mutation field
        if (!response || !response.data || !response.data.orderEditCommit) {
            // Check for GraphQL errors in the response
            if (response.errors) {
                throw new Error(`GraphQL Error: ${JSON.stringify(response.errors)}`);
            }
            throw new Error("No data returned from orderEditCommit mutation");
        }

        const mutationResult = response.data.orderEditCommit;

        // Check for userErrors
        if (mutationResult.userErrors && mutationResult.userErrors.length > 0) {
            throw new Error(mutationResult.userErrors[0].message);
        }

        return res.status(200).json({
            success: true,
            order: mutationResult.order,
            message: "Order changes committed successfully"
        });

    } catch (error) {
        console.error("CommitChanges Error:", error.message);
        console.error("Stack trace:", error.stack);

        return res.status(500).json({
            success: false,
            message: error.message || "Internal server error",
            error: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
};

export const GetCalculatedOrder = async (req, res) => {
    try {
        const { calculatedOrderId, shop } = req.body;

        const sessions = await shopify.config.sessionStorage.findSessionsByShop(shop);
        if (!sessions || sessions.length === 0) {
            throw new Error(`No session found for shop: ${shop} `);
        }

        const session = sessions[0];
        const client = new shopify.api.clients.Graphql({ session });

        const query = `
            query getCalculatedOrder($id: ID!) {
            orderEdit(id: $id) {
                id
                addedLineItems(first: 10) {
                        edges {
                            node {
                            id
                            title
                            quantity
                                variant {
                                id
                                title
                                    price {
                                    amount
                                    currencyCode
                                }
                            }
                        }
                    }
                }
                removedLineItems(first: 10) {
                        edges {
                            node {
                            id
                            title
                        }
                    }
                }
                    shippingAddress {
                    firstName
                    lastName
                    address1
                    city
                    country
                    zip
                }
                    subtotalPriceSet {
                        shopMoney {
                        amount
                        currencyCode
                    }
                }
                    totalPriceSet {
                        shopMoney {
                        amount
                        currencyCode
                    }
                }
            }
        }
        `;

        const variables = { id: calculatedOrderId };
        const response = await client.request(query, { variables });

        return res.status(200).json({
            success: true,
            calculatedOrder: response.orderEdit
        });

    } catch (error) {
        console.error("GetCalculatedOrder Error:", error);
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// controllers/addDiscount.js
export const AddDiscount = async (req, res) => {
    try {
        const { calculatedOrderId, discountCode, shop } = req.body;

        const sessions = await shopify.config.sessionStorage.findSessionsByShop(shop);
        if (!sessions || sessions.length === 0) {
            throw new Error(`No session found for shop: ${shop} `);
        }

        const session = sessions[0];
        const client = new shopify.api.clients.Graphql({ session });

        const query = `
            mutation orderEditAddDiscount($id: ID!, $discount: OrderEditAddDiscountInput!) {
            orderEditAddDiscount(id: $id, discount: $discount) {
                    calculatedOrder {
                    id
                        totalPriceSet {
                            shopMoney {
                            amount
                            currencyCode
                        }
                    }
                    discountApplications(first: 5) {
                            edges {
                                node {
                                    ... on DiscountCodeApplication {
    code
                                        value {
                                            ... on MoneyV2 {
            amount
            currencyCode
        }
                                            ... on PricingPercentageValue {
            percentage
        }
    }
}
                                }
                            }
                        }
                    }
                    userErrors {
    field
    message
}
                }
            }
`;

        const variables = {
            id: calculatedOrderId,
            discount: {
                discountCode: discountCode
            }
        };

        const response = await client.request(query, { variables });

        if (response.orderEditAddDiscount.userErrors && response.orderEditAddDiscount.userErrors.length > 0) {
            throw new Error(response.orderEditAddDiscount.userErrors[0].message);
        }

        return res.status(200).json({
            success: true,
            discountApplied: true,
            calculatedOrderId: calculatedOrderId
        });

    } catch (error) {
        console.error("AddDiscount Error:", error);
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// controllers/cancelOrderEdit.js
export const CancelOrderEdit = async (req, res) => {
    try {
        const { calculatedOrderId, shop } = req.body;

        const sessions = await shopify.config.sessionStorage.findSessionsByShop(shop);
        if (!sessions || sessions.length === 0) {
            throw new Error(`No session found for shop: ${shop} `);
        }

        const session = sessions[0];
        const client = new shopify.api.clients.Graphql({ session });

        const query = `
            mutation orderEditCancel($id: ID!) {
    orderEditCancel(id: $id) {
                    canceledOrderEdit {
            id
        }
                    userErrors {
            field
            message
        }
    }
}
`;

        const variables = { id: calculatedOrderId };
        const response = await client.request(query, { variables });

        if (response.orderEditCancel.userErrors && response.orderEditCancel.userErrors.length > 0) {
            throw new Error(response.orderEditCancel.userErrors[0].message);
        }

        return res.status(200).json({
            success: true,
            message: "Order edit cancelled successfully",
            canceledOrderEditId: calculatedOrderId
        });

    } catch (error) {
        console.error("CancelOrderEdit Error:", error);
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};