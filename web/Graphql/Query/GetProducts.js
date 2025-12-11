export const GET_PRODUCTS = `
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
        `