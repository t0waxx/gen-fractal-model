
import React from 'react';

interface SliderInputProps {
  id: string;
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (value: number) => void;
  valueSuffix?: string;
  accentColorClass?: string;
}

const SliderInput: React.FC<SliderInputProps> = ({
  id,
  label,
  value,
  min,
  max,
  step,
  onChange,
  valueSuffix = '',
  accentColorClass = 'accent-blue-500'
}) => {
  const displayValue = step >= 1 ? value.toFixed(0) : value.toFixed(1);

  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-gray-300">
        {label}: <span className={`slider-value font-semibold ${accentColorClass === 'accent-blue-500' ? 'text-blue-300' : 'text-teal-300'}`}>{displayValue}{valueSuffix}</span>
      </label>
      <input
        type="range"
        id={id}
        min={min}
        max={max}
        value={value}
        step={step}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className={`w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer ${accentColorClass} mt-1`}
      />
    </div>
  );
};

export default SliderInput;
