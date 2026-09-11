/**
 * Sentinel AI - Default Microservices Topology & Fleet Constants
 *
 * Provides resilient fallback definitions for the 7 core microservices and
 * their directed dependency topology so that Services and Dependencies tabs
 * render cleanly and interactively across all environments.
 */

export const DEFAULT_SERVICES = [
  {
    id: 1,
    name: "auth-service",
    status: "healthy",
    description: "Handles user authentication, JWT issuance, session validation, and RBAC identity flows.",
    is_active: true,
  },
  {
    id: 2,
    name: "product-service",
    status: "healthy",
    description: "Serves microservices product catalog, pricing matrices, inventory indexing, and metadata.",
    is_active: true,
  },
  {
    id: 3,
    name: "inventory-service",
    status: "healthy",
    description: "Manages real-time stock availability, warehouse reservation locks, and replenishment sync.",
    is_active: true,
  },
  {
    id: 4,
    name: "payment-service",
    status: "healthy",
    description: "Processes payment transactions, PSP circuit breaker routing, and credit reconciliation.",
    is_active: true,
  },
  {
    id: 5,
    name: "order-service",
    status: "healthy",
    description: "Coordinates order lifecycle state transitions, checkout orchestration, and fulfillment.",
    is_active: true,
  },
  {
    id: 6,
    name: "shipping-service",
    status: "healthy",
    description: "Dispatches carrier logistics, manifest generation, and shipment delivery tracking.",
    is_active: true,
  },
  {
    id: 7,
    name: "notification-service",
    status: "healthy",
    description: "Handles transactional notifications, Webhook events, and customer SMS/Email dispatching.",
    is_active: true,
  },
]

export const DEFAULT_DEPENDENCY_GRAPH = {
  services: [
    "auth-service",
    "product-service",
    "inventory-service",
    "payment-service",
    "order-service",
    "shipping-service",
    "notification-service",
  ],
  dependencies: [
    { service: "inventory-service", depends_on: "product-service" },
    { service: "payment-service", depends_on: "auth-service" },
    { service: "order-service", depends_on: "auth-service" },
    { service: "order-service", depends_on: "product-service" },
    { service: "order-service", depends_on: "inventory-service" },
    { service: "order-service", depends_on: "payment-service" },
    { service: "shipping-service", depends_on: "order-service" },
    { service: "shipping-service", depends_on: "inventory-service" },
    { service: "notification-service", depends_on: "order-service" },
    { service: "notification-service", depends_on: "payment-service" },
    { service: "notification-service", depends_on: "shipping-service" },
  ],
}
