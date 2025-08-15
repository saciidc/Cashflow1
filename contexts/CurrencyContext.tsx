import React, { createContext, useState, useContext, useMemo } from 'react';
import { Currency } from '../types';
import { CURRENCIES } from '../constants';

interface CurrencyContextType {
    currency: Currency;
    setCurrency: (currency: Currency) => void;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

const validCurrencyCodes = CURRENCIES.map(c => c.code);

export const CurrencyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [currency, setCurrencyState] = useState<Currency>(() => {
        try {
            const storedCurrency = localStorage.getItem('app-currency');
            // Ensure the stored value is a valid currency, otherwise default.
            if (storedCurrency && validCurrencyCodes.includes(storedCurrency as Currency)) {
                 return storedCurrency as Currency;
            }
            return 'SOS';
        } catch {
            return 'SOS';
        }
    });

    const setCurrency = (newCurrency: Currency) => {
        try {
            localStorage.setItem('app-currency', newCurrency);
        } catch (error) {
            console.error('Could not save currency to localStorage', error);
        }
        setCurrencyState(newCurrency);
    };

    const value = useMemo(() => ({ currency, setCurrency }), [currency]);

    return (
        <CurrencyContext.Provider value={value}>
            {children}
        </CurrencyContext.Provider>
    );
};

export const useCurrency = () => {
    const context = useContext(CurrencyContext);
    if (context === undefined) {
        throw new Error('useCurrency must be used within a CurrencyProvider');
    }
    return context;
};