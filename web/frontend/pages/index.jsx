import { useEffect, useState } from 'react'

function Index() {
  const [shop, setShop] = useState({});
  const [orders, setOrders] = useState([]);

  const getStore = async () => {
    try {
      const resp = await fetch("/api/store/get-shop");
      const data = await resp.json();
      setShop(data);
    } catch (error) {
      console.log(error);
    }
  };

  const getOrder = async () => {
    try {
      if (!shop?.domain) return;

      const resp = await fetch(`/api/Orders/get-Orders/${shop.domain}/6635687936252`);
      const data = await resp.json();

      if (data?.order) {
        console.log(data.order[0].shopify_graphql_id);
        setOrders(data.order); // Save in state
      }

    } catch (error) {
      console.log(error);
    }
  };

  const editOrder = async (id) => {
    console.log(id);
    try {
      const resp = await fetch(`/api/Orders/Order-Edit-Begin`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            body: JSON.stringify({ orderId: id })
          }
        });
      const data = await resp.json();
      console.log(data);
    } catch (error) {
      console.log(error);
    }

  }

  useEffect(() => {
    getStore();
  }, []);

  useEffect(() => {
    getOrder();
  }, [shop]);

  return (
    <div style={{ padding: "20px" }}>
      <h2>Order Details</h2>

      {orders.length === 0 ? (
        <p>No Order Found</p>
      ) : (
        orders.map((o, i) => (
          <div
            key={i}
            style={{
              border: "1px solid #ddd",
              padding: "15px",
              marginBottom: "15px",
              borderRadius: "8px"
            }}
          >

            <h3>Order #{o.order_number}</h3>

            <p><strong>Customer:</strong> {o.customer.first_name} {o.customer.last_name}</p>
            <p><strong>Email:</strong> {o.customer.email}</p>
            <p><strong>Total Price:</strong> ${o.total_price}</p>
            <p><strong>Payment Status:</strong> {o.payment_status}</p>
            <p><strong>Financial Status:</strong> {o.financial_status}</p>

            <h4>Line Items:</h4>
            {o.line_items.map((item, idx) => (
              <div key={idx} style={{ marginLeft: "10px" }}>
                <p><strong>Product:</strong> {item.title}</p>
                <p><strong>Quantity:</strong> {item.quantity}</p>
                <p><strong>Price:</strong> ${item.price}</p>
              </div>
            ))}

            <button
              style={{
                marginTop: "10px",
                padding: "8px 15px",
                background: "#4f46e5",
                color: "white",
                border: "none",
                borderRadius: "5px",
                cursor: "pointer"
              }}
              onClick={() => editOrder(o.shopify_graphql_id
              )}
            >
              Edit
            </button>

          </div>
        ))
      )}

    </div>
  );
}

export default Index;
