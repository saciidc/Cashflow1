

import { useLanguage } from '../contexts';

export const useTranslations = () => {
    const { translations } = useLanguage();
    return translations;
};
