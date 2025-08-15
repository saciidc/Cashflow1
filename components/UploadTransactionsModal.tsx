import React, { useState, useCallback } from 'react';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import Modal from './Modal';
import Spinner from './Spinner';
import { useTranslations } from '../hooks/useTranslations';
import { Transaction, Book } from '../types';
import { DocumentArrowDownIcon, ArrowUpTrayIcon, InformationCircleIcon } from './icons/Icon';

interface UploadTransactionsModalProps {
  book: Book;
  onClose: () => void;
  onImport: (bookId: string, transactions: Omit<Transaction, 'id'>[]) => void;
}

type ParsedTx = Omit<Transaction, 'id'>;
type Stage = 'upload' | 'preview' | 'importing';

const REQUIRED_HEADERS = ['Date', 'Description', 'Amount', 'Type'];

const UploadTransactionsModal: React.FC<UploadTransactionsModalProps> = ({ book, onClose, onImport }) => {
  const t = useTranslations();
  const [stage, setStage] = useState<Stage>('upload');
  const [file, setFile] = useState<File | null>(null);
  const [fileName, setFileName] = useState('');
  const [parsedTransactions, setParsedTransactions] = useState<ParsedTx[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [isDragging, setIsDragging] = useState(false);

  const resetState = useCallback(() => {
    setFile(null);
    setFileName('');
    setParsedTransactions([]);
    setErrors([]);
    setStage('upload');
  }, []);

  const validateData = useCallback((data: any[], headers: string[]) => {
    const validationErrors: string[] = [];
    const lowercasedHeaders = headers.map(h => h.trim().toLowerCase());
    const missingHeaders = REQUIRED_HEADERS.filter(h => !lowercasedHeaders.includes(h.toLowerCase()));

    if (missingHeaders.length > 0) {
      validationErrors.push(t.modals.missingHeaders.replace('{headers}', missingHeaders.join(', ')));
      setErrors(validationErrors);
      setStage('upload');
      return;
    }

    const validTransactions: ParsedTx[] = [];

    data.forEach((row, index) => {
      const getVal = (header: string) => Object.entries(row).find(([key, _]) => key.trim().toLowerCase() === header.toLowerCase())?.[1] as any || '';
      
      const date = getVal('Date');
      const description = getVal('Description');
      const amountStr = getVal('Amount');
      const type = String(getVal('Type'))?.toLowerCase();

      if (!date && !description && !amountStr && !type) {
        return; // Skip completely empty rows
      }

      let rowHasError = false;
      if (isNaN(new Date(date).getTime())) {
        validationErrors.push(t.modals.validationErrorRow.replace('{row}', String(index + 2)).replace('{error}', `Invalid date format: ${date}`));
        rowHasError = true;
      }
      const amount = parseFloat(amountStr);
      if (isNaN(amount) || amount <= 0) {
        validationErrors.push(t.modals.validationErrorRow.replace('{row}', String(index + 2)).replace('{error}', `Amount must be a positive number: ${amountStr}`));
        rowHasError = true;
      }
      if (type !== 'income' && type !== 'expense') {
        validationErrors.push(t.modals.validationErrorRow.replace('{row}', String(index + 2)).replace('{error}', `Type must be 'income' or 'expense': ${type}`));
        rowHasError = true;
      }
      
      if (!rowHasError) {
        validTransactions.push({
          date: new Date(date).toISOString().split('T')[0],
          description,
          amount,
          type: type as 'income' | 'expense',
        });
      }
    });

    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      setStage('upload');
    } else if (validTransactions.length > 0) {
      setParsedTransactions(validTransactions);
      setStage('preview');
    } else {
      setErrors([t.modals.noValidRows]);
      setStage('upload');
    }
  }, [t]);

  const handleFileChange = useCallback((selectedFile: File | null) => {
    if (!selectedFile) return;

    resetState();
    setFile(selectedFile);
    setFileName(selectedFile.name);

    const isExcel = selectedFile.name.endsWith('.xlsx') || selectedFile.name.endsWith('.xls');

    if (isExcel) {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = e.target?.result;
                const workbook = XLSX.read(data, { type: 'array', cellDates: true });
                const sheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[sheetName];
                const jsonData = XLSX.utils.sheet_to_json(worksheet);
                const headers = (XLSX.utils.sheet_to_json(worksheet, { header: 1 })[0] as string[]) || [];
                validateData(jsonData, headers);
            } catch (err: any) {
                setErrors([`Excel Parsing Error: ${err.message}`]);
                setStage('upload');
            }
        };
        reader.readAsArrayBuffer(selectedFile);
    } else if (selectedFile.name.endsWith('.csv')) {
        Papa.parse<any>(selectedFile, {
            header: true,
            skipEmptyLines: true,
            complete: (results) => {
                validateData(results.data, results.meta.fields || []);
            },
            error: (error: any) => {
                setErrors([`Parsing Error: ${error.message}`]);
            }
        });
    } else {
        setErrors(['Unsupported file type. Please upload a CSV or Excel file.']);
        setStage('upload');
    }
  }, [resetState, validateData]);

  const handleDragEvents = (e: React.DragEvent<HTMLDivElement>, isEntering: boolean) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(isEntering);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileChange(e.dataTransfer.files[0]);
      e.dataTransfer.clearData();
    }
  };

  const handleImport = async () => {
    setStage('importing');
    await new Promise(resolve => setTimeout(resolve, 1000));
    onImport(book.id, parsedTransactions);
    onClose();
  };

  const downloadTemplate = () => {
    const ws_data = [
        REQUIRED_HEADERS,
        ["2023-10-26", "Salary", 1500, "income"],
        ["2023-10-25", "Groceries", 75.50, "expense"]
    ];
    const ws = XLSX.utils.aoa_to_sheet(ws_data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Transactions");
    XLSX.writeFile(wb, "cashflow_template.xlsx");
  };

  const renderContent = () => {
    switch (stage) {
      case 'importing':
        return (
          <div className="flex flex-col items-center justify-center p-8 space-y-4">
            <Spinner size="lg" />
            <p className="text-gray-600 dark:text-gray-300 font-semibold">{t.modals.importing}</p>
          </div>
        );
      case 'preview':
        return (
          <div className="space-y-4">
            <div className="bg-green-50 dark:bg-green-900/40 p-3 rounded-lg text-green-700 dark:text-green-300">
              <p className="font-semibold">{t.modals.previewSuccess.replace('{count}', String(parsedTransactions.length))}</p>
            </div>
            <div className="max-h-64 overflow-y-auto border border-gray-200 dark:border-gray-700 rounded-lg">
                <table className="w-full text-sm">
                    <thead className="bg-gray-50 dark:bg-gray-700/50 sticky top-0">
                        <tr>
                            <th className="p-2 text-start font-medium text-gray-500 dark:text-gray-400">Date</th>
                            <th className="p-2 text-start font-medium text-gray-500 dark:text-gray-400">Description</th>
                            <th className="p-2 text-start font-medium text-gray-500 dark:text-gray-400">Amount</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                        {parsedTransactions.slice(0, 10).map((tx, i) => (
                            <tr key={i}>
                                <td className="p-2">{tx.date}</td>
                                <td className="p-2">{tx.description}</td>
                                <td className={`p-2 font-semibold ${tx.type === 'income' ? 'text-green-600' : 'text-red-500'}`}>{tx.amount}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            {parsedTransactions.length > 10 && <p className="text-xs text-gray-500 text-center">...and {parsedTransactions.length - 10} more rows.</p>}
            <div className="mt-6 flex justify-between items-center">
              <button
                type="button"
                onClick={resetState}
                className="px-4 py-2 text-sm font-semibold text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
              >
                {t.modals.startOver}
              </button>
              <button
                type="button"
                onClick={handleImport}
                className="px-4 py-2 text-sm font-semibold text-white bg-primary-600 hover:bg-primary-700 rounded-lg transition-colors"
              >
                {t.modals.importAction.replace('{count}', String(parsedTransactions.length))}
              </button>
            </div>
          </div>
        );
      case 'upload':
      default:
        return (
          <div className="space-y-4">
            <div
              onDragEnter={(e) => handleDragEvents(e, true)}
              onDragLeave={(e) => handleDragEvents(e, false)}
              onDragOver={(e) => handleDragEvents(e, true)}
              onDrop={handleDrop}
              className={`flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-lg transition-colors ${isDragging ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20' : 'border-gray-300 dark:border-gray-600 hover:border-primary-400'}`}
            >
              <ArrowUpTrayIcon className="w-10 h-10 text-gray-400" />
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-300"><span className="font-semibold text-primary-600 dark:text-primary-400">{t.modals.uploadFile}</span> or drag and drop</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">CSV, XLS, XLSX up to 10MB</p>
              <input type="file" id="file-upload" className="sr-only" accept=".csv,.xlsx,.xls" onChange={(e) => handleFileChange(e.target.files ? e.target.files[0] : null)} />
            </div>
            <div className="flex items-center justify-center gap-4">
              <div className="flex-grow border-t border-gray-200 dark:border-gray-700"></div>
              <span className="text-xs text-gray-500">OR</span>
              <div className="flex-grow border-t border-gray-200 dark:border-gray-700"></div>
            </div>
            <div className="flex flex-col gap-3">
              <label htmlFor="file-upload" className="w-full text-center px-4 py-2 text-sm font-semibold text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors cursor-pointer">
                  {fileName || t.modals.selectFile}
              </label>
              <button
                type="button"
                onClick={downloadTemplate}
                className="flex items-center justify-center gap-2 text-sm text-primary-600 dark:text-primary-400 hover:underline"
              >
                <DocumentArrowDownIcon className="w-4 h-4" />
                {t.modals.downloadTemplate}
              </button>
            </div>
            {errors.length > 0 && (
              <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/40 rounded-lg">
                <h4 className="font-semibold text-red-700 dark:text-red-300">{t.modals.validationErrors}</h4>
                <ul className="mt-2 list-disc list-inside text-sm text-red-600 dark:text-red-400 space-y-1 max-h-32 overflow-y-auto">
                  {errors.slice(0, 5).map((err, i) => <li key={i}>{err}</li>)}
                </ul>
                {errors.length > 5 && <p className="text-xs text-red-500 mt-2">...and {errors.length - 5} more errors.</p>}
              </div>
            )}
             <div className="mt-4 flex items-start gap-3 p-3 bg-blue-50 dark:bg-blue-900/40 rounded-lg">
                <InformationCircleIcon className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-blue-700 dark:text-blue-300">
                    <span className="font-bold">Required columns:</span> Date, Description, Amount, Type. The header names must be an exact match, but are case-insensitive.
                </p>
            </div>
          </div>
        );
    }
  };

  return (
    <Modal title={t.modals.uploadTransactionsTitle.replace('{bookName}', book.name)} onClose={onClose} size="lg">
        {renderContent()}
    </Modal>
  );
};

export default UploadTransactionsModal;