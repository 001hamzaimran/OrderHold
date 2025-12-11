import shopify from "../shopify.js";

const getProducts = async (req, res) => {
    try {
        const { shop } = req.params;

        // Validate shop parameter
        if (!shop) {
            return res.status(400).json({
                success: false,
                error: "Shop parameter is required"
            });
        }

        const sessions = await shopify.config.sessionStorage.findSessionsByShop(shop);

        if (!sessions || sessions.length === 0) {
            return res.status(404).json({
                success: false,
                error: `No session found for shop: ${shop}`
            });
        }

        const session = sessions[0];

        const client = new shopify.api.clients.Graphql({ session });

        const query = `
            {
                products(first: 50) {
                    edges {
                        node {
                            id
                            title
                            tags
                            images(first: 1) {
                                edges {
                                    node {
                                        originalSrc
                                    }
                                }
                            }
                            variants(first: 1) {
                                edges {
                                    node {
                                        id
                                    }
                                }
                            }
                        }
                    }
                }
            }
        `;

        const response = await client.request(query);

        return res.status(200).json({
            success: true,
            data: response.data.products.edges || response,
            message: "Products fetched successfully"
        });

    } catch (error) {
        console.error("Error fetching products:", error);

        // Handle different types of errors
        if (error instanceof shopify.api.clients.GraphqlQueryError) {
            return res.status(400).json({
                success: false,
                error: "GraphQL query error",
                details: error.response?.errors || error.message
            });
        }

        if (error.code === 'UNAUTHORIZED' || error.statusCode === 401) {
            return res.status(401).json({
                success: false,
                error: "Unauthorized access to Shopify API"
            });
        }

        return res.status(500).json({
            success: false,
            error: "Failed to fetch products",
            message: error.message || "Internal server error"
        });
    }
};

export default getProducts;