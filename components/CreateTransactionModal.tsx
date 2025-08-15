import React, { useState } from 'react';
import Modal from './Modal';
import { Book, Transaction } from '../types';
import { useTranslations } from '../hooks/useTranslations';
import { generateTransactionDescription } from '../services/geminiService';
import { SparklesIcon } from './icons/Icon';
import Spinner from './Spinner';

interface CreateTransactionModalProps {
  book: Book;
  transactionType: 'income' | 'expense';
  onClose: () => void;
  onSave: (data: Omit<Transaction, 'id'>) => void;
}

const CreateTransactionModal: React.FC<CreateTransactionModalProps> = ({ book, transactionType, onClose, onSave }) => {
    const [description, setDescription] = useState('');
    const [amount, setAmount] = useState('');
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [isGenerating, setIsGenerating] = useState(false);
    const t = useTranslations();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const numericAmount = parseFloat(amount);
    if (description.trim() && !isNaN(numericAmount) && numericAmount > 0 && date) {
      onSave({
        description: description.trim(),
        amount: numericAmount,
        type: transactionType,
        date,
      });
    }
  };

  const handleGenerateDescription = async () => {
    if (!description) return;
    setIsGenerating(true);
    try {
        const generated = await generateTransactionDescription(description);
        setDescription(generated);
    } catch (error) {
        console.error(error);
    } finally {
        setIsGenerating(false);
    }
  };

  const isFormValid = description.trim() && amount && parseFloat(amount) > 0 && date;
  const title = transactionType === 'income' 
    ? t.modals.addIncomeTitle.replace('{bookName}', book.name) 
    : t.modals.addExpenseTitle.replace('{bookName}', book.name);

  return (
    <Modal title={title} onClose={onClose} size="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="date" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t.modals.date}</label>
          <input type="date" id="date" value={date} onChange={e => setDate(e.target.value)} required className="input-field" />
        </div>
        <div>
            <div className="flex justify-between items-center mb-1">
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t.modals.description}</label>
                 <button type="button" onClick={handleGenerateDescription} disabled={!description.trim() || isGenerating} className="flex items-center gap-1 text-xs font-semibold text-primary-600 dark:text-primary-400 disabled:opacity-50 disabled:cursor-not-allowed">
                    {isGenerating ? <Spinner size="sm" /> : <SparklesIcon className="w-4 h-4"/>}
                    {t.modals.generateDescription}
                </button>
            </div>
            <textarea id="description" value={description} onChange={e => setDescription(e.target.value)} required placeholder={t.modals.descriptionPlaceholder} className="input-field" autoFocus rows={3}/>
        </div>
        <div>
            <label htmlFor="amount" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t.modals.amount}</label>
            <input type="number" id="amount" value={amount} onChange={e => setAmount(e.target.value)} required placeholder="0.00" min="0.01" step="0.01" className="input-field"/>
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
            {t.modals.saveTransaction}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default CreateTransactionModal;