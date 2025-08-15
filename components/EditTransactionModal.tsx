import React, { useState, useEffect } from 'react';
import Modal from './Modal';
import { Transaction, EnrichedTransaction } from '../types';
import { useTranslations } from '../hooks/useTranslations';
import { SparklesIcon } from './icons/Icon';
import Spinner from './Spinner';

interface EditTransactionModalProps {
  transaction: EnrichedTransaction;
  onClose: () => void;
  onSave: (data: Transaction) => void;
}

const EditTransactionModal: React.FC<EditTransactionModalProps> = ({ transaction, onClose, onSave }) => {
    const [description, setDescription] = useState(transaction.description);
    const [amount, setAmount] = useState(String(transaction.amount));
    const [type, setType] = useState<'income' | 'expense'>(transaction.type);
    const [date, setDate] = useState(transaction.date);
    const t = useTranslations();

    useEffect(() => {
        setDescription(transaction.description);
        setAmount(String(transaction.amount));
        setType(transaction.type);
        setDate(transaction.date);
    }, [transaction]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const numericAmount = parseFloat(amount);
    if (description.trim() && !isNaN(numericAmount) && numericAmount > 0 && date) {
      onSave({
        ...transaction,
        description: description.trim(),
        amount: numericAmount,
        type,
        date,
      });
    }
  };
  
  const isFormValid = description.trim() && amount && parseFloat(amount) > 0 && date;

  return (
    <Modal title={t.modals.editTransactionTitle} onClose={onClose} size="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="date" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t.modals.date}</label>
          <input type="date" id="date" value={date} onChange={e => setDate(e.target.value)} required className="input-field" />
        </div>
        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t.modals.description}</label>
          <textarea id="description" value={description} onChange={e => setDescription(e.target.value)} required placeholder={t.modals.descriptionPlaceholder} className="input-field" autoFocus rows={3}/>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
                <label htmlFor="amount" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t.modals.amount}</label>
                <input type="number" id="amount" value={amount} onChange={e => setAmount(e.target.value)} required placeholder="0.00" min="0.01" step="0.01" className="input-field"/>
            </div>
            <div>
                <label htmlFor="type" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t.modals.type}</label>
                <select id="type" value={type} onChange={e => setType(e.target.value as 'income' | 'expense')} required className="input-field h-[42px]">
                    <option value="expense">{t.modals.expense}</option>
                    <option value="income">{t.modals.income}</option>
                </select>
            </div>
        </div>
        
        <style dangerouslySetInnerHTML={{ __html: `
            .input-field {
                display: block;
                width: 100%;
                padding: 0.5rem 0.75rem;
                background-color: #fff;
                border: 1px solid #d1d5db;
                border-radius: 0.5rem;
                box-shadow: 0 1px 2px 0 rgb(0 0 0 / 0.05);
                -webkit-appearance: none;
                -moz-appearance: none;
                appearance: none;
            }
            .dark .input-field {
                background-color: #1f2937; /* gray-800 */
                border-color: #4b5563; /* gray-600 */
            }
            .input-field:focus {
                outline: 2px solid transparent;
                outline-offset: 2px;
                border-color: #16a34a; /* primary-600 */
                box-shadow: 0 0 0 1px #16a34a;
            }
        `}}/>
        
        <div className="mt-6 flex justify-end gap-3">
          <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-semibold text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-gray-600 hover:bg-gray-200 dark:hover:bg-gray-500 rounded-lg transition-colors">
            {t.modals.cancel}
          </button>
          <button type="submit" disabled={!isFormValid} className="px-4 py-2 text-sm font-semibold text-white bg-primary-600 hover:bg-primary-700 rounded-lg transition-colors disabled:bg-primary-400 disabled:cursor-not-allowed">
            {t.modals.saveChanges}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default EditTransactionModal;