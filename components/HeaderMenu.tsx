import React, { useState, useRef, useEffect } from 'react';
import { EllipsisVerticalIcon } from './icons/Icon';

export interface MenuItem {
    label: string;
    icon: React.FC<{ className?: string }>;
    onClick: () => void;
    isDestructive?: boolean;
}

interface HeaderMenuProps {
    items: MenuItem[];
}

const HeaderMenu: React.FC<HeaderMenuProps> = ({ items }) => {
    const [isOpen, setIsOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);
    const buttonRef = useRef<HTMLButtonElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                menuRef.current && !menuRef.current.contains(event.target as Node) &&
                buttonRef.current && !buttonRef.current.contains(event.target as Node)
            ) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const handleItemClick = (onClick: () => void) => {
        setIsOpen(false);
        onClick();
    };

    return (
        <div className="relative">
            <button
                ref={buttonRef}
                onClick={() => setIsOpen(!isOpen)}
                className="p-2 -m-2 rounded-full text-white hover:bg-black/20"
            >
                <EllipsisVerticalIcon className="w-6 h-6" />
            </button>

            {isOpen && (
                <div
                    ref={menuRef}
                    className="absolute top-full end-0 mt-2 w-56 bg-white dark:bg-gray-800 rounded-lg shadow-2xl border border-gray-200 dark:border-gray-700 z-50 animate-fade-in"
                    style={{ animation: 'fade-in 0.1s ease-out' }}
                >
                    <ul className="py-1">
                        {items.map((item, index) => (
                            <li key={index}>
                                <button
                                    onClick={() => handleItemClick(item.onClick)}
                                    className={`flex items-center gap-3 w-full px-4 py-2 text-sm text-start ${item.isDestructive ? 'text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10' : 'text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700'}`}
                                >
                                    <item.icon className="w-5 h-5" />
                                    <span>{item.label}</span>
                                </button>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
};

export default HeaderMenu;
