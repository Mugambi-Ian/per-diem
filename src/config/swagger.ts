import {OpenAPIObject} from "openapi3-ts/oas31";

export const swaggerSpec: OpenAPIObject = {
    openapi: "3.1.0",
    info: {
        title: "Per Diem API",
        description: "API docs for Per Diem coding challenge",
        version: "1.0.0",
    },
    servers: [
        {
            url: "http://localhost:3000/api/v1",
            description: "Local dev server",
        },
    ],
    paths: {
        "/auth/register": {
            post: {
                "tags": ["Auth"],
                summary: "Create a new account",
                requestBody: {
                    required: true,
                    content: {
                        "application/json": {
                            schema: {
                                type: "object",
                                properties: {
                                    email: {type: "string", format: "email"},
                                    password: {type: "string", minLength: 8},
                                    fullName: {type: "string", minLength: 2},
                                },
                                required: ["email", "password", "fullName"],
                            },
                        },
                    },
                },
                responses: {
                    "201": {description: "User created"},
                    "400": {description: "Validation error"},
                },
            },
        },
        "/auth/login": {
            post: {
                "tags": ["Auth"],
                summary: "Login and receive tokens",
                requestBody: {
                    required: true,
                    content: {
                        "application/json": {
                            schema: {
                                type: "object",
                                properties: {
                                    email: {type: "string", format: "email"},
                                    password: {type: "string"},
                                },
                                required: ["email", "password"],
                            },
                        },
                    },
                },
                responses: {
                    "200": {description: "Login success"},
                    "401": {description: "Invalid credentials"},
                },
            },
        },
        "/auth/refresh": {
            post: {
                "tags": ["Auth"],
                summary: "Refresh access token",
                responses: {
                    "200": {description: "New access token"},
                    "401": {description: "Invalid refresh token"},
                },
            },
        },
        "/auth/logout": {


            post: {
                "tags": ["Auth"],
                summary: "Logout access token",
            },
        },
        "/user": {
            get: {
                "tags": ["Auth"],
                summary: "user",

            },
        },
        "/stores": {
            "get": {
                "summary": "Get stores",
                "description": "Returns a list of stores. Supports search, pagination, sorting, and geolocation filters.",
                "tags": ["Stores"],
                "parameters": [
                    {
                        "in": "query",
                        "name": "q",
                        "schema": {"type": "string"},
                        "required": false,
                        "description": "Search stores by partial match on name, slug, or address."
                    },
                    {
                        "in": "query",
                        "name": "page",
                        "schema": {"type": "integer", "minimum": 1, "default": 1},
                        "required": false,
                        "description": "Page number for pagination."
                    },
                    {
                        "in": "query",
                        "name": "limit",
                        "schema": {"type": "integer", "minimum": 1, "maximum": 100, "default": 10},
                        "required": false,
                        "description": "Number of results per page."
                    },
                    {
                        "in": "query",
                        "name": "sort",
                        "schema": {
                            "type": "string",
                            "enum": ["name", "createdAt", "distance"]
                        },
                        "required": false,
                        "description": "Sort results by name, creation date, or distance (requires lat/lng)."
                    },
                    {
                        "in": "query",
                        "name": "lat",
                        "schema": {"type": "number", "format": "float"},
                        "required": false,
                        "description": "Latitude for nearby search."
                    },
                    {
                        "in": "query",
                        "name": "lng",
                        "schema": {"type": "number", "format": "float"},
                        "required": false,
                        "description": "Longitude for nearby search."
                    },
                    {
                        "in": "query",
                        "name": "radius",
                        "schema": {"type": "number", "format": "float"},
                        "required": false,
                        "description": "Search radius in kilometers (requires lat/lng)."
                    }
                ],
                "responses": {
                    "200": {
                        "description": "A paginated list of stores with enriched details.",
                        "content": {
                            "application/json": {
                                "schema": {
                                    "type": "object",
                                    "properties": {
                                        "page": {"type": "integer"},
                                        "limit": {"type": "integer"},
                                        "total": {"type": "integer"},
                                        "stores": {
                                            "type": "array",
                                            "items": {"$ref": "#/components/schemas/StoreResponse"}
                                        }
                                    }
                                }
                            }
                        }
                    },
                    "400": {
                        "description": "Invalid query parameters",
                        "content": {
                            "application/json": {
                                "schema": {"$ref": "#/components/schemas/ErrorResponse"}
                            }
                        }
                    },
                    "500": {
                        "description": "Server error",
                        "content": {
                            "application/json": {
                                "schema": {"$ref": "#/components/schemas/ErrorResponse"}
                            }
                        }
                    }
                }
            },
            "post": {
                "summary": "Create a store",
                "description": "Creates a new store with its operating hours.",
                "tags": ["Stores"],
                "requestBody": {
                    "required": true,
                    "content": {
                        "application/json": {
                            "schema": {"$ref": "#/components/schemas/StoreInput"}
                        }
                    }
                },
                "responses": {
                    "201": {
                        "description": "Store created successfully",
                        "content": {
                            "application/json": {
                                "schema": {"$ref": "#/components/schemas/StoreResponse"}
                            }
                        }
                    },
                    "400": {
                        "description": "Invalid request payload or invalid timezone",
                        "content": {
                            "application/json": {
                                "schema": {"$ref": "#/components/schemas/ErrorResponse"}
                            }
                        }
                    },
                    "500": {
                        "description": "Server error",
                        "content": {
                            "application/json": {
                                "schema": {"$ref": "#/components/schemas/ErrorResponse"}
                            }
                        }
                    }
                }
            }
        },
        "/stores/{id}": {
            "get": {
                "summary": "Get store by ID",
                "tags": ["Stores"],
                "parameters": [
                    {
                        "in": "path",
                        "name": "id",
                        "required": true,
                        "schema": {"type": "string"},
                        "description": "Unique identifier of the store"
                    }
                ],
                "responses": {
                    "200": {
                        "description": "Store details",
                        "content": {
                            "application/json": {
                                "schema": {"$ref": "#/components/schemas/StoreResponse"}
                            }
                        }
                    },
                    "404": {
                        "description": "Store not found",
                        "content": {
                            "application/json": {
                                "schema": {"$ref": "#/components/schemas/ErrorResponse"}
                            }
                        }
                    },
                    "500": {
                        "description": "Server error",
                        "content": {
                            "application/json": {
                                "schema": {"$ref": "#/components/schemas/ErrorResponse"}
                            }
                        }
                    }
                }
            },
            "put": {
                "summary": "Update store by ID",
                "tags": ["Stores"],
                "parameters": [
                    {
                        "in": "path",
                        "name": "id",
                        "required": true,
                        "schema": {"type": "string"},
                        "description": "Unique identifier of the store"
                    }
                ],
                "requestBody": {
                    "required": true,
                    "content": {
                        "application/json": {
                            "schema": {"$ref": "#/components/schemas/StoreInput"}
                        }
                    }
                },
                "responses": {
                    "200": {
                        "description": "Store updated successfully",
                        "content": {
                            "application/json": {
                                "schema": {"$ref": "#/components/schemas/StoreResponse"}
                            }
                        }
                    },
                    "400": {
                        "description": "Invalid request payload or invalid timezone",
                        "content": {
                            "application/json": {
                                "schema": {"$ref": "#/components/schemas/ErrorResponse"}
                            }
                        }
                    },
                    "404": {
                        "description": "Store not found",
                        "content": {
                            "application/json": {
                                "schema": {"$ref": "#/components/schemas/ErrorResponse"}
                            }
                        }
                    },
                    "500": {
                        "description": "Server error",
                        "content": {
                            "application/json": {
                                "schema": {"$ref": "#/components/schemas/ErrorResponse"}
                            }
                        }
                    }
                }
            },
            "delete": {
                "summary": "Delete store by ID",
                "tags": ["Stores"],
                "parameters": [
                    {
                        "in": "path",
                        "name": "id",
                        "required": true,
                        "schema": {"type": "string"},
                        "description": "Unique identifier of the store"
                    }
                ],
                "responses": {
                    "204": {
                        "description": "Store deleted successfully"
                    },
                    "404": {
                        "description": "Store not found",
                        "content": {
                            "application/json": {
                                "schema": {"$ref": "#/components/schemas/ErrorResponse"}
                            }
                        }
                    },
                    "500": {
                        "description": "Server error",
                        "content": {
                            "application/json": {
                                "schema": {"$ref": "#/components/schemas/ErrorResponse"}
                            }
                        }
                    }
                }
            }
        },
        "/stores/{storeId}/products": {
            "post": {
                "summary": "Create a product for a store",
                "tags": ["Products"],
                "parameters": [
                    {
                        "in": "path",
                        "name": "storeId",
                        "required": true,
                        "schema": {"type": "string"},
                        "description": "Unique identifier of the store"
                    }
                ],
                "requestBody": {
                    "required": true,
                    "content": {
                        "application/json": {
                            "schema": {"$ref": "#/components/schemas/ProductInput"}
                        }
                    }
                },
                "responses": {
                    "201": {
                        "description": "Product created successfully (with availability gap report)",
                        "content": {
                            "application/json": {
                                "schema": {
                                    "type": "object",
                                    "properties": {
                                        "success": {"type": "boolean", "example": true},
                                        "data": {
                                            "type": "object",
                                            "properties": {
                                                "product": {"$ref": "#/components/schemas/ProductResponse"},
                                                "gaps": {
                                                    "type": "array",
                                                    "description": "Detected availability gaps for the product",
                                                    "items": {
                                                        "type": "object",
                                                        "properties": {
                                                            "dayOfWeek": {"type": "integer", "example": 1},
                                                            "startTime": {"type": "string", "example": "10:00"},
                                                            "endTime": {"type": "string", "example": "12:00"}
                                                        }
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    },
                    "400": {
                        "description": "Validation error (invalid body or overlapping availability)",
                        "content": {
                            "application/json": {
                                "schema": {"$ref": "#/components/schemas/ErrorResponse"}
                            }
                        }
                    },
                    "403": {"description": "Unauthorized"},
                    "404": {
                        "description": "Store not found",
                        "content": {
                            "application/json": {
                                "schema": {"$ref": "#/components/schemas/ErrorResponse"}
                            }
                        }
                    },
                    "500": {"description": "Server error"}
                }
            },
            "get": {
                "summary": "List products for a store",
                "tags": ["Products"],
                "parameters": [
                    {
                        "in": "path",
                        "name": "storeId",
                        "required": true,
                        "schema": {"type": "string"},
                        "description": "Unique identifier of the store"
                    },
                    {
                        "in": "query",
                        "name": "page",
                        "schema": {"type": "integer", "minimum": 1, "default": 1},
                        "required": false,
                        "description": "Page number for pagination"
                    },
                    {
                        "in": "query",
                        "name": "limit",
                        "schema": {"type": "integer", "minimum": 1, "maximum": 100, "default": 20},
                        "required": false,
                        "description": "Number of products per page"
                    }
                ],
                "responses": {
                    "200": {
                        "description": "Paginated list of products",
                        "content": {
                            "application/json": {
                                "schema": {
                                    "type": "object",
                                    "properties": {
                                        "page": {"type": "integer"},
                                        "limit": {"type": "integer"},
                                        "total": {"type": "integer"},
                                        "products": {
                                            "type": "array",
                                            "items": {"$ref": "#/components/schemas/ProductResponse"}
                                        }
                                    }
                                }
                            }
                        }
                    },
                    "404": {"description": "Store not found"},
                    "500": {"description": "Server error"}
                }
            }
        },

        "/stores/{storeId}/products/{productId}": {
            "get": {
                "summary": "Get a product by ID",
                "tags": ["Products"],
                "parameters": [
                    {
                        "in": "path",
                        "name": "storeId",
                        "required": true,
                        "schema": {"type": "string"},
                        "description": "Unique identifier of the store"
                    },
                    {
                        "in": "path",
                        "name": "productId",
                        "required": true,
                        "schema": {"type": "string"},
                        "description": "Unique identifier of the product"
                    }
                ],
                "responses": {
                    "200": {
                        "description": "Product details",
                        "content": {
                            "application/json": {
                                "schema": {
                                    "type": "object",
                                    "properties": {
                                        "success": {"type": "boolean", "example": true},
                                        "data": {"$ref": "#/components/schemas/ProductResponse"}
                                    }
                                }
                            }
                        }
                    },
                    "400": {
                        "description": "Missing or invalid parameters",
                        "content": {
                            "application/json": {
                                "schema": {"$ref": "#/components/schemas/ErrorResponse"}
                            }
                        }
                    },
                    "404": {
                        "description": "Product not found",
                        "content": {
                            "application/json": {
                                "schema": {"$ref": "#/components/schemas/ErrorResponse"}
                            }
                        }
                    },
                    "500": {"description": "Server error"}
                }
            },
            "put": {
                "summary": "Update a product",
                "tags": ["Products"],
                "parameters": [
                    {"in": "path", "name": "storeId", "required": true, "schema": {"type": "string"}},
                    {"in": "path", "name": "productId", "required": true, "schema": {"type": "string"}}
                ],
                "requestBody": {
                    "required": true,
                    "content": {
                        "application/json": {
                            "schema": {"$ref": "#/components/schemas/ProductInput"}
                        }
                    }
                },
                "responses": {
                    "200": {
                        "description": "Product updated successfully",
                        "content": {
                            "application/json": {
                                "schema": {"$ref": "#/components/schemas/ProductResponse"}
                            }
                        }
                    },
                    "400": {"description": "Validation error"},
                    "403": {"description": "Unauthorized"},
                    "404": {"description": "Store or product not found"},
                    "500": {"description": "Server error"}
                }
            },
            "delete": {
                "summary": "Delete a product",
                "tags": ["Products"],
                "parameters": [
                    {"in": "path", "name": "storeId", "required": true, "schema": {"type": "string"}},
                    {"in": "path", "name": "productId", "required": true, "schema": {"type": "string"}}
                ],
                "responses": {
                    "204": {"description": "Product deleted successfully"},
                    "403": {"description": "Unauthorized"},
                    "404": {"description": "Store or product not found"},
                    "500": {"description": "Server error"}
                }
            }
        }


    },
    "components": {
        "schemas": {
            "StoreInput": {
                "type": "object",
                "required": ["name", "slug", "address", "timezone", "lat", "lng", "operatingHours"],
                "properties": {
                    "name": {"type": "string", "minLength": 2},
                    "slug": {"type": "string", "minLength": 2},
                    "address": {"type": "string", "minLength": 2},
                    "timezone": {"type": "string", "example": "America/New_York"},
                    "lat": {"type": "number", "example": 407128},
                    "lng": {"type": "number", "example": -740060},
                    "operatingHours": {
                        "type": "array",
                        "items": {"$ref": "#/components/schemas/OperatingHour"}
                    }
                }
            },
            "OperatingHour": {
                "type": "object",
                "required": ["dayOfWeek", "openTime", "closeTime", "isOpen", "closesNextDay", "dstAware"],
                "properties": {
                    "dayOfWeek": {
                        "type": "integer",
                        "minimum": 0,
                        "maximum": 6,
                        "description": "0 = Sunday, 6 = Saturday",
                        "example": 1
                    },
                    "openTime": {"type": "string", "pattern": "^\\d{2}:\\d{2}$", "example": "09:00"},
                    "closeTime": {"type": "string", "pattern": "^\\d{2}:\\d{2}$", "example": "21:00"},
                    "isOpen": {"type": "boolean", "example": true},
                    "closesNextDay": {"type": "boolean", "example": false},
                    "dstAware": {"type": "boolean", "example": true}
                }
            },
            "StoreResponse": {
                "type": "object",
                "properties": {
                    "id": {"type": "string"},
                    "name": {"type": "string"},
                    "slug": {"type": "string"},
                    "address": {"type": "string"},
                    "timezone": {"type": "string"},
                    "lat": {"type": "number"},
                    "lng": {"type": "number"},
                    "currentLocalTime": {"type": "string", "format": "date-time"},
                    "isCurrentlyOpen": {"type": "boolean"},
                    "nextOpenTime": {
                        "type": "string",
                        "description": "Next time the store will open, if currently closed."
                    },
                    "distanceKm": {
                        "type": "number",
                        "description": "Distance in kilometers from provided lat/lng. Only present if lat/lng query is used."
                    }
                }
            },
            "ProductInput": {
                "type": "object",
                "required": ["name", "price"],
                "properties": {
                    "name": {"type": "string"},
                    "price": {"type": "number"},
                    "description": {"type": "string"},
                    "availability": {"type": "array", "items": {"$ref": "#/components/schemas/ProductAvailability"}},
                    "modifiers": {"type": "array", "items": {"$ref": "#/components/schemas/ProductModifier"}}
                }
            },
            "ProductResponse": {
                "type": "object",
                "properties": {
                    "id": {"type": "string"},
                    "storeId": {"type": "string"},
                    "name": {"type": "string"},
                    "price": {"type": "number"},
                    "description": {"type": "string"},
                    "availability": {"type": "array", "items": {"$ref": "#/components/schemas/ProductAvailability"}},
                    "modifiers": {"type": "array", "items": {"$ref": "#/components/schemas/ProductModifier"}},
                    "lastModified": {"type": "string", "format": "date-time"}
                }
            },
            "ProductAvailability": {
                "type": "object",
                "required": ["dayOfWeek", "startTime", "endTime", "timezone"],
                "properties": {
                    "dayOfWeek": {
                        "type": "array",
                        "items": {"type": "integer", "minimum": 0, "maximum": 6},
                        "description": "Days of the week (0=Sunday, 6=Saturday)"
                    },
                    "startTime": {"type": "string", "pattern": "^\\d{2}:\\d{2}$", "example": "09:00"},
                    "endTime": {"type": "string", "pattern": "^\\d{2}:\\d{2}$", "example": "17:00"},
                    "timezone": {"type": "string", "example": "America/New_York"},
                    "recurrenceRule": {
                        "type": "object",
                        "additionalProperties": true,
                        "description": "Optional recurrence rules (RFC 5545 style)"
                    },
                    "specialDates": {
                        "type": "array",
                        "items": {"type": "string", "format": "date-time"},
                        "description": "Special dates when availability differs"
                    }
                }
            },
            "ProductModifier": {
                "type": "object",
                "required": ["name"],
                "properties": {
                    "name": {"type": "string"},
                    "priceDelta": {"type": "number", "default": 0}
                }
            },
            "ErrorResponse": {
                "type": "object",
                "properties": {
                    "error": {"type": "string"}
                }
            }
        },
        securitySchemes: {
            csrf: {type: "apiKey", in: "header", name: "x-csrf-token"},
            bearerAuth: {
                type: "http",
                scheme: "bearer",
                bearerFormat: "JWT",
            },
        },
    },
    security: [{bearerAuth: []}],
};
