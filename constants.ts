import { SimulationState, Scenario, NodeStatus } from './types';

export const INITIAL_STATE: SimulationState = {
  interestRate: 0,
  inflation: 0,
  exchangeRate: 0,
  oilPrice: 0,
  exportChange: 0,
  consumptionChange: 0,
  unemploymentRate: 0,
  employmentIndex: 0,
};

export const SCENARIOS: Scenario[] = [
  {
    id: 'default',
    label: '선택하세요...',
    values: INITIAL_STATE,
  },
  {
    id: 'high_interest',
    label: '금리 인상 시나리오 (긴축)',
    values: { ...INITIAL_STATE, interestRate: 1.5, inflation: -0.5, consumptionChange: -2, unemploymentRate: 0.5 },
  },
  {
    id: 'inflation_shock',
    label: '인플레이션 충격 (물가 급등)',
    values: { ...INITIAL_STATE, inflation: 2.5, oilPrice: 15, interestRate: 0.5, consumptionChange: -1 },
  },
  {
    id: 'export_boom',
    label: '수출 호황 (경기 활성화)',
    values: { ...INITIAL_STATE, exportChange: 8, exchangeRate: 5, consumptionChange: 3, employmentIndex: 5, unemploymentRate: -1 },
  },
  {
    id: 'recession',
    label: '경기 침체 (복합 위기)',
    values: { ...INITIAL_STATE, consumptionChange: -8, exportChange: -5, interestRate: -1, unemploymentRate: 2.0, employmentIndex: -5 },
  },
];

// Graph Layout Coordinates (0-100 scale for SVG)
export const NODES_LAYOUT: NodeStatus[] = [
  // Top Row (Inputs/Drivers)
  { id: 'interest', label: '금리', value: 0, x: 20, y: 15, type: 'input' },
  { id: 'oil', label: '유가', value: 0, x: 50, y: 10, type: 'input' },
  { id: 'exchange', label: '환율', value: 0, x: 80, y: 15, type: 'input' },
  
  // Middle Row (Flow)
  { id: 'price', label: '물가', value: 0, x: 35, y: 40, type: 'intermediate' },
  { id: 'export', label: '수출', value: 0, x: 80, y: 40, type: 'intermediate' }, // Added to visualize flow
  
  // Bottom Middle
  { id: 'consumption', label: '소비', value: 0, x: 20, y: 60, type: 'intermediate' },
  { id: 'investment', label: '투자', value: 0, x: 60, y: 60, type: 'intermediate' },
  
  // Bottom Row (Markets)
  { id: 'realEstate', label: '부동산', value: 0, x: 20, y: 85, type: 'output' },
  { id: 'bond', label: '채권시장', value: 0, x: 50, y: 85, type: 'output' },
  { id: 'stock', label: '주식시장', value: 0, x: 80, y: 85, type: 'output' },
];

export const CONNECTIONS = [
  // Source -> Target
  { from: 'interest', to: 'consumption' },
  { from: 'interest', to: 'investment' },
  { from: 'interest', to: 'realEstate' },
  { from: 'interest', to: 'bond' },
  
  { from: 'oil', to: 'price' },
  { from: 'oil', to: 'stock' }, // High oil usually hurts generic stocks (cost push)
  
  { from: 'exchange', to: 'export' },
  { from: 'exchange', to: 'price' }, // Import prices
  
  { from: 'price', to: 'consumption' },
  { from: 'price', to: 'interest' }, // Feedback loop (Central bank response) - we simulate this simply
  
  { from: 'consumption', to: 'stock' },
  { from: 'consumption', to: 'investment' },
  
  { from: 'export', to: 'stock' },
  { from: 'export', to: 'investment' },
  
  { from: 'investment', to: 'stock' },
];