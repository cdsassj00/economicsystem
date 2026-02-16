import React from 'react';

interface SliderControlProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  unit: string;
  onChange: (val: number) => void;
  colorClass?: string;
}

export const SliderControl: React.FC<SliderControlProps> = ({
  label,
  value,
  min,
  max,
  step,
  unit,
  onChange,
  colorClass = "bg-blue-500"
}) => {
  return (
    <div className="mb-5 bg-white p-4 rounded-xl shadow-sm border border-slate-100">
      <div className="flex justify-between items-center mb-2">
        <label className="text-sm font-medium text-slate-700">{label}</label>
        <span className={`text-sm font-bold ${value > 0 ? 'text-green-600' : value < 0 ? 'text-red-500' : 'text-slate-400'}`}>
          {value > 0 ? '+' : ''}{value}{unit}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer slider-thumb"
      />
      <div className="flex justify-between text-xs text-slate-400 mt-1">
        <span>{min}{unit}</span>
        <span>{max}{unit}</span>
      </div>
    </div>
  );
};