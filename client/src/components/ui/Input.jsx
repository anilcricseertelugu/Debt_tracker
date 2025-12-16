import React from 'react';

export const Input = React.forwardRef(({ label, error, className = '', ...props }, ref) => (
    <div className={`flex flex-col gap-1.5 ${className}`}>
        {label && <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-0.5">{label}</label>}
        <input
            ref={ref}
            className={`
                w-full px-3 py-2 bg-white text-gray-900 text-sm font-medium rounded-lg border border-gray-200
                focus:border-primary-500 focus:ring-2 focus:ring-primary-500/10 outline-none transition-all
                placeholder:text-gray-400 disabled:bg-gray-50 disabled:text-gray-400 shadow-sm
                ${error ? 'border-danger focus:border-danger focus:ring-danger/10' : ''}
            `}
            {...props}
        />
        {error && <span className="text-xs text-danger font-medium ml-1">{error}</span>}
    </div>
));

export const Select = React.forwardRef(({ label, options = [], error, className = '', ...props }, ref) => (
    <div className={`flex flex-col gap-1.5 ${className}`}>
        {label && <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-0.5">{label}</label>}
        <select
            ref={ref}
            className={`
                w-full px-3 py-2 bg-white text-gray-900 text-sm font-medium rounded-lg border border-gray-200
                focus:border-primary-500 focus:ring-2 focus:ring-primary-500/10 outline-none transition-all
                placeholder:text-gray-400 disabled:bg-gray-50 disabled:text-gray-400 shadow-sm
                ${error ? 'border-danger focus:border-danger focus:ring-danger/10' : ''}
            `}
            {...props}
        >
            {options.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
        </select>
        {error && <span className="text-xs text-danger font-medium ml-1">{error}</span>}
    </div>
));
