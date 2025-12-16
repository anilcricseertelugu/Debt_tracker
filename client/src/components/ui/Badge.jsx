import React from 'react';

const variants = {
    success: 'bg-emerald-50 text-emerald-700 border-emerald-100',
    warning: 'bg-amber-50 text-amber-700 border-amber-100',
    danger: 'bg-red-50 text-red-700 border-red-100',
    info: 'bg-blue-50 text-blue-700 border-blue-100',
    neutral: 'bg-gray-50 text-gray-600 border-gray-100',
    primary: 'bg-slate-100 text-slate-700 border-slate-200',
    // Domain Specific
    bank: 'bg-indigo-50 text-indigo-700 border-indigo-100',
    hand: 'bg-orange-50 text-orange-700 border-orange-100',
};

export const Badge = ({ children, variant = 'neutral', className = '' }) => {
    return (
        <span className={`
            inline-flex items-center px-2 py-0.5 rounded-md text-[10px] uppercase font-bold tracking-wide border ${variants[variant] || variants.neutral} ${className}
        `}>
            {children}
        </span>
    );
};
