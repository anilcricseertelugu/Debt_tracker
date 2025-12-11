import React from 'react';

export const Card = ({ children, className = '', ...props }) => (
    <div className={`bg-white rounded-xl shadow-sm border border-gray-100 p-6 ${className}`} {...props}>
        {children}
    </div>
);

export const CardHeader = ({ title, subtitle, action }) => (
    <div className="flex justify-between items-start mb-6">
        <div>
            <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
            {subtitle && <p className="text-sm text-gray-500 mt-1">{subtitle}</p>}
        </div>
        {action && <div>{action}</div>}
    </div>
);
