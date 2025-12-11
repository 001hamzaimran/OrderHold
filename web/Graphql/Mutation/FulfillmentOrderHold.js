export const FULFILLMENT_ORDER_HOLD = `
  mutation fulfillmentOrderHold($fulfillmentHold: FulfillmentOrderHoldInput!) {
    fulfillmentOrderHold(fulfillmentHold: $fulfillmentHold) {
      fulfillmentOrder {
        id
        status
      }
      userErrors {
        field
        message
      }
    }
  }
`;