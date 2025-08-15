
import React from 'react';
import Modal from './Modal';
import { useTranslations } from '../hooks/useTranslations';

interface ConfirmTransferOwnershipModalProps {
  newOwnerEmail: string;
  onClose: () => void;
  onConfirm: () => void;
}

const ConfirmTransferOwnershipModal: React.FC<ConfirmTransferOwnershipModalProps> = ({ newOwnerEmail, onClose, onConfirm }) => {
  const t = useTranslations();
  return (
    <Modal title={t.modals.confirmTransferTitle} onClose={onClose}>
      <div className="space-y-4">
        <p className="text-gray-600 dark:text-gray-300">
          {t.modals.confirmTransferMessage.replace('{email}', newOwnerEmail)}
        </p>
        <div className="text-sm text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-500/10 p-3 rounded-lg border border-amber-200 dark:border-amber-500/20">
          <p className="font-bold">{t.modals.confirmTransferWarningTitle}</p>
          <p className="mt-1">{t.modals.confirmTransferWarning}</p>
        </div>
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
          {t.modals.confirmTransfer}
        </button>
      </div>
    </Modal>
  );
};

export default ConfirmTransferOwnershipModal;