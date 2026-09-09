from backend.app.dependencies import get_dependents


def calculate_blast_radius(service_name: str):
    impacted = []
    visited = {service_name}

    queue = [(service_name, 0)]

    while queue:
        current, current_distance = queue.pop(0)

        for dependent in get_dependents(current):
            if dependent not in visited:
                visited.add(dependent)

                distance = current_distance + 1

                impacted.append({
                    "service": dependent,
                    "distance": distance,
                })

                queue.append((dependent, distance))

    return impacted