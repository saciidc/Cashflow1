

import React, { useState } from 'react';
import Modal from './Modal';
import { Business } from '../types';
import { useTranslations } from '../hooks/useTranslations';

interface InviteUserModalProps {
  businesses: Business[];
  onClose: () => void;
  onInvite: (businessId: string, email: string, role: 'Manager' | 'Member') => void;
}

const InviteUserModal: React.FC<InviteUserModalProps> = ({ businesses, onClose, onInvite }) => {
  const [email, setEmail] = useState('');
  const [businessId, setBusinessId] = useState(businesses.length > 0 ? businesses[0].id : '');
  const [role, setRole] = useState<'Manager' | 'Member'>('Member');
  const t = useTranslations();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email.trim() && businessId) {
      onInvite(businessId, email.trim(), role);
      onClose();
    }
  };

  const isFormValid = email.trim() && businessId;

  return (
    <Modal title={t.modals.inviteUserTitle} onClose={onClose}>
      <form onSubmit={handleSubmit}>
        <div className="space-y-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">{t.modals.inviteUserDesc}</p>
          <div>
            <label htmlFor="userEmail" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {t.modals.emailLabel}
            </label>
            <input
              type="email"
              id="userEmail"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input-field"
              placeholder="user@example.com"
              required
              autoFocus
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
                <label htmlFor="business" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t.modals.businessLabel}
                </label>
                <select
                id="business"
                value={businessId}
                onChange={(e) => setBusinessId(e.target.value)}
                className="input-field"
                required
                >
                <option value="" disabled>{t.modals.selectBusinessPlaceholder}</option>
                {businesses.length > 1 && <option value="__ALL_BUSINESSES__">{t.modals.allBusinesses}</option>}
                {businesses.map((business) => (
                    <option key={business.id} value={business.id}>
                    {business.name}
                    </option>
                ))}
                </select>
            </div>
            <div>
                <label htmlFor="role" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {t.modals.roleLabel}
                </label>
                <select
                    id="role"
                    value={role}
                    onChange={(e) => setRole(e.target.value as 'Manager' | 'Member')}
                    className="input-field"
                    required
                >
                    <option value="Member">{t.settings.roleMember}</option>
                    <option value="Manager">{t.settings.roleManager}</option>
                </select>
            </div>
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
            disabled={!isFormValid}
          >
            {t.modals.sendInvite}
          </button>
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
                color: #e5e7eb;
                background-color: #1f2937;
                border-color: #4b5563;
            }
            .input-field:focus {
                outline: 2px solid transparent;
                outline-offset: 2px;
                border-color: #4f46e5;
                box-shadow: 0 0 0 1px #4f46e5;
            }
        `}}/>
      </form>
    </Modal>
  );
};

export default InviteUserModal;