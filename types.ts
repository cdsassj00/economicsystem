export interface SimulationState {
  interestRate: number; // %
  inflation: number; // %
  exchangeRate: number; // % (Positive = Depreciation/Weaker Local Currency in this context usually helpful for exports, but simpler model might act differently. We will assume + = Rate UP = Weaker Won)
  oilPrice: number; // %
  exportChange: number; // %
  consumptionChange: number; // %
  unemploymentRate: number; // % change (New)
  employmentIndex: number; // index change (New)
}

export interface NodeStatus {
  id: string;
  label: string;
  value: number; // -1 to 1 (Normalized impact score)
  x: number;
  y: number;
  type: 'input' | 'intermediate' | 'output';
}

export interface Scenario {
  id: string;
  label: string;
  values: SimulationState;
}

export interface SimulationResult {
  nodes: Record<string, number>; // node key -> score
  insights: string[];
}