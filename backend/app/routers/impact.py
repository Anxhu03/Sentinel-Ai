from fastapi import APIRouter

from backend.app.impact import calculate_blast_radius

router = APIRouter(
    prefix="/api/impact",
    tags=["Impact Analysis"],
)

@router.get("/{service_name}")
def get_blast_radius(service_name: str):
    impacted = calculate_blast_radius(service_name)

    return {
        "root_failure": service_name,
        "blast_radius": len(impacted),
        "impacted_services": impacted,
    }
