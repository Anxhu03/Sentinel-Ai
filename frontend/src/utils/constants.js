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

export const CHAOS_INCIDENT_PRESETS = {
  db_down: {
    service: "order-service",
    title: "PostgreSQL Database Connection Refused",
    description: "Order service cannot access the PostgreSQL database pool. Connections rejected.",
    root_cause: "Database connectivity failure affecting the order-service connection pool",
    confidence: 97,
    severity: "critical",
    risk_score: 85,
    blast_radius: 3,
    impacted_services: ["order-service", "shipping-service", "notification-service"],
    recommendation: "Restore PostgreSQL connectivity, verify health check, and restart order-service pool.",
    evidence: [
      { type: "database_failure", message: "Possible database connectivity or pool exhaustion detected." },
      { type: "connection_refused", message: "Socket connection to postgres:5432 timed out after 3000ms." },
    ],
    logs: "2026-09-11T17:24:19.722Z ERROR order-service\nDatabase connection failed.\nConnection refused.\nDatabase dependency unavailable.\nRequest processing aborted.",
  },
  payment_failure: {
    service: "payment-service",
    title: "Payment Gateway 504 Timeout",
    description: "Payment gateway timeout. Circuit breaker tripped and worker pool exhausted.",
    root_cause: "Payment provider communication failure or payment-service request timeout.",
    confidence: 94,
    severity: "high",
    risk_score: 75,
    blast_radius: 3,
    impacted_services: ["payment-service", "order-service", "notification-service"],
    recommendation: "Verify the payment provider, inspect timeout rates, and restart payment worker pool.",
    evidence: [
      { type: "timeout", message: "Request timeout or elevated latency detected." },
      { type: "circuit_breaker", message: "Circuit breaker status: OPEN for external PSP gateway." },
    ],
    logs: "2026-09-11T17:24:01.931Z ERROR payment-service\nPayment gateway request failed.\nPayment transaction timeout.\nUpstream payment dependency unavailable.\nTransaction rejected.",
  },
  order_crash: {
    service: "order-service",
    title: "Order Service Container CrashLoopBackOff",
    description: "Order service container became unavailable due to unhandled exception.",
    root_cause: "Unhandled exception during checkout workflow orchestration causing container exit 137.",
    confidence: 95,
    severity: "critical",
    risk_score: 90,
    blast_radius: 4,
    impacted_services: ["order-service", "shipping-service", "notification-service", "payment-service"],
    recommendation: "Restart order-service container and rollback to previous stable deployment.",
    evidence: [
      { type: "container_exit", message: "Process terminated unexpectedly with exit code 137." },
      { type: "health_check_failed", message: "HTTP GET /health returned 503 Service Unavailable." },
    ],
    logs: "2026-09-11T17:25:30.112Z FATAL order-service\nContainer received SIGTERM (OOM/CrashLoop)\nCheckout state corrupted\nAborting process lifecycle.",
  },
  api_failure: {
    service: "product-service",
    title: "Product Catalog API 500 Failure Spike",
    description: "Product API is returning unhealthy 500 Internal Server Error responses.",
    root_cause: "Cache invalidation storm causing database lock contention in product-service.",
    confidence: 91,
    severity: "high",
    risk_score: 65,
    blast_radius: 3,
    impacted_services: ["product-service", "order-service", "inventory-service"],
    recommendation: "Warm the product catalog Redis cache and scale product-service pods.",
    evidence: [
      { type: "http_500", message: "Error rate spiked above 14% on /api/v1/products." },
      { type: "cache_miss", message: "Redis cache miss rate reached 98.4%." },
    ],
    logs: "2026-09-11T17:25:34.410Z ERROR product-service\nHTTP 500 Internal Server Error on GET /api/v1/products\nCache backend unresponsive\nRequest queue saturated.",
  },
  cpu_spike: {
    service: "order-service",
    title: "CPU Compute Saturation Spike (99.4%)",
    description: "Order service CPU utilization is abnormally high, throttling request throughput.",
    root_cause: "Catastrophic regex backtracking in order search query causing CPU saturation.",
    confidence: 93,
    severity: "high",
    risk_score: 70,
    blast_radius: 2,
    impacted_services: ["order-service", "shipping-service"],
    recommendation: "Scale order-service to multiple replicas and apply patched query indexing.",
    evidence: [
      { type: "cpu_saturation", message: "Container CPU usage reached 99.4%." },
      { type: "latency_degradation", message: "P99 latency degraded from 85ms to 2400ms." },
    ],
    logs: "2026-09-11T17:25:38.802Z WARN order-service\nCPU usage 99.4% (throttled 420ms/sec)\nWorker threads unresponsive\nLatency threshold breached.",
  },
  memory_leak: {
    service: "payment-service",
    title: "Payment Service Memory Leak OutOfMemory",
    description: "Payment service memory utilization is abnormally high, leading to impending OOM kill.",
    root_cause: "Unbounded session cache growth in TLS connection pool causing memory leak.",
    confidence: 92,
    severity: "high",
    risk_score: 80,
    blast_radius: 3,
    impacted_services: ["payment-service", "order-service"],
    recommendation: "Flush TLS connection cache and restart payment-service container.",
    evidence: [
      { type: "memory_saturation", message: "Container memory reached 94.8% of 512MB limit." },
      { type: "gc_pause", message: "Garbage collection stop-the-world pauses exceeding 2200ms." },
    ],
    logs: "2026-09-11T17:25:42.204Z ERROR payment-service\nMemory usage: 94.8% (485MB/512MB)\nGC pause time: 2200ms\nImpending OutOfMemoryError.",
  },
}
