import { DeliveryMethod } from "@shopify/shopify-api";
import shopify from "./shopify.js";
import { createShopifyOrder, orderOnHold, sendEditOrderMail } from "./Controller/Orders.Controller.js";

/**
 * @type {{[key: string]: import("@shopify/shopify-api").WebhookHandler}}
 */
export default {
  /**
   * Customers can request their data from a store owner. When this happens,
   * Shopify invokes this privacy webhook.
   *
   * https://shopify.dev/docs/apps/webhooks/configuration/mandatory-webhooks#customers-data_request
   */
  CUSTOMERS_DATA_REQUEST: {
    deliveryMethod: DeliveryMethod.Http,
    callbackUrl: "/api/webhooks",
    callback: async (topic, shop, body, webhookId) => {
      const payload = JSON.parse(body);
      // Payload has the following shape:
      // {
      //   "shop_id": 954889,
      //   "shop_domain": "{shop}.myshopify.com",
      //   "orders_requested": [
      //     299938,
      //     280263,
      //     220458
      //   ],
      //   "customer": {
      //     "id": 191167,
      //     "email": "john@example.com",
      //     "phone": "555-625-1199"
      //   },
      //   "data_request": {
      //     "id": 9999
      //   }
      // }
    },
  },

  /**
   * Store owners can request that data is deleted on behalf of a customer. When
   * this happens, Shopify invokes this privacy webhook.
   *
   * https://shopify.dev/docs/apps/webhooks/configuration/mandatory-webhooks#customers-redact
   */
  CUSTOMERS_REDACT: {
    deliveryMethod: DeliveryMethod.Http,
    callbackUrl: "/api/webhooks",
    callback: async (topic, shop, body, webhookId) => {
      const payload = JSON.parse(body);
      // Payload has the following shape:
      // {
      //   "shop_id": 954889,
      //   "shop_domain": "{shop}.myshopify.com",
      //   "customer": {
      //     "id": 191167,
      //     "email": "john@example.com",
      //     "phone": "555-625-1199"
      //   },
      //   "orders_to_redact": [
      //     299938,
      //     280263,
      //     220458
      //   ]
      // }
    },
  },

  /**
   * 48 hours after a store owner uninstalls your app, Shopify invokes this
   * privacy webhook.
   *
   * https://shopify.dev/docs/apps/webhooks/configuration/mandatory-webhooks#shop-redact
   */
  SHOP_REDACT: {
    deliveryMethod: DeliveryMethod.Http,
    callbackUrl: "/api/webhooks",
    callback: async (topic, shop, body, webhookId) => {
      const payload = JSON.parse(body);
      // Payload has the following shape:
      // {
      //   "shop_id": 954889,
      //   "shop_domain": "{shop}.myshopify.com"
      // }
    },
  },

  ORDERS_CREATE: {
    deliveryMethod: DeliveryMethod.Http,
    callbackUrl: "/api/webhooks",
    callback: async (topic, shop, body, webhookId) => {
      console.log("🔔 Webhook received:", topic, shop, "Webhook ID:", webhookId);

      try {
        const data = typeof body === 'string' ? JSON.parse(body) : body;
        console.log("🟢 [Webhook] Order ID:", data.id, "Name:", data.name);

        // IMPORTANT: Get offline session for webhooks
        console.log("🔵 [Webhook] Loading session for shop:", shop);
        const session = await shopify.config.sessionStorage.loadSession(`offline_${shop}`);

        if (!session) {
          console.error(`🔴 [Webhook] No offline session found for shop: ${shop}`);
          throw new Error(`No session found for shop: ${shop}`);
        }

        console.log("🟢 [Webhook] Session found, access token exists");

        console.log("🔵 [Webhook] Starting sendEditOrderMail...");
        await sendEditOrderMail(shop, data);
        console.log("🟢 [Webhook] sendEditOrderMail completed");

        console.log("🔵 [Webhook] Starting createShopifyOrder...");
        await createShopifyOrder(data, shop, session);
        console.log("🟢 [Webhook] createShopifyOrder completed");

        console.log("🔵 [Webhook] Starting orderOnHold...");
        const holdResult = await orderOnHold(data, shop, session);
        console.log("🟢 [Webhook] orderOnHold completed with result:", holdResult);

      } catch (error) {
        console.error("🔴 [Webhook] Processing error:", error);
        console.error("🔴 [Webhook] Error stack:", error.stack);
      }
    },
  }

};
