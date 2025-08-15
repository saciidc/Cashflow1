import React, { useMemo, useState, useRef, useEffect } from 'react';
import { Book, Transaction, SearchFilters } from '../types';
import { useTranslations } from '../hooks/useTranslations';
import { useCurrency, useLanguage } from '../contexts';
import { useLocale } from '../hooks/useLocale';
import { DocumentArrowDownIcon, EllipsisVerticalIcon, PencilIcon, SparklesIcon, TrashIcon, XMarkIcon } from './icons/Icon';
import { parseNaturalLanguageSearchQuery } from '../services/geminiService';
import Spinner from './Spinner';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { AMIRI_FONT_BASE64 } from '../constants';

interface TransactionsPageProps {
    book: Book;
    onNewTransactionClick: (book: Book, type: 'income' | 'expense') => void;
    onEditTransactionClick: (tx: Transaction) => void;
    onDeleteTransactionClick: (tx: Transaction) => void;
}

const TransactionsPage: React.FC<TransactionsPageProps> = ({
    book,
    onNewTransactionClick,
    onEditTransactionClick,
    onDeleteTransactionClick,
}) => {
    const t = useTranslations();
    const { currency } = useCurrency();
    const locale = useLocale();
    const { language } = useLanguage();
    const [openMenuTxId, setOpenMenuTxId] = useState<string | null>(null);
    const menuRef = useRef<HTMLDivElement>(null);
    
    const [searchQuery, setSearchQuery] = useState('');
    const [aiFilters, setAiFilters] = useState<SearchFilters | null>(null);
    const [isSearching, setIsSearching] = useState(false);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setOpenMenuTxId(null);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!searchQuery.trim()) return;
        
        setIsSearching(true);
        setAiFilters(null);
        try {
            const filters = await parseNaturalLanguageSearchQuery(searchQuery);
            setAiFilters(filters);
        } catch (error) {
            console.error("Search failed", error);
            // Fallback to simple text search on error
            setAiFilters({ text: searchQuery });
        } finally {
            setIsSearching(false);
        }
    };

    const clearSearch = () => {
        setSearchQuery('');
        setAiFilters(null);
    };

    const { groupedTransactions, summary, filteredCount, totalCount } = useMemo(() => {
        let transactions = [...book.transactions];
        
        // Apply AI filters if they exist
        if (aiFilters) {
            transactions = transactions.filter(tx => {
                if (aiFilters.text && !tx.description.toLowerCase().includes(aiFilters.text.toLowerCase())) return false;
                if (aiFilters.type && tx.type !== aiFilters.type) return false;
                if (aiFilters.minAmount && tx.amount < aiFilters.minAmount) return false;
                if (aiFilters.maxAmount && tx.amount > aiFilters.maxAmount) return false;
                
                if (aiFilters.startDate) {
                    const txDate = new Date(tx.date);
                    const startDate = new Date(aiFilters.startDate);
                    startDate.setUTCHours(0,0,0,0);
                    if (txDate < startDate) return false;
                }
                if (aiFilters.endDate) {
                    const txDate = new Date(tx.date);
                    const endDate = new Date(aiFilters.endDate);
                    endDate.setUTCHours(23,59,59,999);
                    if (txDate > endDate) return false;
                }
                
                return true;
            });
        }
        
        const filteredCount = transactions.length;
        const totalCount = book.transactions.length;

        const sorted = [...transactions].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        
        let runningBalance = 0;
        let totalIn = 0;
        let totalOut = 0;
        
        const transactionsWithBalance = sorted.map(tx => {
            if (tx.type === 'income') {
                runningBalance += tx.amount;
                totalIn += tx.amount;
            } else {
                runningBalance -= tx.amount;
                totalOut += tx.amount;
            }
            return { ...tx, balance: runningBalance };
        }).reverse();

        const groups = transactionsWithBalance.reduce((acc, tx) => {
            const date = new Date(tx.date).toLocaleDateString(locale, { year: 'numeric', month: 'long', day: 'numeric' });
            if (!acc[date]) {
                acc[date] = [];
            }
            acc[date].push(tx);
            return acc;
        }, {} as Record<string, (Transaction & { balance: number })[]>);

        return { 
            groupedTransactions: Object.entries(groups),
            summary: {
                income: totalIn,
                expense: totalOut,
                balance: totalIn - totalOut,
            },
            filteredCount,
            totalCount
        };
    }, [book.transactions, locale, aiFilters]);

    const activeFilterCount = aiFilters ? Object.values(aiFilters).filter(v => v !== undefined).length : 0;
    
    const handleExportPdf = () => {
        if (filteredCount === 0) {
            alert(t.reports.noDataToAnalyze);
            return;
        }
    
        const doc = new jsPDF();
    
        if (language === 'ar') {
            try {
                doc.addFileToVFS("Amiri-Regular.ttf", AMIRI_FONT_BASE64);
                doc.addFont("Amiri-Regular.ttf", "Amiri", "normal");
                doc.setFont("Amiri");
            } catch (e) {
                console.error("Failed to load Arabic font for PDF", e);
            }
        }
    
        // Flatten and sort transactions chronologically
        const transactionsToExport = groupedTransactions.flatMap(([, txs]) => txs).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
        doc.setFontSize(18);
        doc.text(`Transactions for ${book.name}`, 14, 22);
        
        doc.setFontSize(11);
        doc.setTextColor(100);

        if (transactionsToExport.length > 0) {
             doc.text(`From: ${new Date(transactionsToExport[0].date).toLocaleDateString(locale)} To: ${new Date(transactionsToExport[transactionsToExport.length - 1].date).toLocaleDateString(locale)}`, 14, 29);
        }
        
        doc.text(`Total In: ${summary.income.toLocaleString(locale, { style: 'currency', currency })}`, 14, 40);
        doc.text(`Total Out: ${summary.expense.toLocaleString(locale, { style: 'currency', currency })}`, 14, 46);
        doc.text(`Net Balance: ${summary.balance.toLocaleString(locale, { style: 'currency', currency })}`, 14, 52);
    
        const tableColumn = ["Date", "Description", "Cash In", "Cash Out"];
        const tableRows: (string | number)[][] = [];
        
        transactionsToExport.forEach(tx => {
            const txData = [
                new Date(tx.date).toLocaleDateString(locale),
                tx.description,
                tx.type === 'income' ? tx.amount.toLocaleString(locale, { minimumFractionDigits: 2 }) : '-',
                tx.type === 'expense' ? tx.amount.toLocaleString(locale, { minimumFractionDigits: 2 }) : '-'
            ];
            tableRows.push(txData);
        });
    
        autoTable(doc, {
            head: [tableColumn],
            body: tableRows,
            startY: 60,
            theme: 'grid',
            styles: language === 'ar' ? { font: 'Amiri', halign: 'right' } : {},
            headStyles: { fillColor: [22, 163, 74], ...(language === 'ar' ? { font: 'Amiri', fontStyle: 'bold' } : {}) },
            columnStyles: {
                0: { halign: 'left' },
                2: { halign: 'right' },
                3: { halign: 'right' },
            },
        });
    
        const dateStr = new Date().toISOString().slice(0, 10);
        doc.save(`transactions-${book.name.replace(/\s/g, '_')}-${dateStr}.pdf`);
    };

    return (
        <div className="flex-1 flex flex-col">
            <main className="flex-1 overflow-y-auto pb-24">
                 <div className="max-w-4xl mx-auto p-4 space-y-6">
                    <div className="flex flex-col sm:flex-row items-center gap-4">
                        <form onSubmit={handleSearch} className="relative w-full sm:flex-grow">
                            <input 
                                type="text"
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                                placeholder={t.transactions.aiSearchPlaceholder}
                                className="w-full pl-4 pr-24 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 focus:ring-primary-500 focus:border-primary-500 transition shadow-sm"
                            />
                            <button type="submit" disabled={isSearching || !searchQuery.trim()} className="absolute inset-y-1.5 end-1.5 flex items-center gap-2 px-4 bg-primary-600 text-white rounded-md font-semibold hover:bg-primary-700 disabled:bg-primary-400 disabled:cursor-not-allowed">
                                {isSearching ? <Spinner size="sm" /> : <SparklesIcon className="w-5 h-5"/>}
                                <span>{t.transactions.search}</span>
                            </button>
                        </form>
                         <button
                            onClick={handleExportPdf}
                            disabled={filteredCount === 0}
                            className="flex-shrink-0 w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-3 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-sm rounded-lg font-semibold hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <DocumentArrowDownIcon className="w-5 h-5"/>
                            <span>{t.reports.exportPDF}</span>
                        </button>
                    </div>
                    
                    {activeFilterCount > 0 && (
                        <div className="flex items-center gap-2 text-sm">
                            <span className="text-gray-500 dark:text-gray-400">{t.transactions.activeFilters}:</span>
                            <div className="flex items-center gap-2 flex-wrap">
                                {Object.entries(aiFilters || {}).map(([key, value]) => value && (
                                    <span key={key} className="px-2 py-1 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-md text-xs">{`${key}: ${value}`}</span>
                                ))}
                                <button onClick={clearSearch} className="flex items-center gap-1 text-red-500 text-xs font-semibold">
                                    <XMarkIcon className="w-4 h-4" /> {t.transactions.clearFilters}
                                </button>
                            </div>
                        </div>
                    )}

                    <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-md">
                        <div className="grid grid-cols-2 gap-4 border-b border-gray-200 dark:border-gray-700 pb-4">
                            <div>
                                <p className="text-sm text-green-600 dark:text-green-400">{t.transactions.totalIn}</p>
                                <p className="text-xl font-bold text-gray-900 dark:text-white">{summary.income.toLocaleString(locale, { style: 'currency', currency })}</p>
                            </div>
                            <div className="text-right rtl:text-left">
                                <p className="text-sm text-red-600 dark:text-red-400">{t.transactions.totalOut}</p>
                                <p className="text-xl font-bold text-gray-900 dark:text-white">{summary.expense.toLocaleString(locale, { style: 'currency', currency })}</p>
                            </div>
                        </div>
                        <div className="pt-4 flex justify-between items-center">
                            <p className="text-sm font-semibold text-gray-500 dark:text-gray-400">{t.transactions.netBookBalance}</p>
                            <p className={`text-lg font-bold ${summary.balance >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-500 dark:text-red-400'}`}>{summary.balance.toLocaleString(locale, { style: 'currency', currency })}</p>
                        </div>
                    </div>
                    
                    {groupedTransactions.length > 0 ? groupedTransactions.map(([date, transactions]) => (
                        <div key={date}>
                            <p className="text-sm font-semibold text-gray-500 dark:text-gray-400 px-2 mb-2">{date}</p>
                            <div className="space-y-2">
                                {transactions.map(tx => (
                                    <div key={tx.id} className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow">
                                        <div className="flex justify-between items-start">
                                            <div className="flex-grow">
                                                <p className="font-semibold text-gray-800 dark:text-gray-100">{tx.description}</p>
                                                {tx.creatorName && (
                                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 inline-block">
                                                        {t.transactions.entryBy.replace('{name}', tx.creatorName)}
                                                        {tx.entryTimestamp && ` at ${new Date(tx.entryTimestamp).toLocaleTimeString(language === 'ar' ? 'ar-EG' : 'en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}`}
                                                    </p>
                                                )}
                                            </div>
                                            <div className="text-right rtl:text-left flex-shrink-0 ml-4 flex items-center gap-2">
                                                <div className="text-right rtl:text-left">
                                                  <p className={`font-bold ${tx.type === 'income' ? 'text-green-600 dark:text-green-400' : 'text-red-500 dark:text-red-400'}`}>{tx.amount.toLocaleString(locale, {style: 'currency', currency})}</p>
                                                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                                        {t.dashboard.balance}: <span className={`font-semibold ${tx.balance >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-500 dark:text-red-400'}`}>{tx.balance.toLocaleString(locale, {style:'currency', currency})}</span>
                                                  </p>
                                                </div>
                                                <div className="relative">
                                                  <button
                                                      onClick={(e) => {
                                                          e.stopPropagation();
                                                          setOpenMenuTxId(openMenuTxId === tx.id ? null : tx.id);
                                                      }}
                                                      className="p-1 -m-1 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 rounded-full"
                                                  >
                                                      <EllipsisVerticalIcon className="w-5 h-5"/>
                                                  </button>
                                                  {openMenuTxId === tx.id && (
                                                      <div ref={menuRef} className="absolute top-full end-0 mt-1 w-36 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg z-10 animate-fade-in-sm">
                                                        <ul className="py-1">
                                                              <li>
                                                                  <button
                                                                      onClick={() => {
                                                                          onEditTransactionClick(tx);
                                                                          setOpenMenuTxId(null);
                                                                      }}
                                                                      className="flex items-center gap-2 w-full px-3 py-1.5 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                                                                  >
                                                                      <PencilIcon className="w-4 h-4"/>
                                                                      <span>{t.modals.edit}</span>
                                                                  </button>
                                                              </li>
                                                              <li>
                                                                  <button
                                                                      onClick={() => {
                                                                          onDeleteTransactionClick(tx);
                                                                          setOpenMenuTxId(null);
                                                                      }}
                                                                      className="flex items-center gap-2 w-full px-3 py-1.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/50"
                                                                  >
                                                                      <TrashIcon className="w-4 h-4"/>
                                                                      <span>{t.modals.delete}</span>
                                                                  </button>
                                                              </li>
                                                        </ul>
                                                        <style>{`
                                                            @keyframes fade-in-sm { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
                                                            .animate-fade-in-sm { animation: fade-in-sm 0.1s ease-out; transform-origin: top right; }
                                                            .rtl .animate-fade-in-sm { transform-origin: top left; }
                                                        `}</style>
                                                      </div>
                                                  )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )) : (
                        <div className="text-center p-12 bg-white dark:bg-gray-800 shadow-md rounded-lg">
                            <p className="font-semibold text-gray-600 dark:text-gray-300 text-lg">
                                {aiFilters ? t.transactions.noFilteredTransactionsAI : t.transactions.noTransactions}
                            </p>
                        </div>
                    )}
                 </div>
            </main>
            
            <div className="fixed bottom-0 left-0 right-0 lg:left-72 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 z-20">
                <div className="max-w-4xl mx-auto p-3 flex gap-3">
                    <button onClick={() => onNewTransactionClick(book, 'income')} className="flex-1 py-3 bg-primary-600 text-white font-bold rounded-lg shadow-md hover:bg-primary-700 transition-colors">
                        {t.transactions.addCashIn.toUpperCase()}
                    </button>
                    <button onClick={() => onNewTransactionClick(book, 'expense')} className="flex-1 py-3 bg-red-600 text-white font-bold rounded-lg shadow-md hover:bg-red-700 transition-colors">
                        {t.transactions.addCashOut.toUpperCase()}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default TransactionsPage;