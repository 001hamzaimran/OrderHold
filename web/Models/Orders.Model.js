import mongoose from "mongoose";

const MoneySchema = new mongoose.Schema({
    amount: { type: String, required: true },
    currency_code: { type: String, required: true }
}, { _id: false });

const AddressSchema = new mongoose.Schema({
    first_name: String,
    last_name: String,
    name: String,
    company: String,
    address1: String,
    address2: String,
    city: String,
    province: String,
    province_code: String,
    zip: String,
    country: String,
    country_code: String,
    phone: String,
    latitude: Number,
    longitude: Number
}, { _id: false });

const LineItemSchema = new mongoose.Schema({
    shopify_line_item_id: { type: Number, required: true },
    product_id: Number,
    variant_id: Number,
    title: String,
    price: String,
    quantity: Number,
    vendor: String,
    fulfillment_status: String,
    fulfillment_service: String
}, { _id: false });

const ShopifyOrderSchema = new mongoose.Schema({
    shopify_store_id: { type: String, required: true },
    /** 🔥 Core Shopify Identifiers */
    shopify_order_id: { type: Number, required: true, unique: true },
    shopify_graphql_id: { type: String, required: true },

    /** 🔥 Order Info */
    order_number: Number,
    order_name: String,
    confirmation_number: String,
    token: String,

    /** 🔥 Payment Information */
    payment_gateway: [String],
    payment_status: {
        type: String,
        enum: ["pending", "paid", "authorized", "partially_paid", "refunded", "voided"],
        default: "pending"
    },
    financial_status: String,
    total_price: String,
    subtotal_price: String,
    total_tax: String,
    total_discounts: String,
    currency: String,
    presentment_currency: String,

    /** 🔥 Payment Money Objects */
    total_price_set: {
        shop_money: MoneySchema,
        presentment_money: MoneySchema
    },

    /** 🔥 Fulfillment */
    fulfillment_status: {
        type: String,
        enum: ["unfulfilled", "fulfilled", "partial", null],
        default: null
    },

    /** 🔥 Customer Info */
    customer: {
        shopify_customer_id: Number,
        email: String,
        first_name: String,
        last_name: String,
        phone: String
    },

    /** 🔥 Addresses */
    shipping_address: AddressSchema,
    billing_address: AddressSchema,

    /** 🔥 Line Items */
    line_items: [LineItemSchema],

    /** 🔥 Order Flags */
    test_order: Boolean,
    confirmed: Boolean,

    /** 🔥 Shopify System Info */
    source_name: String,
    browser_ip: String,
    landing_site: String,
    referring_site: String,

    /** 🔥 Timestamps */
    shopify_created_at: Date,
    shopify_updated_at: Date,
    processed_at: Date

}, { timestamps: true });

const ShopifyOrder = mongoose.model("ShopifyOrder", ShopifyOrderSchema);

export default ShopifyOrder;