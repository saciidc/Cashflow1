

import { useLanguage } from '../contexts';

export const useLocale = () => {
    const { language } = useLanguage();
    
    switch(language) {
        case 'ar': return 'ar-SA';
        case 'so': return 'so-SO';
        default: return 'en-US';
    }
};
