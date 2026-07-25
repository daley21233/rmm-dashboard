// src/components/Breadcrumb.tsx

import React from 'react';

interface BreadcrumbProps {
    path: string;
    onNavigate: (path: string) => void;
}

export default function Breadcrumb({ path, onNavigate }: BreadcrumbProps) {
    const parts = path.split('\\').filter(p => p.length > 0);
    
    const buildPath = (index: number): string => {
        return 'C:\\' + parts.slice(0, index + 1).join('\\');
    };

    return (
        <nav className="flex items-center gap-1 text-sm overflow-x-auto whitespace-nowrap" aria-label="Breadcrumb">
            <button
                onClick={() => onNavigate('C:\\')}
                className="text-blue-600 hover:text-blue-800 hover:underline font-medium"
            >
                💻 C:
            </button>
            
            {parts.map((part, index) => {
                const isLast = index === parts.length - 1;
                const fullPath = buildPath(index);
                
                return (
                    <div key={index} className="flex items-center gap-1">
                        <span className="text-gray-400">/</span>
                        {isLast ? (
                            <span className="text-gray-700 font-medium">{part}</span>
                        ) : (
                            <button
                                onClick={() => onNavigate(fullPath)}
                                className="text-blue-600 hover:text-blue-800 hover:underline"
                            >
                                {part}
                            </button>
                        )}
                    </div>
                );
            })}
        </nav>
    );
}