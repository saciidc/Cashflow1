
import React, { useState, useEffect } from 'react';
import Modal from './Modal';
import { Book, Business } from '../types';
import { useTranslations } from '../hooks/useTranslations';

interface EditBookModalProps {
  book: Book;
  onClose: () => void;
  onSave: (id: string, name: string) => void;
  activeBusiness: Business | null;
}

const EditBookModal: React.FC<EditBookModalProps> = ({ book, onClose, onSave, activeBusiness }) => {
  const [name, setName] = useState(book.name);
  const [error, setError] = useState('');
  const t = useTranslations();

  useEffect(() => {
    setName(book.name);
    setError('');
  }, [book]);

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setName(e.target.value);
    if (error) {
      setError('');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = name.trim();
    if (trimmedName) {
      const isDuplicate = activeBusiness?.books.some(b => b.id !== book.id && b.name.toLowerCase() === trimmedName.toLowerCase());
      if (isDuplicate) {
        setError("A name with that exact spelling already exists. Please choose a different name");
      } else {
        onSave(book.id, trimmedName);
      }
    }
  };

  return (
    <Modal title={t.modals.editBookTitle} onClose={onClose}>
      <form onSubmit={handleSubmit}>
        <div className="space-y-4">
          <div>
            <label htmlFor="bookName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {t.modals.bookNameLabel}
            </label>
            <input
              type="text"
              id="bookName"
              value={name}
              onChange={handleNameChange}
              className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
              required
              autoFocus
            />
            {error && <p className="text-sm text-red-500 mt-2">{error}</p>}
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
            type="submit"
            className="px-4 py-2 text-sm font-semibold text-white bg-primary-600 hover:bg-primary-700 rounded-lg transition-colors disabled:bg-primary-400 disabled:cursor-not-allowed"
            disabled={!name.trim() || name.trim() === book.name}
          >
            {t.modals.saveChanges}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default EditBookModal;