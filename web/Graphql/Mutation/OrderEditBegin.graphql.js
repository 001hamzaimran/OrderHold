export const EditOrderBegin = `mutation OrderEditBegin($id: ID!) {
  orderEditBegin(id: $id) {
    calculatedOrder {
      id
    }
    userErrors {
      field
      message
    }
  }
}` ;