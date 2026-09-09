SERVICE_DEPENDENCIES = {
    "auth-service": [],
    "product-service": [],
    "inventory-service": ["product-service"],
    "payment-service": ["auth-service"],
    "order-service": ["auth-service", "product-service", "inventory-service", "payment-service"],
    "shipping-service": ["order-service", "inventory-service"],
    "notification-service": ["order-service", "payment-service", "shipping-service"],
}

def get_dependencies(service_name: str):
    return SERVICE_DEPENDENCIES.get(service_name, [])

def get_dependents(service_name: str):
    dependents = []
    for service, dependencies in SERVICE_DEPENDENCIES.items():
        if service_name in dependencies:
            dependents.append(service)
    return dependents
