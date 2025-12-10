window.addEventListener("DOMContentLoaded", async () => {
    console.log("DOM CONTENT LOADED");

    const { shop } = window.edit;
    console.log("SHOP", shop);


    // Always reliably get query params
    const urlParams = new URLSearchParams(window.location.search);
    console.log("URL PARAMS", urlParams);

    const orderId = urlParams.get("OrderId");
    console.log("ORDER ID:", orderId);




    if (!orderId) return;

    const body = document.querySelector("body");

    // ---------- Fetch Order ----------
    const fetchOrder = async () => {
        const response = await fetch(
            `https://${shop}/apps/edit/get-Orders/${shop}/${orderId}`
        );
        return await response.json();
    };

    const orderRes = await fetchOrder();
    const order = orderRes?.order;

    console.log("LOADED ORDER:", order);

    if (orderRes.message && orderRes.success === false) {
        body.innerHTML = `<div class="error-message" style="color:red;">${orderRes.message}</div>`;
        return;
    }

    // If invalid order
    if (!order) {
        body.innerHTML = `<p style="color:red;">Order not found.</p>`;
        return;
    }

    const pageHTML = `
        <div class="order-edit-wrapper">

            <div class="order-title">Edit Order #${order.order_number}</div>

            <!-- ORDER SUMMARY -->
            <div class="order-section">
            <button>edit</button> 
                <h3>Order Summary</h3>
                <p><strong>Total:</strong> ${order.total_price} ${order.currency}</p>
                <p><strong>Status:</strong> ${order.financial_status}</p>
                <p><strong>Payment Gateway:</strong> ${order.payment_gateway}</p>
            </div>

            <!-- CUSTOMER -->
            <div class="order-section">
                <h3>Customer</h3>
                <p>${order.customer.first_name} ${order.customer.last_name}</p>
                <p>${order.customer.email}</p>
            </div>

            <!-- LINE ITEMS -->
            <div class="order-section">
                <h3>Line Items</h3>
                ${order.line_items
            .map(
                (item) => `
                        <div class="line-item">
                            <p><strong>${item.title}</strong></p>
                            <p>Price: ${item.price}</p>
                            <p>Qty: <input type="number" value="${item.quantity}" min="1" /></p>
                        </div>
                    `
            )
            .join("")}
            </div>

            <!-- SHIPPING -->
            <div class="order-section">
                <h3>Shipping Address</h3>
                <p>${order.shipping_address.first_name} ${order.shipping_address.last_name}</p>
                <p>${order.shipping_address.address1}</p>
                <p>${order.shipping_address.city}, ${order.shipping_address.country}, ${order.shipping_address.zip}</p>
            </div>

            <!-- ACTIONS -->
            <div>
               <button onclick="window.location.href='https://${shop}'" class="edit-btn">Cancel</button>

               <button class="save-btn">Save Changes</button>
            </div>

        </div>
    `;

    // Replace entire body
    body.innerHTML = pageHTML;
});
