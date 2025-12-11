window.addEventListener("DOMContentLoaded", async () => {
    console.log("DOM CONTENT LOADED");

    const { shop } = window.edit;
    console.log("SHOP", shop);

    // State management
    let calculatedOrderIdVar = null;
    let isEditing = false;
    let currentOrder = null;
    let products = [];

    const urlParams = new URLSearchParams(window.location.search);
    const orderId = urlParams.get("OrderId");
    console.log("ORDER ID:", orderId);

    // Check for existing calculated order ID
    const savedCalculatedOrderId = localStorage.getItem("calculatedOrderId");
    console.log("Saved Calculated Order ID:", savedCalculatedOrderId);

    if (savedCalculatedOrderId) {
        calculatedOrderIdVar = savedCalculatedOrderId;
        isEditing = true;
        console.log("Edit mode enabled from saved calculatedOrderId");
    }

    if (!orderId) {
        console.log("No order ID found in URL");
        return;
    }

    // Make edit function globally available
    window.orderEditBegin = async (orderIdToEdit) => {
        try {
            console.log("Starting order edit for:", orderIdToEdit);
            const response = await fetch(
                `https://${shop}/apps/edit/Order-Edit-Begin`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({ orderId: orderIdToEdit, shop })
                }
            );

            const data = await response.json();
            console.log("ORDER EDIT BEGIN RESPONSE:", data);

            const calculatedOrderId =
                data?.response?.data?.orderEditBegin?.calculatedOrder?.id;

            if (calculatedOrderId) {
                // Save permanently
                calculatedOrderIdVar = calculatedOrderId;
                localStorage.setItem("calculatedOrderId", calculatedOrderId);
                isEditing = true;

                console.log("Stored calculatedOrderId:", calculatedOrderId);
                console.log("Edit mode enabled");

                // Re-render the page in edit mode
                if (currentOrder) {
                    renderOrderPage();
                }
            }

        } catch (error) {
            console.error("ORDER EDIT BEGIN ERROR:", error);
        }
    };

    window.cancelEdit = () => {
        isEditing = false;
        localStorage.removeItem("calculatedOrderId");
        window.location.href = `https://${shop}`
    }

    window.discardEdit = () => {
        isEditing = false;
        localStorage.removeItem("calculatedOrderId");
        window.location.reload();
    }
    // Function to add a new product to order
    window.addProductToOrder = async (variantId, quantity = 1) => {
        if (!isEditing || !calculatedOrderIdVar) {
            alert("Please enable edit mode first");
            return;
        }

        try {
            console.log("Adding product variant:", variantId, "quantity:", quantity);

            const response = await fetch(
                `https://${shop}/apps/edit/add-product-to-order`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        orderId: orderId,
                        calculatedOrderId: calculatedOrderIdVar,
                        variantId: variantId,
                        quantity: quantity,
                        shop: shop
                    })
                }
            );

            const data = await response.json();
            console.log("ADD PRODUCT RESPONSE:", data);

            if (data.success) {
                // Refresh order data
                await loadOrderData();
                renderOrderPage();
            } else {
                alert("Failed to add product: " + (data.message || "Unknown error"));
            }

        } catch (error) {
            console.error("ADD PRODUCT ERROR:", error);
            alert("Error adding product: " + error.message);
        }
    };

    // Function to remove line item
    window.removeLineItem = async (lineItemId) => {
        if (!isEditing || !calculatedOrderIdVar) {
            alert("Please enable edit mode first");
            return;
        }

        if (!confirm("Are you sure you want to remove this item?")) {
            return;
        }

        try {
            console.log("Removing line item:", lineItemId);

            const response = await fetch(
                `https://${shop}/apps/edit/remove-line-item`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        calculatedOrderId: calculatedOrderIdVar,
                        lineItemId: lineItemId,
                        shop: shop
                    })
                }
            );

            const data = await response.json();
            console.log("REMOVE LINE ITEM RESPONSE:", data);

            if (data.success) {
                // Refresh order data
                await loadOrderData();
                renderOrderPage();
            } else {
                alert("Failed to remove item: " + (data.message || "Unknown error"));
            }

        } catch (error) {
            console.error("REMOVE LINE ITEM ERROR:", error);
            alert("Error removing item: " + error.message);
        }
    };

    // Function to update line item quantity
    window.updateLineItemQuantity = async (lineItemId, quantity) => {
        if (!isEditing || !calculatedOrderIdVar) {
            return; // Don't update if not in edit mode
        }

        if (quantity < 1) {
            // If quantity is 0, remove the item
            await removeLineItem(lineItemId);
            return;
        }

        try {
            console.log("Updating line item:", lineItemId, "quantity:", quantity);

            const response = await fetch(
                `https://${shop}/apps/edit/update-line-item`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        calculatedOrderId: calculatedOrderIdVar,
                        lineItemId: `gid://shopify/CalculatedLineItem/${lineItemId}`,
                        quantity: quantity,
                        shop: shop,
                        orderId
                    })
                }
            );

            const data = await response.json();
            console.log("UPDATE LINE ITEM RESPONSE:", data);

            if (data.success) {
                // Refresh order data
                await loadOrderData();
                renderOrderPage();
            }

        } catch (error) {
            console.error("UPDATE LINE ITEM ERROR:", error);
        }
    };

    // Function to update customer information
    window.updateCustomerInfo = async () => {
        if (!isEditing || !calculatedOrderIdVar) {
            return;
        }

        const firstName = document.getElementById('customer-first-name')?.value;
        const lastName = document.getElementById('customer-last-name')?.value;
        const email = document.getElementById('customer-email')?.value;

        try {
            const response = await fetch(
                `https://${shop}/apps/edit/update-customer-info`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        calculatedOrderId: calculatedOrderIdVar,
                        firstName: firstName,
                        lastName: lastName,
                        email: email,
                        shop: shop
                    })
                }
            );

            const data = await response.json();
            console.log("UPDATE CUSTOMER INFO RESPONSE:", data);

            if (data.success) {
                currentOrder.customer.first_name = firstName;
                currentOrder.customer.last_name = lastName;
                currentOrder.customer.email = email;
                showSuccessMessage("Customer information updated");
            }

        } catch (error) {
            console.error("UPDATE CUSTOMER INFO ERROR:", error);
        }
    };

    // Function to update shipping address
    window.updateShippingAddress = async () => {
        if (!isEditing || !calculatedOrderIdVar) {
            return;
        }

        const shippingAddress = {
            first_name: document.getElementById('shipping-first-name')?.value,
            last_name: document.getElementById('shipping-last-name')?.value,
            address1: document.getElementById('shipping-address1')?.value,
            city: document.getElementById('shipping-city')?.value,
            country: document.getElementById('shipping-country')?.value,
            zip: document.getElementById('shipping-zip')?.value
        };

        try {
            const response = await fetch(
                `https://${shop}/apps/edit/update-shipping-address`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        calculatedOrderId: calculatedOrderIdVar,
                        shippingAddress: shippingAddress,
                        shop: shop
                    })
                }
            );

            const data = await response.json();
            console.log("UPDATE SHIPPING ADDRESS RESPONSE:", data);

            if (data.success) {
                currentOrder.shipping_address = shippingAddress;
                showSuccessMessage("Shipping address updated");
            }

        } catch (error) {
            console.error("UPDATE SHIPPING ADDRESS ERROR:", error);
        }
    };

    // Function to save all changes
    window.saveAllChanges = async () => {
        if (!isEditing || !calculatedOrderIdVar) {
            alert("Please enable edit mode first");
            return;
        }

        try {
            // First commit the changes
            const commitResponse = await fetch(
                `https://${shop}/apps/edit/commit-changes`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        calculatedOrderId: calculatedOrderIdVar,
                        shop: shop
                    })
                }
            );

            const commitData = await commitResponse.json();
            console.log("COMMIT RESPONSE:", commitData);

            if (commitData.success) {
                // Clear localStorage
                localStorage.removeItem("calculatedOrderId");
                calculatedOrderIdVar = null;
                isEditing = false;

                alert("All changes saved successfully!");

                // Reload the page to show updated order
                window.location.reload();
            } else {
                alert("Failed to save changes: " + (commitData.message || "Unknown error"));
            }

        } catch (error) {
            console.error("SAVE ALL CHANGES ERROR:", error);
            alert("Error saving changes: " + error.message);
        }
    };

    // Function to discard changes
    window.discardChanges = () => {
        if (confirm("Are you sure you want to discard all changes? This cannot be undone.")) {
            localStorage.removeItem("calculatedOrderId");
            calculatedOrderIdVar = null;
            isEditing = false;
            window.location.reload();
        }
    };

    // Helper function to show success messages
    function showSuccessMessage(message) {
        const messageDiv = document.createElement('div');
        messageDiv.className = 'success-message';
        messageDiv.textContent = message;
        messageDiv.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #4CAF50;
            color: white;
            padding: 10px 20px;
            border-radius: 4px;
            z-index: 1000;
            animation: slideIn 0.3s ease;
        `;

        document.body.appendChild(messageDiv);

        setTimeout(() => {
            messageDiv.remove();
        }, 3000);
    }

    // Fetch products
    const fetchProducts = async () => {
        const response = await fetch(
            `https://${shop}/apps/edit/get-Products/${shop}`
        );
        const data = await response.json();
        console.log("FETCH PRODUCTS RESPONSE:", data.data);
        return data.data || [];
    };

    // Fetch order
    const fetchOrder = async () => {
        const response = await fetch(
            `https://${shop}/apps/edit/get-Orders/${shop}/${orderId}`
        );
        return await response.json();
    };

    // Load order data
    async function loadOrderData() {
        try {
            const orderRes = await fetchOrder();

            if (orderRes.message && orderRes.success === false) {
                throw new Error(orderRes.message);
            }

            if (!orderRes?.order) {
                throw new Error("Order not found");
            }

            currentOrder = orderRes.order;

        } catch (error) {
            console.error("Error loading order:", error);
            document.body.innerHTML = `<div class="error-message">${error.message}</div>`;
        }
    }

    // Render order page
    function renderOrderPage() {
        if (!currentOrder) return;

        const body = document.querySelector("body");

        // Create product options HTML
        let productOptionsHTML = '<option value="">Select a product</option>';
        products.forEach(product => {
            product.node.variants.edges.forEach(variant => {
                productOptionsHTML += `
                    <option value="${variant.node.id}">
                        ${product.node.title} (Variant)
                    </option>
                `;
            });
        });

        const pageHTML = `
            <div class="order-edit-wrapper">
                <div class="order-header">
                    <div class="order-title">
                        ${isEditing ? '✏️ EDITING - ' : ''}Order #${currentOrder.order_number}
                        ${isEditing ? `<span class="edit-badge">Edit Mode Active</span>` : ''}
                    </div>
                    
                    ${isEditing ? `
                        <div class="edit-info">
                            <p><strong>Calculated Order ID:</strong> ${calculatedOrderIdVar}</p>
                            <p class="edit-notice">All changes are being tracked. Click "Save All Changes" when done.</p>
                        </div>
                    ` : ''}
                </div>

                <div class="order-section">
                    ${!isEditing ? `
                        <button class="edit-btn" onClick="orderEditBegin('${orderId}')">
                            Start Editing This Order
                        </button>
                    ` : ''}
                    
                    <h3>Order Summary</h3>
                    <div class="summary-grid">
                        <div class="summary-item">
                            <label>Total:</label>
                            <span class="summary-value">${currentOrder.total_price} ${currentOrder.currency}</span>
                        </div> 
                    </div>
                </div>

                <div class="order-section">
                    <h3>Customer Information</h3>
                    <div class="editable-fields">
                        <div class="field-group">
                            <label for="customer-first-name">First Name:</label>
                            ${isEditing ? `
                                <input type="text" 
                                       id="customer-first-name" 
                                       class="editable-input"
                                       value="${currentOrder.customer.first_name}"
                                       onchange="updateCustomerInfo()">
                            ` : `
                                <span>${currentOrder.customer.first_name}</span>
                            `}
                        </div>
                        <div class="field-group">
                            <label for="customer-last-name">Last Name:</label>
                            ${isEditing ? `
                                <input type="text" 
                                       id="customer-last-name" 
                                       class="editable-input"
                                       value="${currentOrder.customer.last_name}"
                                       onchange="updateCustomerInfo()">
                            ` : `
                                <span>${currentOrder.customer.last_name}</span>
                            `}
                        </div>
                        <div class="field-group">
                            <label for="customer-email">Email:</label>
                            ${isEditing ? `
                                <input type="email" 
                                       id="customer-email" 
                                       class="editable-input"
                                       value="${currentOrder.customer.email}"
                                       onchange="updateCustomerInfo()">
                            ` : `
                                <span>${currentOrder.customer.email}</span>
                            `}
                        </div>
                    </div>
                </div>

                <div class="order-section">
                    <h3>Line Items ${isEditing ? `<span class="add-product-btn" id="add-product-trigger">+ Add Product</span>` : ''}</h3>
                    
                    ${isEditing ? `
                        <div class="add-product-form" id="add-product-form" style="display: none;">
                            <div class="form-row">
                                <select id="product-select" class="product-select">
                                    ${productOptionsHTML}
                                </select>
                                <input type="number" 
                                       id="product-quantity" 
                                       class="quantity-input" 
                                       value="1" 
                                       min="1"
                                       placeholder="Qty">
                                <button onclick="addSelectedProduct()" class="add-btn">
                                    Add to Order
                                </button>
                            </div>
                        </div>
                    ` : ''}
                    
                    <div class="line-items-list">
                        ${currentOrder.line_items.map(item => `
                            <div class="line-item" data-item-id="${item.id}">
                                <div class="item-info">
                                    <div class="item-title">${item.title}</div>
                                    <div class="item-price">${item.price} ${currentOrder.currency}</div>
                                </div>
                                <div class="item-actions">
                                    ${isEditing ? `
                                        <div class="quantity-control">
                                            <input type="number" 
                                                   class="qty-input"
                                                   value="${item.quantity}"
                                                   min="0"
                                                   onchange="updateLineItemQuantity('${item.shopify_line_item_id}', this.value)">
                                            </div>
                                        <button class="remove-btn" onclick="removeLineItem('${item.id}')">
                                            Remove
                                        </button>
                                    ` : `
                                        <div class="quantity-display">Qty: ${item.quantity}</div>
                                    `}
                                </div>
                            </div>
                        `).join("")}
                    </div>
                </div>

                <div class="order-section">
                    <h3>Shipping Address</h3>
                    <div class="editable-fields">
                        <div class="field-row">
                            <div class="field-group">
                                <label for="shipping-first-name">First Name:</label>
                                ${isEditing ? `
                                    <input type="text" 
                                           id="shipping-first-name" 
                                           class="editable-input"
                                           value="${currentOrder.shipping_address.first_name}"
                                           onchange="updateShippingAddress()">
                                ` : `
                                    <span>${currentOrder.shipping_address.first_name}</span>
                                `}
                            </div>
                            <div class="field-group">
                                <label for="shipping-last-name">Last Name:</label>
                                ${isEditing ? `
                                    <input type="text" 
                                           id="shipping-last-name" 
                                           class="editable-input"
                                           value="${currentOrder.shipping_address.last_name}"
                                           onchange="updateShippingAddress()">
                                ` : `
                                    <span>${currentOrder.shipping_address.last_name}</span>
                                `}
                            </div>
                        </div>
                        <div class="field-group">
                            <label for="shipping-address1">Address:</label>
                            ${isEditing ? `
                                <input type="text" 
                                       id="shipping-address1" 
                                       class="editable-input"
                                       value="${currentOrder.shipping_address.address1}"
                                       onchange="updateShippingAddress()">
                            ` : `
                                <span>${currentOrder.shipping_address.address1}</span>
                            `}
                        </div>
                        <div class="field-row">
                            <div class="field-group">
                                <label for="shipping-city">City:</label>
                                ${isEditing ? `
                                    <input type="text" 
                                           id="shipping-city" 
                                           class="editable-input"
                                           value="${currentOrder.shipping_address.city}"
                                           onchange="updateShippingAddress()">
                                ` : `
                                    <span>${currentOrder.shipping_address.city}</span>
                                `}
                            </div>
                            <div class="field-group">
                                <label for="shipping-country">Country:</label>
                                ${isEditing ? `
                                    <input type="text" 
                                           id="shipping-country" 
                                           class="editable-input"
                                           value="${currentOrder.shipping_address.country}"
                                           onchange="updateShippingAddress()">
                                ` : `
                                    <span>${currentOrder.shipping_address.country}</span>
                                `}
                            </div>
                            <div class="field-group">
                                <label for="shipping-zip">ZIP Code:</label>
                                ${isEditing ? `
                                    <input type="text" 
                                           id="shipping-zip" 
                                           class="editable-input"
                                           value="${currentOrder.shipping_address.zip}"
                                           onchange="updateShippingAddress()">
                                ` : `
                                    <span>${currentOrder.shipping_address.zip}</span>
                                `}
                            </div>
                        </div>
                    </div>
                </div>

                <div class="action-buttons">
                    <button onclick="cancelEdit()" class="cancel-btn">
                        ${isEditing ? 'Cancel Edit' : 'Back to Store'}
                    </button>
                    
                    ${isEditing ? `
                        <button class="discard-btn" onclick="discardEdit()">
                            Discard All Changes
                        </button>
                        <button class="save-btn" onclick="saveAllChanges()">
                            Save All Changes
                        </button>
                    ` : ''}
                </div>
            </div> 
        `;

        body.innerHTML = pageHTML;

        // Add event listener for add product trigger
        const addProductTrigger = document.getElementById('add-product-trigger');
        const addProductForm = document.getElementById('add-product-form');

        if (addProductTrigger && addProductForm) {
            addProductTrigger.addEventListener('click', () => {
                const isVisible = addProductForm.style.display !== 'none';
                addProductForm.style.display = isVisible ? 'none' : 'block';
            });
        }
    }

    // Helper function to add selected product
    window.addSelectedProduct = async () => {
        const productSelect = document.getElementById('product-select');
        const quantityInput = document.getElementById('product-quantity');

        if (!productSelect || !quantityInput) return;

        const variantId = productSelect.value;
        const quantity = parseInt(quantityInput.value) || 1;

        if (!variantId) {
            alert("Please select a product");
            return;
        }

        await addProductToOrder(variantId, quantity);

        // Reset form
        productSelect.value = '';
        quantityInput.value = '1';
        document.getElementById('add-product-form').style.display = 'none';
    };

    // Initialize page
    async function initialize() {
        try {
            // Load products and order data in parallel
            const [productsData, orderData] = await Promise.all([
                fetchProducts(),
                loadOrderData()
            ]);

            products = productsData;

            if (currentOrder) {
                renderOrderPage();
            }

        } catch (error) {
            console.error("Initialization error:", error);
            document.body.innerHTML = `
                <div class="error-message">
                    Error loading order: ${error.message}
                </div>
            `;
        }
    }

    // Start initialization
    initialize();
});