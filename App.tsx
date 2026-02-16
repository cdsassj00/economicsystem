import React, { useState, useMemo } from 'react';
import { GoogleGenAI } from "@google/genai";
import { SimulationState, SimulationResult } from './types';
import { INITIAL_STATE, SCENARIOS } from './constants';
import { SliderControl } from './components/SliderControl';
import { EcoMap } from './components/EcoMap';
import { RefreshCcw, Info, Activity, Sparkles, Bot, X, Zap } from 'lucide-react';

const App: React.FC = () => {
  const [state, setState] = useState<SimulationState>(INITIAL_STATE);
  const [selectedScenarioId, setSelectedScenarioId] = useState<string>('default');
  
  // AI State
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Logic Engine: Calculate impacts based on inputs
  const result: SimulationResult = useMemo(() => {
    // Destructure inputs
    const { 
      interestRate, inflation, exchangeRate, oilPrice, 
      exportChange, consumptionChange, unemploymentRate, employmentIndex 
    } = state;

    // Normalize inputs roughly to a -1 to 1 impact scale for internal logic
    const nInterest = interestRate; 
    const nInflation = inflation * 0.5;
    const nExchange = exchangeRate * 0.1; 
    const nOil = oilPrice * 0.05; 
    const nExport = exportChange * 0.1;
    const nConsumption = consumptionChange * 0.1;
    
    // New variables logic
    // Unemployment: High (-) -> Low Consumption, Low Inflation (Phillips curve logic approx)
    const nUnemployment = unemploymentRate * 0.2; 
    // Employment Index: High (+) -> High Consumption, High Investment
    const nEmployment = employmentIndex * 0.1;

    // Derived Nodes Logic
    const scorePrice = nInflation + (nOil * 0.8) + (nExchange * 0.3) + (nConsumption * 0.2) - (nUnemployment * 0.3);
    
    // Consumption affected by Unemployment (-) and Employment (+)
    const scoreConsumption = nConsumption - (nInterest * 0.6) - (scorePrice * 0.5) + (nExport * 0.2) - (nUnemployment * 0.8) + (nEmployment * 0.5);
    
    // Investment affected by Employment/Labor market (+)
    const scoreInvestment = - (nInterest * 0.8) + (nExport * 0.5) + (scoreConsumption * 0.4) + (nEmployment * 0.4);
    
    const scoreStock = (scoreInvestment * 0.6) + (scoreConsumption * 0.4) - (nOil * 0.3) - (nInterest * 0.4);
    const scoreBond = - (nInterest * 1.0) - (scorePrice * 0.4);
    const scoreRealEstate = - (nInterest * 0.9) + (scoreConsumption * 0.3) - (nUnemployment * 0.5);
    const scoreExport = nExport + (nExchange * 0.6);
    const scoreInterest = nInterest + (scorePrice * 0.3);

    // Insights Generation (Rule-based)
    const insights: string[] = [];
    
    if (nUnemployment > 0.2) insights.push("실업률 상승은 가계 소득 감소로 이어져 소비를 크게 위축시킬 수 있습니다.");
    if (nEmployment > 0.2) insights.push("고용 지표 호조는 경제 주체들의 자신감을 높여 투자와 소비를 촉진합니다.");
    if (nInterest > 0.5) insights.push("고금리는 대출 상환 부담을 높여 부동산과 주식 시장에 하방 압력을 가합니다.");
    if (scorePrice > 0.5) insights.push("물가 상승세가 지속되면 실질 구매력이 감소하여 경기 둔화 우려가 커집니다.");
    if (nExchange > 0.5) insights.push("환율 상승은 수출 기업에는 호재이나, 수입 물가 상승을 유발할 수 있습니다.");
    if (scoreStock < -0.5) insights.push("기업 실적 악화 우려와 유동성 축소로 주식 시장 투자 매력이 감소했습니다.");

    if (insights.length === 0) insights.push("주요 경제 변수들이 비교적 안정적인 균형 상태를 유지하고 있습니다.");

    return {
      nodes: {
        interest: scoreInterest,
        oil: nOil,
        exchange: nExchange,
        price: scorePrice,
        export: scoreExport,
        consumption: scoreConsumption,
        investment: scoreInvestment,
        stock: scoreStock,
        bond: scoreBond,
        realEstate: scoreRealEstate,
      },
      insights: insights.slice(0, 4) 
    };
  }, [state]);

  const handleScenarioChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const scenarioId = e.target.value;
    setSelectedScenarioId(scenarioId);
    const scenario = SCENARIOS.find(s => s.id === scenarioId);
    if (scenario) {
      setState(scenario.values);
      setAiAnalysis(null); 
    }
  };

  const handleReset = () => {
    setState(INITIAL_STATE);
    setSelectedScenarioId('default');
    setAiAnalysis(null);
  };

  const updateState = (key: keyof SimulationState, value: number) => {
    setState(prev => ({ ...prev, [key]: value }));
    setSelectedScenarioId('default'); 
    if (aiAnalysis) setAiAnalysis(null);
  };

  const handleAiAnalysis = async () => {
    setIsAnalyzing(true);
    setIsModalOpen(true); // Open modal immediately to show loading state
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const prompt = `
당신은 대한민국 최고의 거시경제 전문가이자 베테랑 자산 운용가(Fund Manager)입니다.
현재 경제 시뮬레이터의 설정값은 다음과 같습니다:

1. 기준 금리 변화: ${state.interestRate > 0 ? '+' : ''}${state.interestRate}%p
2. 물가 상승률 변화: ${state.inflation > 0 ? '+' : ''}${state.inflation}%
3. 환율(원/달러) 변화: ${state.exchangeRate > 0 ? '+' : ''}${state.exchangeRate}%
4. 국제 유가 변화: ${state.oilPrice > 0 ? '+' : ''}${state.oilPrice}%
5. 수출 증감: ${state.exportChange > 0 ? '+' : ''}${state.exportChange}%
6. 민간 소비 심리: ${state.consumptionChange > 0 ? '+' : ''}${state.consumptionChange}%
7. 실업률 변화: ${state.unemploymentRate > 0 ? '+' : ''}${state.unemploymentRate}%p
8. 고용 지수 변화: ${state.employmentIndex > 0 ? '+' : ''}${state.employmentIndex}

이 데이터를 바탕으로 다음 내용을 초보자도 이해하기 쉽게 설명해주세요:

1. [경제 시나리오 분석]: 위 변수들이 상호작용하여 발생할 현재 경제 상황(호황, 불황, 스태그플레이션 등)을 진단하고 연쇄 반응을 설명해주세요.
2. [투자 관리사 조언]: 현재 시점에서 가장 유망한 자산군(예: 채권, 주식(성장주/가치주/배당주), 금, 달러, 부동산, 예금 등) 3가지를 추천하고, 비중을 축소해야 할 자산을 언급해주세요. 그 이유를 논리적으로 설명해주세요.

어조: 친절하고 전문적이며 통찰력 있게. 마크다운 없이 가독성 좋은 줄글과 번호 매기기를 사용하세요. 핵심 내용을 강조해주세요.`;
      
      const resp = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt
      });
      
      setAiAnalysis(resp.text || "분석 결과를 가져오지 못했습니다.");
    } catch (error) {
      console.error("AI Analysis Failed", error);
      setAiAnalysis("AI 분석 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="min-h-screen p-4 md:p-8 flex flex-col gap-6 max-w-[1600px] mx-auto">
      
      {/* Header */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Activity className="text-blue-600" />
            경제 흐름 시뮬레이터
          </h1>
          <p className="text-slate-500 mt-1">거시경제 변수와 고용 지표가 경제에 미치는 영향을 체험해보세요.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button 
            onClick={handleAiAnalysis}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-lg transition-all font-bold shadow-md hover:shadow-lg animate-pulse-slow"
          >
            <Sparkles size={18} />
            AI 투자 자문 분석
          </button>
          
          <div className="h-8 w-[1px] bg-slate-200 mx-2 hidden md:block"></div>

          <div className="relative">
            <select 
              value={selectedScenarioId}
              onChange={handleScenarioChange}
              className="appearance-none bg-slate-100 border border-slate-200 text-slate-700 py-2 pl-4 pr-10 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer font-medium"
            >
              {SCENARIOS.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-500">
              <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
            </div>
          </div>
          <button 
            onClick={handleReset}
            className="flex items-center gap-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 px-4 py-2 rounded-lg transition-colors font-medium shadow-sm"
          >
            <RefreshCcw size={16} />
            초기화
          </button>
        </div>
      </header>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-grow">
        
        {/* Left: Control Panel */}
        <section className="lg:col-span-3 flex flex-col gap-2">
          <h2 className="text-lg font-bold text-slate-800 mb-2 px-1">경제 지표 컨트롤</h2>
          <div className="overflow-y-auto pr-2 max-h-[800px] scrollbar-thin pb-10">
            <div className="space-y-6">
              <div>
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">통화 및 물가</h3>
                <SliderControl 
                  label="기준 금리 변화" value={state.interestRate} min={-2} max={2} step={0.25} unit="%p" 
                  onChange={(v) => updateState('interestRate', v)} 
                />
                <SliderControl 
                  label="물가 상승률 변화" value={state.inflation} min={-3} max={3} step={0.5} unit="%" 
                  onChange={(v) => updateState('inflation', v)} 
                />
                <SliderControl 
                  label="환율 변화 (원/달러)" value={state.exchangeRate} min={-10} max={10} step={1} unit="%" 
                  onChange={(v) => updateState('exchangeRate', v)} 
                />
              </div>

              <div>
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">실물 경제</h3>
                <SliderControl 
                  label="국제 유가 변화" value={state.oilPrice} min={-20} max={20} step={5} unit="%" 
                  onChange={(v) => updateState('oilPrice', v)} 
                />
                <SliderControl 
                  label="수출 증감" value={state.exportChange} min={-10} max={10} step={1} unit="%" 
                  onChange={(v) => updateState('exportChange', v)} 
                />
                <SliderControl 
                  label="민간 소비 심리" value={state.consumptionChange} min={-10} max={10} step={1} unit="%" 
                  onChange={(v) => updateState('consumptionChange', v)} 
                />
              </div>

              <div>
                <h3 className="text-xs font-bold text-indigo-500 uppercase tracking-wider mb-2">고용 지표 (New)</h3>
                <SliderControl 
                  label="실업률 변화" value={state.unemploymentRate} min={-2} max={2} step={0.1} unit="%p" 
                  onChange={(v) => updateState('unemploymentRate', v)} 
                />
                <SliderControl 
                  label="고용 지수 변화" value={state.employmentIndex} min={-10} max={10} step={1} unit="" 
                  onChange={(v) => updateState('employmentIndex', v)} 
                />
              </div>
            </div>
          </div>
        </section>

        {/* Center: Interactive Map */}
        <section className="lg:col-span-6 flex flex-col">
          <h2 className="text-lg font-bold text-slate-800 mb-4 px-1">경제 연쇄반응 지도</h2>
          <div className="flex-grow min-h-[500px]">
            <EcoMap nodeValues={result.nodes} />
          </div>
        </section>

        {/* Right: Interpretation Panel */}
        <section className="lg:col-span-3 flex flex-col h-full">
          <h2 className="text-lg font-bold text-slate-800 mb-4 px-1">실시간 경제 해석</h2>
          
          <div className="flex flex-col gap-4 h-full">
            {/* Real-time Rule-based Insights */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 h-full">
              <div className="flex items-center gap-2 mb-4 text-slate-600">
                <Info size={20} />
                <span className="text-sm font-medium">실시간 분석 (Rule-based)</span>
              </div>
              <div className="space-y-3 overflow-y-auto max-h-[400px]">
                {result.insights.map((text, idx) => (
                  <div key={idx} className="bg-slate-50 p-3 rounded-xl border border-slate-100 flex gap-3 text-sm">
                    <div className="mt-1 w-1.5 min-w-[6px] h-1.5 bg-blue-500 rounded-full"></div>
                    <p className="text-slate-700 leading-relaxed font-medium">{text}</p>
                  </div>
                ))}
              </div>
              
              <div className="mt-6 pt-4 border-t border-slate-100">
                 <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">시장 지표 요약</h4>
                 <div className="grid grid-cols-2 gap-3">
                    <SummaryItem label="부동산" value={result.nodes.realEstate} />
                    <SummaryItem label="주식시장" value={result.nodes.stock} />
                    <SummaryItem label="채권시장" value={result.nodes.bond} />
                    <SummaryItem label="투자심리" value={result.nodes.investment} />
                 </div>
              </div>
            </div>
            
            {/* AI Call to Action (Small banner if modal is closed) */}
            <div 
              onClick={handleAiAnalysis}
              className="bg-gradient-to-r from-indigo-600 to-violet-600 rounded-xl p-4 shadow-md text-white cursor-pointer hover:shadow-lg transition-all flex items-center justify-between group"
            >
              <div>
                <h3 className="font-bold text-sm">AI 전문가 조언이 필요하신가요?</h3>
                <p className="text-xs text-indigo-100 opacity-90">현재 상황에 맞는 투자 전략을 확인하세요.</p>
              </div>
              <div className="bg-white/20 p-2 rounded-full group-hover:bg-white/30 transition-colors">
                <Bot size={20} />
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* AI Analysis Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setIsModalOpen(false)}></div>
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col animate-fade-in-up">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="bg-indigo-100 p-2 rounded-full">
                  <Bot className="text-indigo-600" size={24} />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-800">AI 투자 자문 보고서</h3>
                  <p className="text-sm text-slate-500">Google Gemini가 분석한 현재 경제 상황입니다.</p>
                </div>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 transition-colors p-2 hover:bg-slate-100 rounded-full"
              >
                <X size={24} />
              </button>
            </div>

            {/* Modal Content */}
            <div className="flex-grow overflow-y-auto p-6 scrollbar-thin">
              {isAnalyzing ? (
                <div className="flex flex-col items-center justify-center py-12 text-slate-500">
                  <Sparkles className="animate-spin text-indigo-500 mb-4" size={40} />
                  <p className="text-lg font-medium text-slate-700">경제 데이터를 분석하고 있습니다...</p>
                  <p className="text-sm opacity-70">잠시만 기다려주세요.</p>
                </div>
              ) : aiAnalysis ? (
                <div className="prose prose-indigo max-w-none text-slate-700 leading-relaxed whitespace-pre-wrap">
                  {aiAnalysis}
                </div>
              ) : (
                <div className="text-center py-12 text-slate-400">
                  분석 결과가 없습니다. 다시 시도해주세요.
                </div>
              )}
            </div>

            {/* Modal Footer */}
            {!isAnalyzing && (
              <div className="p-4 border-t border-slate-100 flex justify-end gap-3 bg-slate-50 rounded-b-2xl">
                <button 
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-slate-600 font-medium hover:bg-slate-200 rounded-lg transition-colors"
                >
                  닫기
                </button>
                <button 
                  onClick={handleAiAnalysis}
                  className="px-4 py-2 bg-indigo-600 text-white font-medium hover:bg-indigo-700 rounded-lg transition-colors flex items-center gap-2"
                >
                  <RefreshCcw size={16} />
                  다시 분석하기
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

const SummaryItem: React.FC<{ label: string; value: number }> = ({ label, value }) => {
  const isPositive = value > 0.1;
  const isNegative = value < -0.1;
  const color = isPositive ? 'text-green-600' : isNegative ? 'text-red-500' : 'text-slate-400';
  const text = isPositive ? '상승' : isNegative ? '하락' : '보합';
  
  return (
    <div className="flex justify-between items-center bg-white/50 p-2 rounded-lg border border-slate-100/50">
      <span className="text-xs text-slate-500">{label}</span>
      <span className={`font-bold text-xs ${color}`}>{text}</span>
    </div>
  );
};

export default App;