window.addEventListener("DOMContentLoaded", () => {
    const url = window.location.href;

    // Try to extract from `/edit/:orderId`
    let orderId = url.split("/").pop();

    // If query parameter style, override
    const queryParam = new URL(window.location.href).searchParams.get("orderId");

    if (queryParam) {
        orderId = queryParam;
    }

    console.log("Final Order ID:", orderId);

    const body = document.querySelector("body");
    if (orderId) {
        const h1 = document.createElement("h1");
        h1.textContent = "Edit Order " + orderId;
        body.appendChild(h1);
    }
});
