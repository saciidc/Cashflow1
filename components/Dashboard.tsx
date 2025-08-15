import React, { useState, useMemo } from 'react';
import { Business, Book } from '../types';
import { WalletIcon, DocumentChartBarIcon, Squares2X2Icon, Bars3Icon, PlusIcon } from './icons/Icon';
import { useTranslations } from '../hooks/useTranslations';

interface DashboardProps {
    business: Business;
    onViewTransactions: (book: Book) => void;
    onNewBookClick: () => void;
}

const BookCard: React.FC<{
    book: Book;
    t: any;
    onViewTransactions: (book: Book) => void;
}> = ({ book, t, onViewTransactions }) => {
    return (
        <div 
            onClick={() => onViewTransactions(book)}
            className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg flex flex-col cursor-pointer transition-transform hover:scale-[1.03] duration-200"
        >
            <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900/50 rounded-xl flex items-center justify-center flex-shrink-0">
                    <WalletIcon className="w-7 h-7 text-primary-600 dark:text-primary-400"/>
                </div>
                <div className="flex-grow">
                    <h3 className="font-bold text-gray-800 dark:text-gray-100 text-lg line-clamp-2">{book.name}</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{t.dashboard.transactionsCount.replace('{count}', String(book.transactions.length))}</p>
                </div>
            </div>
            <div className="mt-auto pt-4">
                <p className="text-sm text-primary-600 dark:text-primary-400 font-semibold flex items-center gap-1">
                    {t.dashboard.viewTransactions}
                    <span aria-hidden="true">&rarr;</span>
                </p>
            </div>
        </div>
    );
};

const BookListItem: React.FC<{
    book: Book;
    t: any;
    onViewTransactions: (book: Book) => void;
}> = ({ book, t, onViewTransactions }) => {
    return (
        <div onClick={() => onViewTransactions(book)} className="bg-white dark:bg-gray-800 p-3 rounded-xl shadow-md cursor-pointer group hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
            <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center flex-shrink-0">
                    <DocumentChartBarIcon className="w-6 h-6 text-gray-500"/>
                </div>
                <div className="flex-grow">
                    <p className="font-bold text-gray-800 dark:text-gray-200">{book.name}</p>
                    <p className="text-sm text-gray-500">{t.dashboard.transactionsCount.replace('{count}', String(book.transactions.length))}</p>
                </div>
                <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                     <p className="text-sm text-primary-600 dark:text-primary-400 font-semibold flex items-center gap-1">
                        {t.dashboard.viewTransactions}
                        <span aria-hidden="true">&rarr;</span>
                    </p>
                </div>
            </div>
        </div>
    );
};


const Dashboard: React.FC<DashboardProps> = ({ business, onViewTransactions, onNewBookClick }) => {
    const t = useTranslations();
    const [searchTerm, setSearchTerm] = useState('');
    const [layout, setLayout] = useState<'grid' | 'list'>('grid');

    const filteredBooks = useMemo(() => {
        if (!business.books) return [];
        return business.books.filter(book => book.name.toLowerCase().includes(searchTerm.toLowerCase()));
    }, [business.books, searchTerm]);
    
    return (
        <div className="flex-1 flex flex-col">
            <main className="flex-1 overflow-y-auto p-3 sm:p-6 pb-24 lg:pb-6">
                <div className="max-w-7xl mx-auto space-y-6">
                    <div>
                        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-6">
                            <div className="flex-grow w-full">
                                <input
                                    type="text"
                                    value={searchTerm}
                                    onChange={e => setSearchTerm(e.target.value)}
                                    placeholder={t.dashboard.searchBooks}
                                    className="w-full pl-3 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 focus:ring-primary-500 focus:border-primary-500 transition"
                                />
                            </div>
                            <div className="flex items-center gap-2">
                                <button onClick={() => setLayout('grid')} className={`p-2 rounded-lg ${layout === 'grid' ? 'bg-primary-100 text-primary-600 dark:bg-primary-900/50' : 'bg-gray-200 dark:bg-gray-700'}`} aria-label={t.dashboard.gridView}>
                                    <Squares2X2Icon className="w-5 h-5"/>
                                </button>
                                <button onClick={() => setLayout('list')} className={`p-2 rounded-lg ${layout === 'list' ? 'bg-primary-100 text-primary-600 dark:bg-primary-900/50' : 'bg-gray-200 dark:bg-gray-700'}`} aria-label={t.dashboard.listView}>
                                    <Bars3Icon className="w-5 h-5"/>
                                </button>
                                <button
                                    onClick={onNewBookClick}
                                    className="flex items-center gap-2 px-3 py-2 bg-primary-600 text-white text-sm rounded-lg font-semibold hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors shadow-sm"
                                >
                                    <PlusIcon className="w-5 h-5" />
                                    <span className="hidden sm:inline">{t.dashboard.addBook}</span>
                                </button>
                            </div>
                        </div>
                         {filteredBooks.length > 0 ? (
                            layout === 'grid' ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                                    {filteredBooks.map(book => <BookCard key={book.id} book={book} t={t} onViewTransactions={onViewTransactions} />)}
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {filteredBooks.map(book => <BookListItem key={book.id} book={book} t={t} onViewTransactions={onViewTransactions} />)}
                                </div>
                            )
                        ) : (
                            <div className="text-center p-8 text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-800 rounded-xl shadow-md">
                                <p>{business.books.length > 0 ? t.transactions.noFilteredTransactions : t.dashboard.noBooks}</p>
                                {business.books.length === 0 && <button onClick={onNewBookClick} className="mt-2 text-sm font-semibold text-primary-600">{t.dashboard.noBooksCTA}</button>}
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
};

export default Dashboard;
