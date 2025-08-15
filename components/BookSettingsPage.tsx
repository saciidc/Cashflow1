
import React from 'react';
import { Book, Business, User, TeamMember } from '../types';
import { useTranslations } from '../hooks/useTranslations';
import { PencilIcon, ClockIcon, UserGroupIcon, Squares2X2Icon, PlusIcon, TrashIcon } from './icons/Icon';

interface BookSettingsPageProps {
  book: Book;
  business: Business;
  currentUser: User;
  onEditBook: (book: Book) => void;
  onInviteMember: () => void;
  onDeleteBook: (book: Book) => void;
}

const BookSettingsPage: React.FC<BookSettingsPageProps> = ({
  book,
  business,
  currentUser,
  onEditBook,
  onInviteMember,
  onDeleteBook
}) => {
  const t = useTranslations();

  const isOwner = business.team.find(m => m.id === currentUser.id)?.role === 'Owner';

  const renderMember = (member: TeamMember) => {
    const isCurrentUser = member.id === currentUser.id;
    return (
      <div key={member.id} className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-primary-100 dark:bg-primary-900/50 text-primary-700 dark:text-primary-300 flex items-center justify-center font-bold">
          {member.name.charAt(0).toUpperCase()}
        </div>
        <div className="flex-grow">
          <p className="font-semibold text-gray-800 dark:text-gray-100">{member.name} {isCurrentUser && `(${t.bookSettings.you})`}</p>
          <p className="text-sm text-gray-500 dark:text-gray-400">{member.email}</p>
        </div>
        <span className="px-2 py-1 text-xs font-semibold rounded-full bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
          {t.settings[(`role${member.role}` as 'roleOwner' | 'roleManager' | 'roleMember').toLowerCase()] || member.role}
        </span>
      </div>
    );
  };

  return (
    <div className="flex-1 flex flex-col bg-gray-50 dark:bg-slate-900">
      <main className="flex-1 overflow-y-auto p-4 lg:p-6 space-y-6 pb-24">
        <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm">
          <p className="text-sm text-gray-500 dark:text-gray-400">{t.bookSettings.bookName}</p>
          <div className="flex justify-between items-center mt-1">
            <p className="text-xl font-bold text-gray-800 dark:text-gray-100">{book.name}</p>
            {isOwner && (
              <button onClick={() => onEditBook(book)} className="px-4 py-1.5 text-sm font-semibold border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700">
                {t.bookSettings.rename}
              </button>
            )}
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm">
          <div className="p-4 border-b border-gray-100 dark:border-gray-700">
            <h3 className="font-semibold text-gray-800 dark:text-gray-100">{t.bookSettings.generalSettings}</h3>
          </div>
          <div className="p-4 space-y-4">
            <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                    <Squares2X2Icon className="w-6 h-6 text-primary-500" />
                    <div>
                        <p className="font-medium text-gray-700 dark:text-gray-300">{t.bookSettings.entryFields}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{t.bookSettings.entryFieldsDesc}</p>
                    </div>
                </div>
                <span className="px-2 py-0.5 text-xs font-bold text-white bg-green-500 rounded-full">{t.sidebar.new}</span>
            </div>
             <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                    <UserGroupIcon className="w-6 h-6 text-primary-500" />
                    <div>
                        <p className="font-medium text-gray-700 dark:text-gray-300">{t.bookSettings.editRoles}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{t.bookSettings.editRolesDesc}</p>
                    </div>
                </div>
            </div>
             <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                    <ClockIcon className="w-6 h-6 text-primary-500" />
                    <div>
                        <p className="font-medium text-gray-700 dark:text-gray-300">{t.bookSettings.bookActivity}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{t.bookSettings.bookActivityDesc}</p>
                    </div>
                </div>
                <span className="px-2 py-0.5 text-xs font-bold text-white bg-red-500 rounded-full">10 {t.sidebar.new}</span>
            </div>
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm">
           <div className="p-4 border-b border-gray-100 dark:border-gray-700">
             <h3 className="font-semibold text-gray-800 dark:text-gray-100">{t.bookSettings.members} ({business.team.length})</h3>
           </div>
           <div className="p-4 space-y-4">
            {business.team.map(renderMember)}
           </div>
        </div>

        {isOwner && (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm">
                <div className="p-4 border-b border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 rounded-t-xl">
                    <h3 className="font-semibold text-red-800 dark:text-red-200">{t.settings.dangerZone}</h3>
                </div>
                <div className="p-4">
                    <div className="flex justify-between items-center">
                        <div>
                            <p className="font-medium text-gray-800 dark:text-gray-100">{t.bookSettings.deleteBookTitle}</p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">{t.bookSettings.deleteBookDesc}</p>
                        </div>
                        <button 
                            onClick={() => onDeleteBook(book)} 
                            className="px-4 py-2 text-sm font-semibold text-red-600 border border-red-500 rounded-md hover:bg-red-100 dark:hover:bg-red-900/50"
                        >
                            <TrashIcon className="w-4 h-4 inline-block me-2"/>
                            {t.modals.delete}
                        </button>
                    </div>
                </div>
            </div>
        )}
      </main>

      {isOwner && (
         <div className="fixed bottom-0 left-0 right-0 lg:left-72 bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg border-t border-gray-200 dark:border-gray-700 z-20">
              <div className="max-w-4xl mx-auto p-3">
                  <button onClick={onInviteMember} className="w-full flex items-center justify-center gap-2 py-3 bg-primary-600 text-white font-bold rounded-lg shadow-md hover:bg-primary-700 transition-colors">
                      <PlusIcon className="w-6 h-6" />
                      {t.bookSettings.addMember.toUpperCase()}
                  </button>
              </div>
          </div>
      )}

    </div>
  );
};

export default BookSettingsPage;
