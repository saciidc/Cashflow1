
import React from 'react';
import Modal from './Modal';
import { useTranslations } from '../hooks/useTranslations';

interface ConfirmDeleteModalProps {
  title: string;
  message: string;
  onClose: () => void;
  onConfirm: () => void;
  confirmText?: string;
}

const ConfirmDeleteModal: React.FC<ConfirmDeleteModalProps> = ({ title, message, onClose, onConfirm, confirmText }) => {
  const t = useTranslations();
  
  return (
    <Modal title={title} onClose={onClose}>
      <div className="space-y-4">
        <p className="text-gray-600 dark:text-gray-300">{message}</p>
      </div>
      <div className="mt-6 flex justify-end gap-3">
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2 text-sm font-semibold text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
        >
          {t.modals.cancel}
        </button>
        <button
          type="button"
          onClick={onConfirm}
          className="px-4 py-2 text-sm font-semibold text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
        >
          {confirmText || t.modals.delete}
        </button>
      </div>
    </Modal>
  );
};

export default ConfirmDeleteModal;