
import React, { useState, useRef, useEffect } from 'react';
import { Business } from '../types';
import { BuildingOfficeIcon, CheckIcon, ChevronDownIcon } from './icons/Icon';

interface BusinessSwitcherProps {
    businesses: Business[];
    activeBusiness: Business | null;
    onSelectBusiness: (business: Business) => void;
    isMobile?: boolean;
}

const BusinessSwitcher: React.FC<BusinessSwitcherProps> = ({ businesses, activeBusiness, onSelectBusiness, isMobile = false }) => {
    const [isOpen, setIsOpen] = useState(false);
    const wrapperRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [wrapperRef]);
    
    const handleSelect = (business: Business) => {
        onSelectBusiness(business);
        setIsOpen(false);
    };

    if (!activeBusiness) {
        return null;
    }

    const buttonClass = isMobile
        ? "flex items-center gap-2 text-xl font-bold text-white truncate p-1 -m-1"
        : "flex items-center gap-2 text-xl font-bold text-white truncate p-2 -m-2 rounded-lg hover:bg-black/20 transition-colors";

    return (
        <div className="relative" ref={wrapperRef}>
            <button onClick={() => setIsOpen(!isOpen)} className={buttonClass}>
                <span className="truncate">{activeBusiness.name}</span>
                <ChevronDownIcon className={`w-5 h-5 text-slate-200 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {isOpen && (
                <div className="absolute top-full mt-2 w-72 max-h-80 overflow-y-auto start-0 bg-white dark:bg-slate-800 rounded-lg shadow-2xl border border-slate-200 dark:border-slate-700 z-50 animate-fade-in-sm">
                    <ul className="p-2">
                        {businesses.map(business => (
                            <li key={business.id}>
                                <a
                                    href="#"
                                    onClick={(e) => { e.preventDefault(); handleSelect(business); }}
                                    className={`flex items-center justify-between gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors w-full ${business.id === activeBusiness.id ? 'bg-primary-100 text-primary-700 dark:bg-primary-500/20 dark:text-primary-300' : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-700'}`}
                                >
                                    <div className="flex items-center gap-3 truncate">
                                        <BuildingOfficeIcon className="w-5 h-5 flex-shrink-0" />
                                        <span className="truncate">{business.name}</span>
                                    </div>
                                    {business.id === activeBusiness.id && (
                                        <CheckIcon className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                                    )}
                                </a>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
            <style dangerouslySetInnerHTML={{ __html: `
                @keyframes fade-in-sm { from { opacity: 0; transform: translateY(-5px) scale(0.98); } to { opacity: 1; transform: translateY(0) scale(1); } }
                .animate-fade-in-sm { animation: fade-in-sm 0.15s ease-out forwards; }
            `}}/>
        </div>
    );
};

export default BusinessSwitcher;