
import React from 'react';
import { ChartPieIcon, Cog6ToothIcon, HomeIcon, PlusIcon, UserGroupIcon } from './icons/Icon';
import { useTranslations } from '../hooks/useTranslations';
import { AppView } from '../types';

interface BottomNavBarProps {
    activeView: AppView;
    onSelectView: (view: AppView) => void;
    onFabClick: () => void;
}

const BottomNavBar: React.FC<BottomNavBarProps> = ({ activeView, onSelectView, onFabClick }) => {
    const t = useTranslations();
    
    const navItems = [
        { id: 'dashboard' as const, label: t.sidebar.dashboard, icon: HomeIcon },
        { id: 'reports' as const, label: t.sidebar.reports, icon: ChartPieIcon },
        { id: 'fab' as const, label: 'Add', icon: PlusIcon },
        { id: 'users' as const, label: t.sidebar.users, icon: UserGroupIcon },
        { id: 'settings' as const, label: t.sidebar.settings, icon: Cog6ToothIcon },
    ];

    return (
        <nav className="fixed bottom-0 start-0 end-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-lg border-t border-gray-200/50 dark:border-gray-800/50 lg:hidden z-30">
            <div className="flex justify-around items-center h-16">
                {navItems.map((item) => {
                     if (item.id === 'fab') {
                         return (
                            <div key={item.id} className="relative w-1/5">
                                 <button
                                    onClick={onFabClick}
                                    className="absolute bottom-4 left-1/2 -translate-x-1/2 w-16 h-16 bg-gradient-to-r from-emerald-600 via-lime-500 to-green-400 rounded-full flex items-center justify-center text-white shadow-xl transform hover:scale-105 transition-transform"
                                    aria-label="Add new item"
                                >
                                    <PlusIcon className="w-8 h-8"/>
                                </button>
                            </div>
                         );
                     }
                     const isActive = activeView === item.id || (item.id === 'dashboard' && (activeView === 'transactions' || activeView === 'book-settings'));
                     return (
                        <button
                            key={item.id}
                            onClick={() => onSelectView(item.id)}
                            className={`relative flex flex-col items-center justify-center text-xs w-1/5 h-full pt-1 group focus:outline-none focus:ring-2 focus:ring-offset-0 focus:ring-primary-500 rounded-t-lg transition-colors duration-200 ease-in-out`}
                            aria-current={isActive ? 'page' : undefined}
                        >
                             {isActive && (
                                <span className="absolute inset-x-3 sm:inset-x-4 top-1/2 -translate-y-1/2 h-10 bg-gradient-to-r from-emerald-600 via-lime-500 to-green-400 rounded-full shadow-lg opacity-90 dark:opacity-100"></span>
                            )}
                            <div className={`relative z-10 flex flex-col items-center transition-colors ${isActive ? 'text-white' : 'text-gray-500 dark:text-gray-400 group-hover:text-primary-500 dark:group-hover:text-primary-300'}`}>
                                <item.icon className="w-6 h-6 mb-0.5" />
                                <span className="truncate">{item.label}</span>
                            </div>
                        </button>
                     )
                })}
            </div>
        </nav>
    );
};

export default BottomNavBar;