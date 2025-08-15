import React, { createContext, useState, useContext, useEffect } from 'react';
import Spinner from '../components/Spinner';

type Language = 'en' | 'ar' | 'so';

interface LanguageContextType {
    language: Language;
    setLanguage: (language: Language) => void;
    translations: any;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [language, setLanguage] = useState<Language>('en');
    const [translations, setTranslations] = useState(null); // Initial state is null

    useEffect(() => {
        const fetchTranslations = async () => {
            try {
                const response = await fetch(`/locales/${language}.json`);
                if (!response.ok) {
                    throw new Error(`Could not load ${language}.json`);
                }
                const data = await response.json();
                setTranslations(data);
            } catch (error) {
                console.error(error);
                // Fallback to English on error.
                if (language !== 'en') {
                   setLanguage('en');
                } else {
                    // If English fails to load, the app is unusable. We'll log a critical error
                    // and leave the app in a loading state to prevent a crash.
                    console.error("CRITICAL: Could not load English translations. App cannot start.");
                }
            }
        };

        fetchTranslations();

        // Handle text direction
        if (language === 'ar') {
            document.documentElement.dir = 'rtl';
        } else {
            document.documentElement.dir = 'ltr';
        }

    }, [language]);

    // While translations are loading, show a full-page loader.
    // This prevents components from rendering with an empty/incomplete translation object.
    if (!translations) {
        return (
            <div className="flex items-center justify-center h-screen bg-gray-100 dark:bg-gray-950">
                <Spinner size="lg" />
            </div>
        );
    }

    return (
        <LanguageContext.Provider value={{ language, setLanguage, translations }}>
            {children}
        </LanguageContext.Provider>
    );
};

export const useLanguage = () => {
    const context = useContext(LanguageContext);
    if (context === undefined) {
        throw new Error('useLanguage must be used within a LanguageProvider');
    }
    return context;
};