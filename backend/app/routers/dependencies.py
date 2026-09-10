from fastapi import APIRouter

from backend.app.dependencies import SERVICE_DEPENDENCIES

router = APIRouter(
    prefix="/api/dependencies",
    tags=["Dependencies"],
)

@router.get("")
@router.get("/")
def get_dependency_graph():
    dependencies = []

    for service, service_dependencies in SERVICE_DEPENDENCIES.items():
        for dependency in service_dependencies:
            dependencies.append({
                "service": service,
                "depends_on": dependency,
            })

    return {
        "services": list(SERVICE_DEPENDENCIES.keys()),
        "dependencies": dependencies,
    }
