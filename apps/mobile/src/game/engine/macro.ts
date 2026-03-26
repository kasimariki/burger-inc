import type { MacroEconomy } from "../models/types";

const PHASE_ORDER: MacroEconomy["phase"][] = ["boom", "recession", "depression", "recovery"];
const MIN_TURNS_PER_PHASE = 12;
const MAX_TURNS_PER_PHASE = 24;

export function advanceMacroEconomy(economy: MacroEconomy): MacroEconomy {
  const nextTurnsInPhase = economy.turnsInPhase + 1;
  const phaseLength = MIN_TURNS_PER_PHASE + Math.floor(Math.random() * (MAX_TURNS_PER_PHASE - MIN_TURNS_PER_PHASE));

  if (nextTurnsInPhase >= phaseLength) {
    return transitionToNextPhase(economy);
  }

  return {
    ...economy,
    turnsInPhase: nextTurnsInPhase,
    consumerConfidence: adjustConfidence(economy),
    interestRate: adjustInterestRate(economy),
    inflationRate: adjustInflationRate(economy),
  };
}

function transitionToNextPhase(economy: MacroEconomy): MacroEconomy {
  const currentIndex = PHASE_ORDER.indexOf(economy.phase);
  const nextPhase = PHASE_ORDER[(currentIndex + 1) % PHASE_ORDER.length];

  const defaults: Record<MacroEconomy["phase"], Partial<MacroEconomy>> = {
    boom:       { consumerConfidence: 80, interestRate: 0.05, inflationRate: 0.03 },
    recession:  { consumerConfidence: 55, interestRate: 0.04, inflationRate: 0.02 },
    depression: { consumerConfidence: 30, interestRate: 0.01, inflationRate: 0.005 },
    recovery:   { consumerConfidence: 60, interestRate: 0.02, inflationRate: 0.015 },
  };

  return { ...economy, ...defaults[nextPhase], phase: nextPhase, turnsInPhase: 0 };
}

function adjustConfidence(economy: MacroEconomy): number {
  const delta = economy.phase === "boom" || economy.phase === "recovery" ? 2 : -2;
  return Math.max(0, Math.min(100, economy.consumerConfidence + delta + (Math.random() * 4 - 2)));
}

function adjustInterestRate(economy: MacroEconomy): number {
  const delta = economy.phase === "boom" ? 0.002 : economy.phase === "depression" ? -0.002 : 0;
  return Math.max(0.005, Math.min(0.08, economy.interestRate + delta));
}

function adjustInflationRate(economy: MacroEconomy): number {
  const base = economy.interestRate * 0.6;
  return Math.max(0.005, Math.min(0.06, base + (Math.random() * 0.004 - 0.002)));
}

export function getInitialEconomy(): MacroEconomy {
  return {
    phase: "boom",
    interestRate: 0.03,
    inflationRate: 0.02,
    consumerConfidence: 70,
    turnsInPhase: 0,
  };
}
