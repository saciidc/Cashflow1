import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Business, Transaction } from '../types';
import { useTranslations } from '../hooks/useTranslations';
import { generateReportSummary } from '../services/geminiService';
import AiReportModal from './AiReportModal';
import { useCurrency, useLanguage } from '../contexts';
import { useLocale } from '../hooks/useLocale';
import { ChevronDownIcon, DocumentArrowDownIcon, ArrowsUpDownIcon, SparklesIcon } from './icons/Icon';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import PieChart from './PieChart';
import { AMIRI_FONT_BASE64 } from '../constants';

interface ReportsPageProps {
  activeBusiness: Business;
}

const startOfMonth = new Date();
startOfMonth.setDate(1);

const today = new Date();

type EntryType = 'all' | 'income' | 'expense';
type SortableKeys = 'date' | 'description' | 'amount';
type SortDirection = 'ascending' | 'descending';

const ReportsPage: React.FC<ReportsPageProps> = ({ activeBusiness }) => {
  const t = useTranslations();
  const { currency } = useCurrency();
  const locale = useLocale();
  const { language } = useLanguage();

  const [selectedBookIds, setSelectedBookIds] = useState<string[]>([]);
  const [startDate, setStartDate] = useState(startOfMonth.toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(today.toISOString().split('T')[0]);
  const [entryType, setEntryType] = useState<EntryType>('all');
  const [sortConfig, setSortConfig] = useState<{ key: SortableKeys; direction: SortDirection }>({ key: 'date', direction: 'descending' });
  
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // AI Modal State
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [aiReport, setAiReport] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  const booksForSelection = useMemo(() => activeBusiness.books, [activeBusiness]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
        if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
            setIsDropdownOpen(false);
        }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
        document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [dropdownRef]);

  const handleBookSelection = (bookId: string) => {
    setSelectedBookIds(prev =>
      prev.includes(bookId) ? prev.filter(id => id !== bookId) : [...prev, bookId]
    );
  };
  
  const handleSelectAllBooks = () => {
    if (booksForSelection.length > 0 && selectedBookIds.length === booksForSelection.length) {
      setSelectedBookIds([]);
    } else {
      setSelectedBookIds(booksForSelection.map(b => b.id));
    }
  };
  
  const filteredTransactions = useMemo(() => {
    if (selectedBookIds.length === 0) return [];

    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);

    return activeBusiness.books
      .filter(book => selectedBookIds.includes(book.id))
      .flatMap(book => book.transactions.map(tx => ({ ...tx, bookName: book.name })))
      .filter(tx => {
        const txDate = new Date(tx.date);
        const isDateInRange = txDate >= start && txDate <= end;
        const isTypeMatch = entryType === 'all' || tx.type === entryType;
        return isDateInRange && isTypeMatch;
      });
  }, [activeBusiness, selectedBookIds, startDate, endDate, entryType]);

  const sortedTransactions = useMemo(() => {
    let sortableItems = [...filteredTransactions];
    if (sortConfig !== null) {
        sortableItems.sort((a, b) => {
            let aValue, bValue;
            if (sortConfig.key === 'date') {
                aValue = new Date(a.date).getTime();
                bValue = new Date(b.date).getTime();
            } else {
                aValue = a[sortConfig.key];
                bValue = b[sortConfig.key];
            }

            if (aValue < bValue) {
                return sortConfig.direction === 'ascending' ? -1 : 1;
            }
            if (aValue > bValue) {
                return sortConfig.direction === 'ascending' ? 1 : -1;
            }
            return 0;
        });
    }
    return sortableItems;
  }, [filteredTransactions, sortConfig]);

  const summary = useMemo(() => {
    return sortedTransactions.reduce((acc, tx) => {
        if (tx.type === 'income') {
            acc.income += tx.amount;
        } else {
            acc.expense += tx.amount;
        }
        acc.balance = acc.income - acc.expense;
        return acc;
    }, { income: 0, expense: 0, balance: 0 });
  }, [sortedTransactions]);

  const requestSort = (key: SortableKeys) => {
    let direction: SortDirection = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
        direction = 'descending';
    }
    setSortConfig({ key, direction });
  };
  
  const getSortIndicator = (key: SortableKeys) => {
    if (sortConfig.key !== key) {
        return <ArrowsUpDownIcon className="w-4 h-4 text-gray-400" />;
    }
    if (sortConfig.direction === 'ascending') {
        return <svg className="w-4 h-4 text-gray-600 dark:text-gray-300" fill="currentColor" viewBox="0 0 20 20"><path d="M5 10l5-5 5 5H5z"></path></svg>;
    }
    return <svg className="w-4 h-4 text-gray-600 dark:text-gray-300" fill="currentColor" viewBox="0 0 20 20"><path d="M15 10l-5 5-5-5h10z"></path></svg>;
  };

  const handleGenerateAiReport = async () => {
    if (filteredTransactions.length === 0) {
        alert(t.reports.noDataToAnalyze);
        return;
    }
    setIsAiLoading(true);
    setAiError(null);
    setAiReport('');
    setIsAiModalOpen(true);
    try {
        const summary = await generateReportSummary(filteredTransactions);
        setAiReport(summary);
    } catch (e: any) {
        setAiError(e.message || 'An unexpected error occurred.');
        console.error(e);
    } finally {
        setIsAiLoading(false);
    }
  };

  const handleExportPdf = async () => {
    if (sortedTransactions.length === 0) {
        alert(t.reports.noDataToAnalyze);
        return;
    }
    const doc = new jsPDF({ orientation: 'p', unit: 'pt', format: 'a4' });
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 30;

    if (language === 'ar') {
        try {
            doc.addFileToVFS("Amiri-Regular.ttf", AMIRI_FONT_BASE64);
            doc.addFont("Amiri-Regular.ttf", "Amiri", "normal");
            doc.setFont("Amiri");
        } catch (e) {
            console.error("Failed to load Arabic font for PDF", e);
        }
    }

    const currencyFormatter = (amount: number) => {
        if (currency === 'SOS') {
            return `Ssh ${amount.toLocaleString(locale, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
        }
        return amount.toLocaleString(locale, { style: 'currency', currency: currency, minimumFractionDigits: 2 });
    };

    // Header
    doc.setFillColor(4, 28, 55); // dark blue
    doc.rect(0, 0, pageWidth, 35, 'F');
    doc.setFillColor(255, 255, 255); // White color for logo bg
    doc.circle(margin, 17.5, 10, 'F'); // Draw a white circle
    doc.setTextColor(4, 28, 55); // Dark blue for text
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text('C', margin, 21, { align: 'center' }); // Letter 'C'

    let yPos = 60;
    // Title
    const pdfReportTitle = selectedBookIds.length === 1 
      ? booksForSelection.find(b => b.id === selectedBookIds[0])?.name || t.reports.ledgerBook
      : t.reports.consolidatedLedger;

    doc.setTextColor(0, 0, 0);
    doc.setFontSize(22);
    doc.setFont('helvetica', 'bold');
    doc.text(pdfReportTitle, pageWidth / 2, yPos, { align: 'center' });
    yPos += 20;
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text(activeBusiness.name, pageWidth / 2, yPos, { align: 'center' });
    yPos += 30;

    // Summary Cards
    const cardWidth = (pageWidth - margin * 2 - 20) / 3;
    const cardHeight = 70;
    const cardRadius = 10;
    const balancePdfColor = summary.balance > 0 ? [82, 142, 82] : summary.balance < 0 ? [209, 69, 59] : [29, 78, 216]; // Green, Red, Blue for neutral
    const cards = [
        { title: t.reports.totalCashIn, value: summary.income, color: [82, 142, 82], subtext: t.reports.youllGive },
        { title: t.reports.totalCashOut, value: summary.expense, color: [209, 69, 59], subtext: t.reports.youllGet },
        { title: t.reports.netBalance, value: summary.balance, color: balancePdfColor, subtext: t.reports.youllGet }
    ];

    cards.forEach((card, index) => {
        const xPos = margin + index * (cardWidth + 10);
        doc.setFillColor(card.color[0], card.color[1], card.color[2]);
        doc.roundedRect(xPos, yPos, cardWidth, cardHeight, cardRadius, cardRadius, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.text(card.title, xPos + cardWidth / 2, yPos + 20, { align: 'center' });
        doc.setFontSize(16);
        doc.text(currencyFormatter(card.value), xPos + cardWidth / 2, yPos + 42, { align: 'center' });
        doc.setFontSize(9);
        doc.text(card.subtext, xPos + cardWidth / 2, yPos + 58, { align: 'center' });
    });
    yPos += cardHeight + 30;

    // Table
    const tableHeaders = [t.reports.date, t.reports.details, t.reports.cashIn, t.reports.cashOut, t.reports.balance];
    const colWidths = [80, 165, 90, 90, 110];
    const tableStartX = (pageWidth - colWidths.reduce((a, b) => a + b, 0)) / 2;
    const rowHeight = 25;
    const cellRadius = 8;
    const cellPadding = { top: 15, x: 5 };

    const drawTableRow = (rowData: string[], isHeader: boolean, balanceValue?: number) => {
      let currentX = tableStartX;
      rowData.forEach((cell, i) => {
        const cellText = String(cell);
        doc.setDrawColor(180, 180, 180);

        if (isHeader) {
            doc.setFillColor(230, 230, 230);
            doc.setTextColor(0, 0, 0);
            doc.setFont('helvetica', 'bold');
        } else {
            doc.setFillColor(255, 255, 255);
            if (i === 2) doc.setFillColor(220, 240, 220);

            doc.setTextColor(0, 0, 0);
            doc.setFont('helvetica', 'normal');

            if (i === 4 && balanceValue !== undefined) {
                if (balanceValue > 0) doc.setTextColor(34, 197, 94);
                else if (balanceValue < 0) doc.setTextColor(239, 68, 68);
                doc.setFont('helvetica', 'bold');
            }
        }

        doc.roundedRect(currentX, yPos, colWidths[i], rowHeight, cellRadius, cellRadius, 'FD');
        doc.text(cellText, currentX + colWidths[i] / 2, yPos + cellPadding.top, { align: 'center' });
        
        doc.setTextColor(0, 0, 0);
        doc.setFont('helvetica', 'normal');

        currentX += colWidths[i];
      });
      yPos += rowHeight;
    };
    
    drawTableRow(tableHeaders, true);

    const txsForPdf = [...sortedTransactions]
      .sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
    let runningBalance = 0;

    txsForPdf.forEach(tx => {
      if (tx.type === 'income') {
          runningBalance += tx.amount;
      } else {
          runningBalance -= tx.amount;
      }

      if (yPos > pageHeight - 80) { // Check for new page
        doc.addPage();
        yPos = margin;
        drawTableRow(tableHeaders, true);
      }
      
      const rowData = [
        new Date(tx.date).toLocaleDateString(language === 'ar' ? 'ar-EG' : 'en-GB').replace(/\//g, '-'),
        tx.description,
        tx.type === 'income' ? currencyFormatter(tx.amount) : currencyFormatter(0),
        tx.type === 'expense' ? currencyFormatter(tx.amount) : currencyFormatter(0),
        currencyFormatter(runningBalance)
      ];
      drawTableRow(rowData, false, runningBalance);
    });
    
    yPos += 10;
    
    // Grand Total Section
    const grandTotalLabel = t.reports.grandTotal;
    const grandTotals = [summary.income, summary.expense, summary.balance];
    const grandTotalBalanceColor = summary.balance > 0 ? [82, 142, 82] : summary.balance < 0 ? [209, 69, 59] : [109, 75, 65];
    const grandTotalColors = [[82, 142, 82], [209, 69, 59], grandTotalBalanceColor];
    const grandTotalCellWidths = [90, 90, 110];
    const grandTotalLabelWidth = 80 + 165;
    
    let grandTotalX = tableStartX;
    
    // "Grand Total" Label cell
    doc.setDrawColor(180, 180, 180);
    doc.setFillColor(230, 230, 230);
    doc.roundedRect(grandTotalX, yPos, grandTotalLabelWidth, rowHeight, cellRadius, cellRadius, 'FD');
    doc.setTextColor(0,0,0);
    doc.setFont('helvetica', 'bold');
    doc.text(grandTotalLabel, grandTotalX + grandTotalLabelWidth / 2, yPos + cellPadding.top, { align: 'center' });
    grandTotalX += grandTotalLabelWidth;

    // Total Value cells
    grandTotals.forEach((total, i) => {
      doc.setFillColor(grandTotalColors[i][0], grandTotalColors[i][1], grandTotalColors[i][2]);
      doc.roundedRect(grandTotalX, yPos, grandTotalCellWidths[i], rowHeight, cellRadius, cellRadius, 'F');
      doc.setTextColor(255, 255, 255);
      doc.text(currencyFormatter(total), grandTotalX + grandTotalCellWidths[i] / 2, yPos + cellPadding.top, { align: 'center' });
      grandTotalX += grandTotalCellWidths[i];
    });

    // Footer
    const finalPageHeight = doc.internal.pageSize.getHeight();
    const footerY = finalPageHeight - 25;
    doc.setFillColor(4, 28, 55); // dark blue
    doc.rect(0, footerY - 10, pageWidth, 35, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(10);
    const timestamp = new Date().toLocaleString(language === 'ar' ? 'ar-EG' : 'en-GB', {
        day: '2-digit', month: 'short', year: 'numeric',
        hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false
    }).replace(/,/g, '-').replace(/\s/g, '');
    doc.text(timestamp.toUpperCase(), pageWidth / 2, footerY, { align: 'center' });
    
    const dateStr = new Date().toISOString().slice(0, 10);
    doc.save(`Cashflow-Report-${activeBusiness.name}-${dateStr}.pdf`);
  };

  const FilterButton: React.FC<{ label: string; type: EntryType }> = ({ label, type }) => (
    <button
      onClick={() => setEntryType(type)}
      className={`px-4 py-2 text-sm font-semibold rounded-lg transition-colors ${
        entryType === type 
          ? 'bg-primary-600 text-white shadow-sm' 
          : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600'
      }`}
    >
      {label}
    </button>
  );

  const StatCard: React.FC<{ title: string, value: string, colorClass?: string }> = ({ title, value, colorClass }) => (
    <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-xl text-center transition-transform hover:scale-105 ease-out">
        <p className="text-sm text-gray-500 dark:text-gray-400">{title}</p>
        <p className={`text-2xl font-bold ${colorClass || 'text-gray-800 dark:text-white'}`}>{value}</p>
    </div>
  );
  
  const reportTitle = selectedBookIds.length === 1 && booksForSelection.find(b => b.id === selectedBookIds[0])
    ? booksForSelection.find(b => b.id === selectedBookIds[0])!.name
    : t.reports.consolidatedLedger;
    
  const balanceColor = summary.balance > 0 ? 'text-green-600 dark:text-green-400' : summary.balance < 0 ? 'text-red-600 dark:text-red-400' : 'text-gray-800 dark:text-white';

  return (
    <div className="h-full overflow-y-auto">
      <main className="p-4 lg:p-6 space-y-6">
        <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">{t.reports.books}</label>
              <div className="relative" ref={dropdownRef}>
                <button
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    className="flex items-center justify-between w-full px-3 py-2 text-left bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm"
                >
                    <span className="truncate text-gray-900 dark:text-white">
                        {selectedBookIds.length === 0 ? t.reports.selectBooksPlaceholder : t.reports.booksSelected.replace('{count}', String(selectedBookIds.length))}
                    </span>
                    <ChevronDownIcon className={`w-5 h-5 text-gray-400 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
                </button>
                {isDropdownOpen && (
                    <div className="absolute top-full mt-1 w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-10">
                        <div className="p-2 border-b border-gray-100 dark:border-gray-700">
                            <label className="flex items-center gap-2 px-2 text-sm text-gray-700 dark:text-gray-300 cursor-pointer">
                                <input type="checkbox" onChange={handleSelectAllBooks} checked={booksForSelection.length > 0 && selectedBookIds.length === booksForSelection.length} className="h-4 w-4 rounded border-gray-300 dark:border-gray-600 text-primary-600 focus:ring-primary-500 bg-gray-100 dark:bg-gray-900" />
                                <span>{t.reports.selectAll}</span>
                            </label>
                        </div>
                        <div className="max-h-48 overflow-y-auto p-2">
                            {booksForSelection.length > 0 ? booksForSelection.map(book => (
                                <label key={book.id} className="flex items-center gap-2 px-2 py-1.5 text-sm text-gray-700 dark:text-gray-300 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 rounded">
                                    <input type="checkbox" checked={selectedBookIds.includes(book.id)} onChange={() => handleBookSelection(book.id)} className="h-4 w-4 rounded border-gray-300 dark:border-gray-600 text-primary-600 focus:ring-primary-500 bg-gray-100 dark:bg-gray-900" />
                                    <span className="truncate">{book.name}</span>
                                </label>
                            )) : <p className="text-sm text-gray-500 p-2">{t.reports.noBooksInBusiness}</p>}
                        </div>
                    </div>
                )}
              </div>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t.reports.startDate}</label>
                  <input type="date" id="startDate" value={startDate} onChange={e => setStartDate(e.target.value)} className="input-field" />
                </div>
                <div>
                  <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t.reports.endDate}</label>
                  <input type="date" id="endDate" value={endDate} onChange={e => setEndDate(e.target.value)} className="input-field" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t.reports.entryType}</label>
                <div className="flex gap-2">
                  <FilterButton label={t.reports.all} type="all" />
                  <FilterButton label={t.reports.income} type="income" />
                  <FilterButton label={t.reports.expense} type="expense" />
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {sortedTransactions.length > 0 ? (
          <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg p-6 space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{reportTitle}</h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{activeBusiness.name}</p>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">{t.reports.reportDateRange.replace('{startDate}', startDate).replace('{endDate}', endDate)}</p>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                     <button onClick={handleGenerateAiReport} className="flex items-center gap-2 px-3 py-2 text-sm font-semibold text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors">
                        <SparklesIcon className="w-5 h-5 text-primary-500"/>
                        {t.reports.generateAISummary}
                    </button>
                    <button onClick={handleExportPdf} className="flex items-center gap-2 px-3 py-2 text-sm font-semibold text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors">
                        <DocumentArrowDownIcon className="w-5 h-5"/>
                        {t.reports.exportPDF}
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatCard title={t.reports.totalIncome} value={summary.income.toLocaleString(locale, { style: 'currency', currency })} colorClass="text-green-600 dark:text-green-400"/>
                <StatCard title={t.reports.totalExpenses} value={summary.expense.toLocaleString(locale, { style: 'currency', currency })} colorClass="text-red-600 dark:text-red-400"/>
                <StatCard title={t.reports.netBalance} value={summary.balance.toLocaleString(locale, { style: 'currency', currency })} colorClass={balanceColor} />
            </div>
            
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                    <thead className="bg-gray-50 dark:bg-gray-700/50">
                        <tr>
                            <th scope="col" className="p-3">
                                <button onClick={() => requestSort('date')} className="flex items-center gap-1 font-semibold text-gray-600 dark:text-gray-300">
                                    {t.reports.date}
                                    {getSortIndicator('date')}
                                </button>
                            </th>
                            <th scope="col" className="p-3 font-semibold text-gray-600 dark:text-gray-300">{t.reports.description}</th>
                            <th scope="col" className="p-3 font-semibold text-gray-600 dark:text-gray-300">{t.reports.book}</th>
                            <th scope="col" className="p-3">
                                <button onClick={() => requestSort('amount')} className="w-full flex justify-end items-center gap-1 font-semibold text-gray-600 dark:text-gray-300">
                                    {getSortIndicator('amount')}
                                    {t.reports.amount}
                                </button>
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                        {sortedTransactions.map(tx => (
                            <tr key={tx.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                <td className="p-3 whitespace-nowrap text-gray-700 dark:text-gray-300">{new Date(tx.date).toLocaleDateString(locale)}</td>
                                <td className="p-3 text-gray-700 dark:text-gray-300">{tx.description}</td>
                                <td className="p-3 text-gray-700 dark:text-gray-300">{tx.bookName}</td>
                                <td className={`p-3 text-right font-semibold whitespace-nowrap ${tx.type === 'income' ? 'text-green-600 dark:text-green-400' : 'text-red-500 dark:text-red-400'}`}>
                                    {tx.type === 'income' ? '+' : '-'}{tx.amount.toLocaleString(locale, { style: 'currency', currency })}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
          </div>
        ) : (
          <div className="text-center p-12 bg-white dark:bg-gray-800 shadow-md rounded-lg">
            <p className="font-semibold text-gray-700 dark:text-gray-200 text-lg">{selectedBookIds.length === 0 ? t.reports.noBookSelected : t.reports.noTransactionsFound}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{selectedBookIds.length === 0 ? t.reports.noBookSelectedDesc : t.reports.noTransactionsFoundDesc}</p>
          </div>
        )}
      </main>

      {isAiModalOpen && <AiReportModal isLoading={isAiLoading} reportText={aiReport} error={aiError} onClose={() => setIsAiModalOpen(false)} />}
      
      <style dangerouslySetInnerHTML={{ __html: `
            .input-field {
                display: block;
                width: 100%;
                padding: 0.5rem 0.75rem;
                background-color: #fff;
                border: 1px solid #d1d5db; /* gray-300 */
                border-radius: 0.5rem;
                box-shadow: 0 1px 2px 0 rgb(0 0 0 / 0.05);
                -webkit-appearance: none;
                -moz-appearance: none;
                appearance: none;
            }
            .dark .input-field {
                color: #f9fafb; /* gray-50 */
                background-color: #374151; /* gray-700 */
                border-color: #4b5563; /* gray-600 */
            }
            .input-field:focus {
                outline: 2px solid transparent;
                outline-offset: 2px;
                border-color: #16a34a; /* primary-600 */
                box-shadow: 0 0 0 1px #16a34a;
            }
      `}}/>
    </div>
  );
};

export default ReportsPage;