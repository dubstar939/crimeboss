import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
  ariaLabel?: string;
}

export function Button({ 
  variant = 'primary', 
  size = 'md', 
  children, 
  className = '',
  ariaLabel,
  ...props 
}: ButtonProps) {
  const baseStyles = 'font-mono font-bold uppercase tracking-wider transition-all duration-150 ease-in-out border-2 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-black disabled:opacity-50 disabled:cursor-not-allowed';
  
  const variants = {
    primary: 'bg-red-700 hover:bg-red-600 text-white border-red-800 focus:ring-red-500',
    secondary: 'bg-gray-800 hover:bg-gray-700 text-white border-gray-900 focus:ring-gray-500',
    danger: 'bg-red-900 hover:bg-red-800 text-white border-red-950 focus:ring-red-700',
  };
  
  const sizes = {
    sm: 'px-4 py-2 text-sm',
    md: 'px-6 py-3 text-base',
    lg: 'px-8 py-4 text-lg',
  };
  
  return (
    <button
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
      aria-label={ariaLabel || typeof children === 'string' ? children : undefined}
      {...props}
    >
      {children}
    </button>
  );
}

interface SliderProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (value: number) => void;
  formatValue?: (value: number) => string;
  ariaLabel?: string;
}

export function Slider({ 
  label, 
  value, 
  min, 
  max, 
  step = 0.01, 
  onChange,
  formatValue,
  ariaLabel
}: SliderProps) {
  const formattedValue = formatValue ? formatValue(value) : value.toFixed(2);
  
  return (
    <div className="flex items-center gap-4">
      <label id={`slider-label-${label.replace(/\s+/g, '-').toLowerCase()}`} className="text-white font-mono text-sm w-32">
        {label}
      </label>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        aria-labelledby={`slider-label-${label.replace(/\s+/g, '-').toLowerCase()}`}
        aria-valuetext={formattedValue}
        aria-label={ariaLabel || label}
        className="flex-1 h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-red-600 focus:outline-none focus:ring-2 focus:ring-red-500"
      />
      <span className="text-white font-mono text-sm w-12 text-right" aria-hidden="true">
        {formattedValue}
      </span>
    </div>
  );
}

interface ToggleProps {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  ariaLabel?: string;
}

export function Toggle({ label, checked, onChange, ariaLabel }: ToggleProps) {
  const toggleId = `toggle-${label.replace(/\s+/g, '-').toLowerCase()}`;
  
  return (
    <label htmlFor={toggleId} className="flex items-center justify-between cursor-pointer group">
      <span id={`${toggleId}-label`} className="text-white font-mono text-sm">{label}</span>
      <div className="relative">
        <input
          type="checkbox"
          id={toggleId}
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          aria-labelledby={`${toggleId}-label`}
          aria-label={ariaLabel || label}
          className="sr-only"
        />
        <div 
          className={`w-12 h-6 rounded-full transition-colors duration-200 ${checked ? 'bg-red-700' : 'bg-gray-700'}`}
          role="switch"
          aria-checked={checked}
        >
          <div 
            className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform duration-200 ${checked ? 'translate-x-6' : 'translate-x-0'}`} 
          />
        </div>
      </div>
    </label>
  );
}

interface ModalProps {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  ariaLabel?: string;
}

export function Modal({ title, onClose, children, ariaLabel }: ModalProps) {
  const modalId = 'modal-dialog';
  
  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby={`${modalId}-title`}
      aria-label={ariaLabel || title}
    >
      <div className="bg-gray-900 border-2 border-red-800 rounded-lg shadow-2xl max-w-md w-full mx-4 overflow-hidden">
        <div className="flex items-center justify-between p-4 bg-gray-800 border-b border-red-800">
          <h2 id={`${modalId}-title`} className="text-xl font-bold text-white font-mono uppercase tracking-wider">
            {title}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors text-2xl leading-none focus:outline-none focus:ring-2 focus:ring-red-500 rounded"
            aria-label="Close dialog"
          >
            ×
          </button>
        </div>
        <div className="p-6" role="document">
          {children}
        </div>
      </div>
    </div>
  );
}
