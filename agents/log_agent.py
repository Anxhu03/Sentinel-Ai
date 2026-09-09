from datetime import datetime, timezone


def analyze_logs(logs: str) -> dict:
    """
    Sentinel AI Log Analysis Agent.

    Detects common production failure signals from application,
    infrastructure, and service logs.

    This rule-based layer is intentionally deterministic so that
    Sentinel can produce reliable evidence before the future
    LLM/RAG reasoning layer is added.
    """

    if not logs or not logs.strip():
        return {
            "status": "no_data",
            "severity": "low",
            "issues": [],
            "summary": "No logs were provided for analysis.",
            "timestamp": datetime.now(timezone.utc).isoformat(),
        }

    logs_lower = logs.lower()

    issues = []
    severity = "low"

    def add_issue(issue_type: str, message: str, level: str):
        nonlocal severity

        issues.append({
            "type": issue_type,
            "message": message,
        })

        severity_order = {
            "low": 0,
            "medium": 1,
            "high": 2,
            "critical": 3,
        }

        if severity_order[level] > severity_order[severity]:
            severity = level

    # ---------------------------------------------------------
    # DATABASE FAILURES
    # ---------------------------------------------------------

    if any(keyword in logs_lower for keyword in [
        "database error",
        "database unavailable",
        "database down",
        "database connection failed",
        "db connection",
        "postgres",
        "postgresql",
        "sqlalchemy",
        "connection refused",
        "could not connect to database",
    ]):
        add_issue(
            "database_failure",
            "Possible database connectivity or database service failure detected.",
            "critical",
        )

    # ---------------------------------------------------------
    # TIMEOUTS / LATENCY
    # ---------------------------------------------------------

    if any(keyword in logs_lower for keyword in [
        "timeout",
        "timed out",
        "request timeout",
        "request latency increased",
        "latency increased",
        "slow response",
        "response time increased",
    ]):
        add_issue(
            "timeout",
            "Request timeout or elevated latency detected.",
            "high",
        )

    # ---------------------------------------------------------
    # HTTP / API FAILURES
    # ---------------------------------------------------------

    if any(keyword in logs_lower for keyword in [
        "500 internal server error",
        "status_code=500",
        "http 500",
        "http status 500",
        "internal server error",
        "http 502",
        "bad gateway",
        "http 503",
        "service unavailable",
        "http 504",
        "gateway timeout",
    ]):
        add_issue(
            "api_error",
            "HTTP/API service failure detected.",
            "critical",
        )

    # ---------------------------------------------------------
    # AUTHENTICATION FAILURES
    # ---------------------------------------------------------

    if any(keyword in logs_lower for keyword in [
        "authentication failed",
        "authorization failed",
        "unauthorized",
        "invalid token",
        "expired token",
        "login failed",
        "access denied",
    ]):
        add_issue(
            "authentication_failure",
            "Authentication or authorization failure detected.",
            "medium",
        )

    # ---------------------------------------------------------
    # MEMORY PROBLEMS
    # ---------------------------------------------------------

    if any(keyword in logs_lower for keyword in [
        "out of memory",
        "memoryerror",
        "memory leak",
        "memory exhaustion",
        "oom",
        "oom killed",
        "out-of-memory",
        "memory usage exceeded",
        "memory pressure",
    ]):
        add_issue(
            "memory_issue",
            "Possible memory exhaustion or memory leak detected.",
            "critical",
        )

    # ---------------------------------------------------------
    # CPU PROBLEMS
    # ---------------------------------------------------------

    if any(keyword in logs_lower for keyword in [
        "cpu spike",
        "high cpu",
        "cpu usage",
        "cpu utilization",
        "cpu utilization exceeded",
        "cpu usage exceeded",
        "high cpu utilization",
        "load average",
        "processor utilization",
        "system resource pressure",
    ]):
        add_issue(
            "cpu_issue",
            "High CPU utilization or system resource pressure detected.",
            "high",
        )

    # ---------------------------------------------------------
    # WORKER / QUEUE PRESSURE
    # ---------------------------------------------------------

    if any(keyword in logs_lower for keyword in [
        "worker queue growing",
        "queue growing",
        "queue depth increased",
        "worker backlog",
        "job backlog",
        "task backlog",
        "queue overflow",
    ]):
        add_issue(
            "worker_queue_pressure",
            "Worker or task queue pressure detected.",
            "high",
        )

    # ---------------------------------------------------------
    # REDIS / CACHE FAILURES
    # ---------------------------------------------------------

    if any(keyword in logs_lower for keyword in [
        "redis",
        "redis unavailable",
        "redis connection failed",
        "cache unavailable",
        "cache connection",
        "cache failure",
    ]):
        add_issue(
            "redis_failure",
            "Possible Redis or cache connectivity problem detected.",
            "high",
        )

    # ---------------------------------------------------------
    # DEPLOYMENT FAILURES
    # ---------------------------------------------------------

    if any(keyword in logs_lower for keyword in [
        "deployment failed",
        "deployment error",
        "deployment failure",
        "rollback",
        "release failed",
        "release error",
        "bad deployment",
        "new deployment unhealthy",
    ]):
        add_issue(
            "deployment_failure",
            "Possible deployment or release failure detected.",
            "critical",
        )

    # ---------------------------------------------------------
    # DISK / STORAGE
    # ---------------------------------------------------------

    if any(keyword in logs_lower for keyword in [
        "disk full",
        "disk space",
        "no space left on device",
        "storage full",
        "filesystem full",
        "storage pressure",
    ]):
        add_issue(
            "disk_failure",
            "Possible disk or storage capacity failure detected.",
            "critical",
        )

    # ---------------------------------------------------------
    # NETWORK FAILURES
    # ---------------------------------------------------------

    if any(keyword in logs_lower for keyword in [
        "network failure",
        "network unavailable",
        "network partition",
        "connection reset",
        "connection lost",
        "host unreachable",
        "network timeout",
        "dns failure",
        "dns resolution failed",
    ]):
        add_issue(
            "network_failure",
            "Possible network connectivity or partition detected.",
            "critical",
        )

    # ---------------------------------------------------------
    # SERVICE CRASH / AVAILABILITY
    # ---------------------------------------------------------

    if any(keyword in logs_lower for keyword in [
        "process crashed",
        "service crashed",
        "service unavailable",
        "became unavailable",
        "container stopped",
        "container exited",
        "process became unavailable",
        "health check failed",
        "healthcheck failed",
        "crashloop",
        "unexpectedly stopped",
    ]):
        add_issue(
            "service_failure",
            "Service availability or process failure detected.",
            "critical",
        )

    # ---------------------------------------------------------
    # ERROR / EXCEPTION SIGNALS
    # ---------------------------------------------------------

    if any(keyword in logs_lower for keyword in [
        "exception",
        "traceback",
        "fatal error",
        "critical error",
        "unhandled error",
        "unhandled exception",
    ]):
        add_issue(
            "application_error",
            "Application exception or fatal error detected.",
            "high",
        )

    # ---------------------------------------------------------
    # BUILD FINAL RESULT
    # ---------------------------------------------------------

    if issues:
        summary = (
            f"Sentinel detected {len(issues)} production signal(s). "
            f"Highest severity: {severity}."
        )

        status = "issues_detected"

    else:
        summary = (
            "No obvious production issues were detected "
            "in the provided logs."
        )

        status = "healthy"

    return {
        "status": status,
        "severity": severity,
        "issues": issues,
        "summary": summary,
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }