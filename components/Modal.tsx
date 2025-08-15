
import React from 'react';
import { XMarkIcon } from './icons/Icon';
import { useTranslations } from '../hooks/useTranslations';

interface ModalProps {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  size?: 'md' | 'lg';
}

const Modal: React.FC<ModalProps> = ({ title, onClose, children, size = 'md' }) => {
  const t = useTranslations();
  const handleContentClick = (e: React.MouseEvent) => e.stopPropagation();

  const sizeClass = {
    md: 'sm:max-w-md',
    lg: 'sm:max-w-lg'
  }[size];

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-0 sm:p-4 z-50"
      onClick={onClose}
    >
      <div
        className={`bg-white dark:bg-gray-800 sm:rounded-2xl shadow-2xl w-full h-full sm:h-auto sm:w-full flex flex-col ${sizeClass} animate-fade-in`}
        onClick={handleContentClick}
      >
        <header className="flex-shrink-0 flex items-center p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-bold text-gray-800 dark:text-white flex-grow">{title}</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            aria-label={t.modals.close}
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </header>
        <div className="p-6 overflow-y-auto flex-grow">
          {children}
        </div>
      </div>
    </div>
  );
};

export default Modal;