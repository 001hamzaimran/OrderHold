export const GET_FULFILLMENT_ORDER = `
  query GetFulfillmentOrders($orderId: ID!) {
    order(id: $orderId) {
      fulfillmentOrders(first: 10) {
        nodes {
          id
          status
          lineItems(first: 10) {
            nodes {
              lineItem {
                id
                name
              }
              remainingQuantity
            }
          }
        }
      }
    }
  }
`;