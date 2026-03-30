// ========================================
// Burger Inc. — ゲームバランス定数
// ========================================

export const GAME_CONFIG = {
  // --- 経済 ---
  economy: {
    startingCash: 50000,
    rentRange: [2000, 15000] as const,
    staffSalaryRange: [1800, 4500] as const,
    customerSpendAvg: 12.5,
    taxRate: 0.25,
  },

  // --- メニュー ---
  menu: {
    maxMenuItems: 20,
    developmentCostRange: [300, 3000] as const,
    developmentTurnsRange: [1, 4] as const,
    tasteScoreFactors: {
      ingredients: 0.4,
      recipe: 0.35,
      chefSkill: 0.25,
    },
    priceRange: {
      burger: [5, 25] as const,
      side: [2, 10] as const,
      drink: [1, 8] as const,
    },
  },

  // --- 食材 ---
  ingredients: {
    qualityLevels: 5,
    qualityCostMultiplier: 1.5, // グレードが1上がるごとにコスト1.5倍
    qualityTasteMultiplier: 1.3,
  },

  // --- スタッフ ---
  staff: {
    hiringCostRange: [200, 2000] as const,
    trainingCostPerLevel: 500,
    maxSkillLevel: 10,
    turnoverBaseRate: 0.05,
    satisfactionFactors: {
      salary: 0.3,
      workload: 0.25,
      environment: 0.25,
      growth: 0.2,
    },
  },

  // --- 店舗 ---
  store: {
    types: {
      street: { capacityRange: [50, 150] as const, rentMultiplier: 1.0 },
      mall: { capacityRange: [80, 200] as const, rentMultiplier: 1.5 },
      drive_through: { capacityRange: [100, 300] as const, rentMultiplier: 1.3 },
      food_truck: { capacityRange: [20, 60] as const, rentMultiplier: 0.4 },
    },
    openingCostMonths: 2, // 初期費用 = 家賃×この月数
    baseOccupancyRate: 0.6,
  },

  // --- マクロ経済 ---
  macroEconomy: {
    cycleLengthRange: [48, 96] as const,
    phaseLengthRange: [12, 24] as const,
    phases: ["boom", "recession", "depression", "recovery"] as const,
    interestRateRange: [0.005, 0.08] as const,
    inflationRange: [0.005, 0.06] as const,
    phaseDefaults: {
      boom: { consumerConfidence: 85, interestRate: 0.05, inflationRate: 0.03 },
      recession: { consumerConfidence: 60, interestRate: 0.04, inflationRate: 0.02 },
      depression: { consumerConfidence: 40, interestRate: 0.01, inflationRate: 0.005 },
      recovery: { consumerConfidence: 65, interestRate: 0.02, inflationRate: 0.015 },
    },
    economyMultiplier: {
      boom: 1.3,
      recovery: 1.15,
      recession: 0.9,
      depression: 0.75,
    },
  },

  // --- イベント ---
  events: {
    chancePerTurn: 0.25,          // 毎ターン25%の確率でイベント発生
    maxActiveEvents: 3,
    severityWeights: {
      minor: 0.6,
      moderate: 0.3,
      major: 0.1,
    },
  },

  // --- フランチャイズ（Phase 2以降） ---
  franchise: {
    feeRange: [25000, 100000] as const,
    royaltyRateRange: [0.04, 0.08] as const,
    brandDamageOnQualityFail: 0.1,
    minBrandScoreToFranchise: 60,
    minStoresForFranchise: 5,
  },

  // --- 投資（Phase 3以降） ---
  stockMarket: {
    listedCompanies: 40,
    sectors: ["food", "tech", "realestate", "energy", "finance", "healthcare", "retail"] as const,
    ipoRequirements: {
      minRevenue: 10_000_000,
      consecutiveProfitQuarters: 3,
      minStores: 50,
      minBrandScore: 70,
      requiresCFO: true,
    },
  },
} as const;

export type GameConfig = typeof GAME_CONFIG;
