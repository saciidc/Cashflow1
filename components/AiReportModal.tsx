
import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import Modal from './Modal';
import Spinner from './Spinner';
import { LightBulbIcon } from './icons/Icon';
import { useTranslations } from '../hooks/useTranslations';

interface AiReportModalProps {
    isLoading: boolean;
    reportText: string;
    error: string | null;
    onClose: () => void;
}

const AiReportModal: React.FC<AiReportModalProps> = ({ isLoading, reportText, error, onClose }) => {
    const t = useTranslations();
    
    return (
        <Modal title={t.modals.aiReportTitle} onClose={onClose} size="lg">
            {isLoading && (
                <div className="flex flex-col items-center justify-center p-8 space-y-4">
                    <Spinner size="lg" />
                    <p className="text-gray-600 dark:text-gray-300 font-semibold">{t.modals.aiReportGenerating}</p>
                </div>
            )}
            {error && !isLoading && (
                <div className="p-4 text-center">
                    <p className="text-red-500 font-bold mb-2">{t.modals.aiReportErrorTitle}</p>
                    <p className="text-gray-600 dark:text-gray-300">{error}</p>
                </div>
            )}
            {reportText && !isLoading && !error && (
                 <div className="space-y-4">
                    <div className="flex items-center gap-3 p-3 bg-primary-50 dark:bg-primary-900/40 rounded-lg">
                        <LightBulbIcon className="w-8 h-8 text-primary-500 flex-shrink-0" />
                        <p className="text-sm text-primary-700 dark:text-primary-300">{t.modals.aiReportReady}</p>
                    </div>
                    <div className="prose prose-slate dark:prose-invert max-w-none prose-sm sm:prose-base prose-headings:font-bold prose-a:text-primary-600">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                            {reportText}
                        </ReactMarkdown>
                    </div>
                 </div>
            )}
             <div className="mt-6 flex justify-end">
                <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 text-sm font-semibold text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
                >
                    {t.modals.close}
                </button>
            </div>
        </Modal>
    );
};

export default AiReportModal;