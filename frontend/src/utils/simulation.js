/**
 * Sentinel AI - High-Fidelity Client-Side What-If Simulation Engine
 * 
 * Provides deterministic simulation of remediation actions (Restart, Rollback,
 * Restart Dependency, Scale) with probabilistic recovery modeling, risk scoring,
 * and memory-augmented learning boosts matching backend/app/simulation.py.
 */

export const REMEDIATION_ACTIONS = {
  restart_service: {
    name: "Restart Service",
    description: "Restart the affected service and verify recovery.",
    base_recovery: 0.92,
    base_risk: "Low",
    impact: "Low",
    estimated_seconds: 25,
  },
  rollback_deployment: {
    name: "Rollback Deployment",
    description: "Rollback the latest deployment to the previous stable version.",
    base_recovery: 0.96,
    base_risk: "Medium",
    impact: "Medium",
    estimated_seconds: 45,
  },
  restart_dependency: {
    name: "Restart Dependency",
    description: "Restart a critical dependency of the affected service.",
    base_recovery: 0.78,
    base_risk: "Medium",
    impact: "Medium",
    estimated_seconds: 40,
  },
  scale_service: {
    name: "Scale Service",
    description: "Increase service capacity to reduce resource pressure.",
    base_recovery: 0.84,
    base_risk: "Low",
    impact: "Low",
    estimated_seconds: 60,
  },
}

const RISK_SCORES = {
  Low: 20,
  Medium: 45,
  High: 75,
}

/**
 * Runs What-If decision simulation comparing remediation options.
 * 
 * @param {string} serviceName - Target service under analysis
 * @param {string} incidentType - Incident failure pattern
 * @param {Array<Record<string, any>>} memories - Historical incident memory records
 * @returns {Record<string, any>} Full What-If simulation report
 */
export function simulateWhatIfDecision(
  serviceName = "order-service",
  incidentType = "payment_failure",
  memories = []
) {
  const cleanMemories = Array.isArray(memories) ? memories : []
  const cleanType = (incidentType || "unknown").toLowerCase()
  const cleanSvc = serviceName || "order-service"

  // 1. Memory Context Analysis
  const similarMemories = cleanMemories.filter(
    (m) =>
      (m.incident_type && m.incident_type.toLowerCase() === cleanType) ||
      (m.affected_service && m.affected_service === cleanSvc)
  )
  const successfulMemories = similarMemories.filter((m) => Boolean(m.recovery_success))

  const actionCounts = {}
  for (const m of successfulMemories) {
    const action = m.recovery_action
    if (action && REMEDIATION_ACTIONS[action]) {
      actionCounts[action] = (actionCounts[action] || 0) + 1
    }
  }

  let learnedAction = null
  let maxCount = 0
  for (const [action, count] of Object.entries(actionCounts)) {
    if (count > maxCount) {
      maxCount = count
      learnedAction = action
    }
  }

  // 2. Evaluate Each Remediation Scenario
  const scenarios = []
  for (const [actionKey, action] of Object.entries(REMEDIATION_ACTIONS)) {
    let recoveryProbability = action.base_recovery
    const riskScore = RISK_SCORES[action.base_risk] || 50

    // Context-sensitive probability adjustments matching backend simulation logic
    if (cleanType === "payment_failure") {
      if (actionKey === "rollback_deployment") recoveryProbability += 0.02
      else if (actionKey === "restart_service") recoveryProbability += 0.01
    } else if (cleanType === "cpu_spike") {
      if (actionKey === "scale_service") recoveryProbability += 0.08
    } else if (cleanType === "memory_leak") {
      if (actionKey === "restart_service") recoveryProbability += 0.05
    } else if (cleanType === "db_down") {
      if (actionKey === "restart_dependency") recoveryProbability += 0.06
    } else if (cleanType === "order_crash") {
      if (actionKey === "restart_service") recoveryProbability += 0.04
    } else if (cleanType === "api_failure") {
      if (actionKey === "scale_service") recoveryProbability += 0.06
    }

    // Historical memory boost
    let memoryBoost = 0
    if (learnedAction === actionKey) {
      memoryBoost = Math.min(0.04, successfulMemories.length * 0.01)
      recoveryProbability += memoryBoost
    }

    recoveryProbability = Math.min(recoveryProbability, 0.99)
    const decisionScore = Number((recoveryProbability * 100 - riskScore * 0.35).toFixed(2))

    scenarios.push({
      action: actionKey,
      action_name: action.name,
      description: action.description,
      service: cleanSvc,
      incident_type: cleanType,
      recovery_probability: Math.round(recoveryProbability * 100),
      risk: action.base_risk,
      risk_score: riskScore,
      impact: action.impact,
      estimated_recovery_seconds: action.estimated_seconds,
      decision_score: decisionScore,
      memory_boost: Number((memoryBoost * 100).toFixed(2)),
    })
  }

  // Rank scenarios by decision score descending
  scenarios.sort((a, b) => b.decision_score - a.decision_score)
  const recommended = scenarios[0]

  let decisionMessage = "Recommendation is based on recovery-to-risk analysis."
  if (learnedAction) {
    decisionMessage = "Recommendation combines baseline recovery analysis with successful historical incident memory."
  } else if (similarMemories.length > 0) {
    decisionMessage = "Similar incidents were found, but no compatible successful remediation action has been learned yet."
  }

  return {
    engine: "Sentinel Memory-Augmented What-If Decision Engine",
    status: "simulation_complete",
    service: cleanSvc,
    incident_type: cleanType,
    scenario_count: scenarios.length,
    memory_context: {
      similar_incidents: similarMemories.length,
      successful_incidents: successfulMemories.length,
      learned_action: learnedAction,
      action_history: actionCounts,
      learning_available: learnedAction !== null,
    },
    scenarios,
    comparison: scenarios,
    recommended_action: {
      action: recommended.action,
      name: recommended.action_name,
      recovery_probability: recommended.recovery_probability,
      risk: recommended.risk,
      impact: recommended.impact,
      estimated_recovery_seconds: recommended.estimated_recovery_seconds,
      memory_boost: recommended.memory_boost,
    },
    optimal_action: {
      action: recommended.action,
      name: recommended.action_name,
      recovery_probability: recommended.recovery_probability,
      risk: recommended.risk,
      impact: recommended.impact,
      estimated_recovery_seconds: recommended.estimated_recovery_seconds,
      memory_boost: recommended.memory_boost,
    },
    decision: decisionMessage,
  }
}
