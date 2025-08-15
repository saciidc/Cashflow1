

import React, { useState, useEffect } from 'react';
import { TrashIcon, ShareIcon, UserPlusIcon, InformationCircleIcon, BellIcon, UserIcon, EnvelopeIcon, ClipboardIcon, CheckIcon } from './icons/Icon';
import { Theme, Business, User, TeamMember, Currency } from '../types';
import { useLanguage, useCurrency } from '../contexts';
import { useTranslations } from '../hooks/useTranslations';
import { CURRENCIES } from '../constants';

type Tab = 'general' | 'profile' | 'business';

interface SettingsPageProps {
    theme: Theme;
    toggleTheme: () => void;
    businesses: Business[];
    activeBusiness: Business | null;
    currentUser: User;
    onUpdateBusiness: (id: string, name: string) => void;
    onDeleteBusiness: (business: Business) => void;
    onUpdateMemberRole: (memberId: string, role: 'Manager' | 'Member') => void;
    onRemoveMember: (member: TeamMember) => void;
    onInviteMember: (businessId: string, email: string) => void;
    onTransferOwnership: (business: Business, email: string) => void;
    initialTab?: Tab;
}

const SettingCard: React.FC<{ title: string; description: string; children: React.ReactNode; footer?: React.ReactNode; }> = ({ title, description, children, footer }) => (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white">{title}</h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{description}</p>
        </div>
        <div className="p-6">
            {children}
        </div>
        {footer && (
            <div className="bg-gray-50 dark:bg-gray-800/50 px-6 py-4 border-t border-gray-200 dark:border-gray-700 rounded-b-xl text-end">
                {footer}
            </div>
        )}
    </div>
);

const GeneralSettings: React.FC<{ theme: Theme; toggleTheme: () => void; businesses: Business[]; currentUser: User; }> = ({ theme, toggleTheme, businesses, currentUser }) => {
    const { language, setLanguage } = useLanguage();
    const { currency, setCurrency } = useCurrency();
    const t = useTranslations();
    const [notificationsEnabled, setNotificationsEnabled] = useState(true);
    const [isCopied, setIsCopied] = useState(false);

    const handleShare = async () => {
        const shareData = {
            title: t.sidebar.title,
            text: t.settings.shareText,
            url: window.location.origin,
        };
        try {
            if (navigator.share) {
                await navigator.share(shareData);
            } else {
                await navigator.clipboard.writeText(shareData.url);
                alert(t.settings.shareLinkCopied);
            }
        } catch (error) {
            console.error("Could not share:", error);
        }
    };

    const handleEmailBackup = () => {
        const dataToBackup = JSON.stringify({ businesses, user: currentUser }, null, 2);
        const subject = "Cashflow App Data Backup";
        const body = `Here is your data backup from the Cashflow app.\n\nSave the following JSON data to a file (e.g., cashflow_backup.json) to restore it later.\n\n${dataToBackup}`;
        const mailtoLink = `mailto:${currentUser.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
        
        if (mailtoLink.length > 2000) {
            alert("Your data is too large to be sent via email directly. Please use the 'Copy Data' feature instead.");
            return;
        }
        window.location.href = mailtoLink;
    };

    const handleCopyData = () => {
        const dataToBackup = JSON.stringify({ businesses, user: currentUser }, null, 2);
        navigator.clipboard.writeText(dataToBackup).then(() => {
            setIsCopied(true);
            setTimeout(() => setIsCopied(false), 2000);
        });
    };

    return (
        <div className="space-y-6">
            <SettingCard
                title={t.settings.appearance}
                description={t.settings.appearanceDesc}
            >
                <div className="flex items-center justify-between">
                    <label className="text-gray-700 dark:text-gray-300 font-medium">{t.settings.theme}</label>
                    <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-500 capitalize">{theme === 'dark' ? t.settings.dark : t.settings.light}</span>
                        <button
                            onClick={toggleTheme}
                            className={`${theme === 'dark' ? 'bg-primary-600' : 'bg-gray-300'} relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2`}
                            role="switch"
                            aria-checked={theme === 'dark'}
                        >
                            <span
                                aria-hidden="true"
                                className={`${theme === 'dark' ? 'translate-x-5' : 'translate-x-0'} rtl:-translate-x-5 pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out`}
                            />
                        </button>
                    </div>
                </div>
            </SettingCard>
             <SettingCard
                title={t.settings.currency}
                description={t.settings.currencyDesc}
            >
                 <div className="flex items-center justify-between">
                     <label htmlFor="currency-select" className="text-gray-700 dark:text-gray-300 font-medium">{t.settings.currency}</label>
                     <select 
                        id="currency-select" 
                        value={currency} 
                        onChange={(e) => setCurrency(e.target.value as Currency)}
                        className="input-field w-48"
                    >
                        {CURRENCIES.map(c => (
                            <option key={c.code} value={c.code}>{c.code} - {c.name}</option>
                        ))}
                     </select>
                </div>
            </SettingCard>
            <SettingCard
                title={t.settings.language}
                description={t.settings.languageDesc}
            >
                 <div className="flex items-center justify-between">
                     <label htmlFor="language-select" className="text-gray-700 dark:text-gray-300 font-medium">{t.settings.language}</label>
                     <select 
                        id="language-select" 
                        value={language} 
                        onChange={(e) => setLanguage(e.target.value as 'en' | 'ar' | 'so')}
                        className="input-field w-48"
                    >
                        <option value="en">{t.settings.english}</option>
                        <option value="ar">{t.settings.arabic}</option>
                        <option value="so">{t.settings.somali}</option>
                     </select>
                </div>
            </SettingCard>
            <SettingCard
                title={t.settings.dataManagement}
                description={t.settings.dataManagementDesc}
            >
                <div className="space-y-4">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between">
                        <div>
                            <p className="font-medium text-gray-700 dark:text-gray-300">{t.settings.sendBackupEmail}</p>
                            <p className="text-sm text-gray-500 dark:text-gray-400 max-w-md">{t.settings.sendBackupEmailDesc}</p>
                        </div>
                        <button
                            onClick={handleEmailBackup}
                            className="flex-shrink-0 mt-2 sm:mt-0 flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 text-sm rounded-lg font-semibold hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors shadow-sm"
                        >
                            <EnvelopeIcon className="w-5 h-5" />
                            <span>{t.settings.sendAction}</span>
                        </button>
                    </div>
                     <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between">
                        <div>
                            <p className="font-medium text-gray-700 dark:text-gray-300">{t.settings.copyData}</p>
                            <p className="text-sm text-gray-500 dark:text-gray-400 max-w-md">{t.settings.copyDataDesc}</p>
                        </div>
                        <button
                            onClick={handleCopyData}
                            className="flex-shrink-0 mt-2 sm:mt-0 flex items-center gap-2 px-4 py-2 w-32 justify-center bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 text-sm rounded-lg font-semibold hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors shadow-sm disabled:cursor-not-allowed"
                            disabled={isCopied}
                        >
                            {isCopied ? (
                                <>
                                    <CheckIcon className="w-5 h-5 text-green-500" />
                                    <span className="font-semibold">{t.settings.copied}</span>
                                </>
                            ) : (
                                <>
                                    <ClipboardIcon className="w-5 h-5" />
                                    <span>{t.settings.copyAction}</span>
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </SettingCard>
             <SettingCard
                title={t.settings.notifications}
                description={t.settings.notificationsDesc}
            >
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <BellIcon className="w-5 h-5 text-gray-500" />
                        <label className="text-gray-700 dark:text-gray-300 font-medium">{t.settings.enableNotifications}</label>
                    </div>
                    <button
                        onClick={() => setNotificationsEnabled(!notificationsEnabled)}
                        className={`${notificationsEnabled ? 'bg-primary-600' : 'bg-gray-300'} relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2`}
                        role="switch"
                        aria-checked={notificationsEnabled}
                    >
                        <span
                            aria-hidden="true"
                            className={`${notificationsEnabled ? 'translate-x-5' : 'translate-x-0'} rtl:-translate-x-5 pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out`}
                        />
                    </button>
                </div>
            </SettingCard>
            <SettingCard
                title={t.settings.shareApp}
                description={t.settings.shareAppDesc}
            >
                <div className="flex items-center justify-between">
                    <p className="text-gray-700 dark:text-gray-300 font-medium">{t.settings.spreadTheWord}</p>
                    <button
                        onClick={handleShare}
                        className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white text-sm rounded-lg font-semibold hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors shadow-sm"
                    >
                        <ShareIcon className="w-4 h-4" />
                        <span>{t.settings.shareAction}</span>
                    </button>
                </div>
            </SettingCard>
            <SettingCard
                title={t.settings.aboutApp}
                description={t.settings.aboutAppDesc}
            >
                <div className="space-y-3 text-sm">
                    <div className="flex items-center justify-between">
                        <span className="text-gray-600 dark:text-gray-400">{t.settings.version}</span>
                        <span className="font-medium text-gray-800 dark:text-gray-200">1.0.0</span>
                    </div>
                    <div className="flex items-center justify-between">
                        <span className="text-gray-600 dark:text-gray-400">{t.settings.lastUpdated}</span>
                        <span className="font-medium text-gray-800 dark:text-gray-200">{new Date().toLocaleDateString()}</span>
                    </div>
                     <div className="flex items-center justify-between pt-3 border-t border-gray-200 dark:border-gray-700">
                        <a href="#" className="text-primary-600 dark:text-primary-400 hover:underline">{t.settings.terms}</a>
                        <a href="#" className="text-primary-600 dark:text-primary-400 hover:underline">{t.settings.privacy}</a>
                    </div>
                </div>
            </SettingCard>
        </div>
    );
};

const ProfileSettings: React.FC<{ currentUser: User }> = ({ currentUser }) => {
    const t = useTranslations();
    return (
        <SettingCard
            title={t.settings.profileTitle}
            description={t.settings.profileDesc}
            footer={<button className="px-4 py-2 text-sm font-semibold text-white bg-primary-600 hover:bg-primary-700 rounded-lg transition-colors">{t.modals.saveChanges}</button>}
        >
            <div className="space-y-6">
                 <div className="flex items-center gap-5">
                    <span className="relative flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-700">
                        <UserIcon className="h-10 w-10 text-gray-500" />
                    </span>
                    <div>
                        <label htmlFor="avatar-upload" className="cursor-pointer rounded-md bg-white dark:bg-gray-800 font-semibold text-primary-600 dark:text-primary-400 focus-within:outline-none focus-within:ring-2 focus-within:ring-primary-600 focus-within:ring-offset-2 dark:ring-offset-gray-900 hover:text-primary-500">
                            <span>{t.settings.changeAvatar}</span>
                            <input id="avatar-upload" name="avatar-upload" type="file" className="sr-only" />
                        </label>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">PNG, JPG, GIF up to 5MB.</p>
                    </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t.settings.name}</label>
                        <input type="text" id="name" defaultValue={currentUser.name} className="input-field" />
                    </div>
                     <div>
                        <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t.settings.email}</label>
                        <input type="email" id="email" defaultValue={currentUser.email} className="input-field" disabled/>
                    </div>
                </div>
            </div>
        </SettingCard>
    );
};

const BusinessSettings: React.FC<Omit<SettingsPageProps, 'theme' | 'toggleTheme' | 'currentUser' | 'businesses' | 'initialTab'>> = ({ activeBusiness, onUpdateBusiness, onInviteMember, onUpdateMemberRole, onRemoveMember, onTransferOwnership, onDeleteBusiness }) => {
    const [inviteEmail, setInviteEmail] = useState('');
    const [transferEmail, setTransferEmail] = useState('');
    const [editingBusinessName, setEditingBusinessName] = useState('');
    const t = useTranslations();

    const handleInvite = (e: React.FormEvent) => {
        e.preventDefault();
        if (activeBusiness && inviteEmail) {
            onInviteMember(activeBusiness.id, inviteEmail);
            setInviteEmail('');
        }
    };
    
    const handleSaveBusinessName = (e: React.FormEvent) => {
        e.preventDefault();
        if (activeBusiness && editingBusinessName.trim() && editingBusinessName.trim() !== activeBusiness.name) {
            onUpdateBusiness(activeBusiness.id, editingBusinessName.trim());
        }
    }

    if (!activeBusiness) {
        return (
            <div className="p-8 text-center text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-800 rounded-xl shadow-md">
              <InformationCircleIcon className="w-12 h-12 mx-auto text-gray-400" />
              <p className="mt-2 font-semibold">{t.settings.noBusinessSelected}</p>
              <p className="text-sm">{t.settings.noBusinessSelectedDesc}</p>
            </div>
        );
    }
    
    const owner = activeBusiness.team.find(m => m.role === 'Owner');

    return (
        <div className="space-y-6">
            <SettingCard
                title={t.settings.editBusinessName}
                description={t.settings.teamManagementDesc.replace('{businessName}', activeBusiness.name)}
                footer={
                    <button form="edit-name-form" type="submit" className="px-4 py-2 text-sm font-semibold text-white bg-primary-600 hover:bg-primary-700 rounded-lg transition-colors disabled:bg-primary-400" disabled={!editingBusinessName.trim() || editingBusinessName.trim() === activeBusiness.name}>
                        {t.modals.saveChanges}
                    </button>
                }
            >
                <form id="edit-name-form" onSubmit={handleSaveBusinessName}>
                    <label htmlFor="businessName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t.settings.businessName}</label>
                    <input type="text" id="businessName" defaultValue={activeBusiness.name} onChange={e => setEditingBusinessName(e.target.value)} className="input-field"/>
                </form>
            </SettingCard>

            <SettingCard
                title={t.settings.teamManagement}
                description={t.settings.teamManagementDesc.replace('{businessName}', activeBusiness.name)}
            >
                <div className="space-y-4">
                    <form onSubmit={handleInvite} className="flex items-end gap-2">
                        <div className="flex-grow">
                            <label htmlFor="inviteEmail" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t.settings.inviteMember}</label>
                            <input type="email" id="inviteEmail" value={inviteEmail} onChange={e => setInviteEmail(e.target.value)} className="input-field" placeholder={t.settings.inviteEmailPlaceholder} required/>
                        </div>
                        <button type="submit" className="flex items-center gap-2 h-10 px-4 py-2 bg-primary-600 text-white text-sm rounded-lg font-semibold hover:bg-primary-700 transition-colors shadow-sm">
                            <UserPlusIcon className="w-5 h-5"/> {t.settings.invite}
                        </button>
                    </form>
                    <div className="space-y-3 pt-4">
                        {activeBusiness.team.map(member => (
                            <div key={member.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                                <div>
                                    <p className="font-semibold text-gray-800 dark:text-gray-100">{member.name} {member.id === owner?.id && <span className="text-xs text-amber-500 font-bold ms-1">{t.settings.owner}</span>}</p>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">{member.email}</p>
                                </div>
                                 <div className="flex items-center gap-2">
                                    {member.role !== 'Owner' && (
                                        <>
                                            <select value={member.role} onChange={e => onUpdateMemberRole(member.id, e.target.value as 'Manager' | 'Member')} className="input-field text-sm h-9">
                                                <option value="Member">{t.settings.roleMember}</option>
                                                <option value="Manager">{t.settings.roleManager}</option>
                                            </select>
                                            <button onClick={() => onRemoveMember(member)} className="p-2 text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-500 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700" aria-label={`Remove ${member.name}`}>
                                                <TrashIcon className="w-4 h-4" />
                                            </button>
                                        </>
                                    )}
                                 </div>
                            </div>
                        ))}
                    </div>
                </div>
            </SettingCard>
            
            <SettingCard
                title={t.settings.dangerZone}
                description={t.settings.dangerZoneDesc}
            >
                <div className="space-y-4">
                    <div className="flex flex-col md:flex-row items-start md:items-center justify-between p-3 border border-amber-300 dark:border-amber-600 rounded-lg">
                        <div>
                            <p className="font-semibold text-gray-800 dark:text-gray-100">{t.settings.transferOwnership}</p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">{t.settings.transferOwnershipDesc}</p>
                        </div>
                        <div className="flex items-center gap-2 mt-2 md:mt-0">
                            <input type="email" value={transferEmail} onChange={e => setTransferEmail(e.target.value)} className="input-field h-9 text-sm" placeholder={t.settings.transferEmailPlaceholder}/>
                            <button onClick={() => onTransferOwnership(activeBusiness, transferEmail)} disabled={!transferEmail} className="px-3 py-1.5 text-sm font-semibold text-amber-800 dark:text-amber-200 bg-amber-200 dark:bg-amber-500/20 hover:bg-amber-300 dark:hover:bg-amber-500/30 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                                {t.settings.transfer}
                            </button>
                        </div>
                    </div>

                    <div className="flex items-center justify-between p-3 border border-red-300 dark:border-red-600 rounded-lg">
                        <div>
                            <p className="font-semibold text-gray-800 dark:text-gray-100">{t.settings.deleteBusiness}</p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">{t.settings.deleteBusinessDesc}</p>
                        </div>
                        <button onClick={() => onDeleteBusiness(activeBusiness)} className="px-3 py-1.5 text-sm font-semibold text-red-800 dark:text-red-200 bg-red-200 dark:bg-red-500/20 hover:bg-red-300 dark:hover:bg-red-500/30 rounded-lg transition-colors">
                            {t.settings.delete}
                        </button>
                    </div>
                </div>
            </SettingCard>
        </div>
    );
}

const SettingsPage: React.FC<SettingsPageProps> = (props) => {
    const { initialTab } = props;
    const [activeTab, setActiveTab] = useState<Tab>(initialTab || 'general');
    const t = useTranslations();
    
    useEffect(() => {
        if (initialTab) {
            setActiveTab(initialTab);
        }
    }, [initialTab]);

    const TabButton: React.FC<{ tabName: Tab; children: React.ReactNode }> = ({ tabName, children }) => (
        <button
            onClick={() => setActiveTab(tabName)}
            className={`px-3 py-2 text-sm font-medium rounded-md transition-colors -mb-px border-b-2 ${
                activeTab === tabName
                    ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
            }`}
        >
            {children}
        </button>
    );

    return (
        <div className="flex-1 flex flex-col">
            <main className="flex-1 overflow-y-auto">
                <div className="max-w-4xl mx-auto p-3 sm:p-6">
                    <div className="mb-6 border-b border-gray-200 dark:border-gray-700">
                        <nav className="flex space-x-4 rtl:space-x-reverse" aria-label="Tabs">
                            <TabButton tabName="general">{t.settings.general}</TabButton>
                            <TabButton tabName="profile">{t.settings.profile}</TabButton>
                            <TabButton tabName="business">{t.settings.business}</TabButton>
                        </nav>
                    </div>
                    <div>
                        {activeTab === 'general' && <GeneralSettings theme={props.theme} toggleTheme={props.toggleTheme} businesses={props.businesses} currentUser={props.currentUser} />}
                        {activeTab === 'profile' && <ProfileSettings currentUser={props.currentUser} />}
                        {activeTab === 'business' && <BusinessSettings {...props} />}
                    </div>
                </div>
            </main>
             <style dangerouslySetInnerHTML={{ __html: `
                .input-field {
                    display: block;
                    width: 100%;
                    padding: 0.5rem 0.75rem;
                    color: #111827;
                    background-color: #fff;
                    border: 1px solid #d1d5db;
                    border-radius: 0.5rem;
                    box-shadow: 0 1px 2px 0 rgb(0 0 0 / 0.05);
                    -webkit-appearance: none;
                    -moz-appearance: none;
                    appearance: none;
                }
                .dark .input-field {
                    color: #f9fafb;
                    background-color: #1f2937;
                    border-color: #4b5563;
                }
                .input-field:focus {
                    outline: 2px solid transparent;
                    outline-offset: 2px;
                    border-color: #4f46e5;
                    box-shadow: 0 0 0 1px #4f46e5;
                }
                .input-field:disabled {
                    background-color: #f3f4f6;
                    cursor: not-allowed;
                }
                .dark .input-field:disabled {
                    background-color: #374151;
                }
            `}}/>
        </div>
    );
};

export default SettingsPage;
