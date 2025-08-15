
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Theme, Business, Book, Transaction, EnrichedTransaction, User, TeamMember, AppView } from './types';
import { INITIAL_BUSINESS_DATA } from './constants';
import { SunIcon, MoonIcon, DocumentChartBarIcon, BuildingOfficeIcon, PlusIcon, ChartPieIcon, Cog6ToothIcon, ChevronDownIcon, PencilIcon, TrashIcon, UserGroupIcon, ArrowLeftOnRectangleIcon, Bars3Icon, ArrowLeftIcon, ClipboardIcon, BookOpenIcon, ClockIcon, DocumentTextIcon, EllipsisVerticalIcon, UserIcon, ArrowUpTrayIcon } from './components/icons/Icon';
import CreateBusinessModal from './components/CreateBusinessModal';
import EditBusinessModal from './components/EditBusinessModal';
import CreateBookModal from './components/CreateBookModal';
import EditBookModal from './components/EditBookModal';
import CreateTransactionModal from './components/CreateTransactionModal';
import EditTransactionModal from './components/EditTransactionModal';
import ConfirmDeleteModal from './components/ConfirmDeleteModal';
import ConfirmTransferOwnershipModal from './components/ConfirmTransferOwnershipModal';
import Dashboard from './components/Dashboard';
import ReportsPage from './components/ReportsPage';
import SettingsPage from './components/SettingsPage';
import TransactionsPage from './components/TransactionsPage';
import UsersPage from './components/UsersPage';
import InviteUserModal from './components/InviteUserModal';
import { useTranslations } from './hooks/useTranslations';
import LoginPage from './components/LoginPage';
import SignUpPage from './components/SignUpPage';
import BottomNavBar from './components/BottomNavBar';
import UploadTransactionsModal from './components/UploadTransactionsModal';
import BusinessSwitcher from './components/BusinessSwitcher';
import BookSettingsPage from './components/BookSettingsPage';
import HeaderMenu from './components/HeaderMenu';
import { useLocale } from './hooks/useLocale';
import { useLanguage, useCurrency } from './contexts';

const App: React.FC = () => {
    const { language, translations: t } = useLanguage();
    const { currency, setCurrency } = useCurrency();
    const locale = useLocale();

    const [theme, setTheme] = useState<Theme>(() => {
        const storedTheme = localStorage.getItem('theme');
        return (storedTheme as Theme) || Theme.LIGHT;
    });

    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [authScreen, setAuthScreen] = useState<'login' | 'signup'>('login');
    const [currentUser, setCurrentUser] = useState<User | null>(null);

    const [businesses, setBusinesses] = useState<Business[]>(INITIAL_BUSINESS_DATA);
    const [activeBusiness, setActiveBusiness] = useState<Business | null>(null);
    const [activeBook, setActiveBook] = useState<Book | null>(null);

    const [activeView, setActiveView] = useState<AppView>('dashboard');
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    // Modal states
    const [isCreateBusinessModalOpen, setIsCreateBusinessModalOpen] = useState(false);
    const [editingBusiness, setEditingBusiness] = useState<Business | null>(null);
    const [deletingItem, setDeletingItem] = useState<{ title: string; message: string; onConfirm: () => void, confirmText?: string } | null>(null);
    const [isCreateBookModalOpen, setIsCreateBookModalOpen] = useState(false);
    const [editingBook, setEditingBook] = useState<Book | null>(null);
    const [isCreateTransactionModalOpen, setIsCreateTransactionModalOpen] = useState<{ isOpen: boolean, book: Book | null, type: 'income' | 'expense' }>({ isOpen: false, book: null, type: 'expense' });
    const [editingTransaction, setEditingTransaction] = useState<EnrichedTransaction | null>(null);
    const [isInviteUserModalOpen, setIsInviteUserModalOpen] = useState(false);
    const [transferringOwnership, setTransferringOwnership] = useState<{business: Business, email: string} | null>(null);
    const [uploadingTransactionsToBook, setUploadingTransactionsToBook] = useState<Book | null>(null);

    // Effect for theme
    useEffect(() => {
        if (theme === Theme.DARK) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
        localStorage.setItem('theme', theme);
    }, [theme]);

    // Effect for data hydration from localStorage
    useEffect(() => {
        try {
            const storedAuth = localStorage.getItem('isAuthenticated');
            if (storedAuth === 'true') {
                const storedUser = localStorage.getItem('currentUser');
                const storedBusinesses = localStorage.getItem('businesses');
                const storedActiveBusinessId = localStorage.getItem('activeBusinessId');
    
                if (storedUser) setCurrentUser(JSON.parse(storedUser));
                if (storedBusinesses) {
                    const loadedBusinesses: Business[] = JSON.parse(storedBusinesses);
                    setBusinesses(loadedBusinesses);
                    if (storedActiveBusinessId) {
                        const foundBusiness = loadedBusinesses.find(b => b.id === storedActiveBusinessId);
                        setActiveBusiness(foundBusiness || loadedBusinesses[0] || null);
                    } else if (loadedBusinesses.length > 0) {
                        setActiveBusiness(loadedBusinesses[0]);
                    }
                }
                setIsAuthenticated(true);
            }
        } catch (error) {
            console.error("Failed to load data from localStorage", error);
            // Clear potentially corrupted storage
            localStorage.clear();
        }
    }, []);

    // Effect to persist data changes
    useEffect(() => {
        if (isAuthenticated) {
            try {
                localStorage.setItem('businesses', JSON.stringify(businesses));
                if (activeBusiness) {
                    localStorage.setItem('activeBusinessId', activeBusiness.id);
                }
                if (currentUser) {
                    localStorage.setItem('currentUser', JSON.stringify(currentUser));
                }
            } catch (error) {
                console.error("Failed to save data to localStorage", error);
            }
        }
    }, [businesses, activeBusiness, currentUser, isAuthenticated]);
    

    const toggleTheme = () => {
        setTheme(prevTheme => prevTheme === Theme.LIGHT ? Theme.DARK : Theme.LIGHT);
    };

    const handleLogin = (email: string) => {
        // Mock login
        const user: User = { id: 'user-1', name: email.split('@')[0], email };
        setCurrentUser(user);

        if (businesses.length === 0) {
            // First time login, create sample data
            const newBusiness: Business = {
                id: `business-${Date.now()}`,
                name: `${email.split('@')[0]}'s Business`,
                books: [],
                team: [{id: user.id, name: user.name, email: user.email, role: 'Owner'}]
            };
            setBusinesses([newBusiness]);
            setActiveBusiness(newBusiness);
        } else {
             // Returning user, check if they are part of any team
            let userIsMember = false;
            let firstBusinessForUser: Business | null = null;
            
            for(const business of businesses) {
                if(business.team.some(member => member.email.toLowerCase() === user.email.toLowerCase())) {
                    userIsMember = true;
                    if(!firstBusinessForUser) {
                        firstBusinessForUser = business;
                    }
                }
            }
            
            if(userIsMember && firstBusinessForUser) {
                 setActiveBusiness(firstBusinessForUser);
            } else if (businesses.length > 0) {
                 // default to first business if user is not a member of any
                 setActiveBusiness(businesses[0]);
            }
        }
        setIsAuthenticated(true);
        localStorage.setItem('isAuthenticated', 'true');
    };

    const handleSignUp = (fullName: string, email: string) => {
        const user: User = { id: `user-${Date.now()}`, name: fullName, email };
        setCurrentUser(user);
        
        const newBusiness: Business = {
            id: `business-${Date.now()}`,
            name: `${fullName}'s Business`,
            books: [],
            team: [{id: user.id, name: user.name, email: user.email, role: 'Owner'}]
        };
        
        setBusinesses([newBusiness]);
        setActiveBusiness(newBusiness);
        setIsAuthenticated(true);
        localStorage.setItem('isAuthenticated', 'true');
    };

    const handleLogout = () => {
        setIsAuthenticated(false);
        setCurrentUser(null);
        setActiveBusiness(null);
        setActiveBook(null);
        setActiveView('dashboard');
        localStorage.removeItem('isAuthenticated');
        localStorage.removeItem('currentUser');
        // We might want to keep business data
        // localStorage.removeItem('businesses');
        // localStorage.removeItem('activeBusinessId');
    };
    
    const handleSelectView = (view: AppView) => {
        setActiveView(view);
        if (view !== 'transactions' && view !== 'book-settings') {
            setActiveBook(null);
        }
        setIsSidebarOpen(false); // Close sidebar on mobile nav
    };

    const handleCreateBusiness = (name: string) => {
        if (!currentUser) return;
        const newBusiness: Business = {
            id: `business-${Date.now()}`,
            name,
            books: [],
            team: [{id: currentUser.id, name: currentUser.name, email: currentUser.email, role: 'Owner'}]
        };
        const updatedBusinesses = [...businesses, newBusiness];
        setBusinesses(updatedBusinesses);
        setActiveBusiness(newBusiness);
        setIsCreateBusinessModalOpen(false);
    };
    
    const handleUpdateBusiness = (id: string, name: string) => {
        const updatedBusinesses = businesses.map(b => b.id === id ? { ...b, name } : b);
        setBusinesses(updatedBusinesses);
        if (activeBusiness?.id === id) {
            setActiveBusiness(prev => prev ? { ...prev, name } : null);
        }
        setEditingBusiness(null);
    };

    const handleDeleteBusiness = (business: Business) => {
        setDeletingItem({
            title: t.modals.deleteBusinessTitle,
            message: t.modals.deleteBusinessMessage.replace('{businessName}', business.name),
            onConfirm: () => {
                const updatedBusinesses = businesses.filter(b => b.id !== business.id);
                setBusinesses(updatedBusinesses);
                if (activeBusiness?.id === business.id) {
                    setActiveBusiness(updatedBusinesses[0] || null);
                }
                setDeletingItem(null);
            }
        });
    };

    const handleSelectBusiness = (business: Business) => {
        setActiveBusiness(business);
        setActiveBook(null);
        setActiveView('dashboard');
    };
    
    const handleCreateBook = (name: string) => {
        if (!activeBusiness) return;
        const newBook: Book = {
            id: `book-${Date.now()}`,
            name,
            transactions: []
        };
        const updatedBusiness = {
            ...activeBusiness,
            books: [...activeBusiness.books, newBook]
        };
        const updatedBusinesses = businesses.map(b => b.id === activeBusiness.id ? updatedBusiness : b);
        setBusinesses(updatedBusinesses);
        setActiveBusiness(updatedBusiness);
        setIsCreateBookModalOpen(false);
    };

    const handleUpdateBook = (id: string, name: string) => {
        if (!activeBusiness) return;
        const updatedBooks = activeBusiness.books.map(b => b.id === id ? { ...b, name } : b);
        const updatedBusiness = { ...activeBusiness, books: updatedBooks };
        const updatedBusinesses = businesses.map(b => b.id === activeBusiness.id ? updatedBusiness : b);
        setBusinesses(updatedBusinesses);
        setActiveBusiness(updatedBusiness);
        setEditingBook(null);
    };

    const handleEditBook = (book: Book) => {
        setEditingBook(book);
    };

    const handleDeleteBook = (book: Book) => {
         if (!activeBusiness) return;
        setDeletingItem({
            title: t.modals.deleteBookTitle,
            message: t.modals.deleteBookMessage.replace('{bookName}', book.name),
            onConfirm: () => {
                if (!activeBusiness) return;
                const updatedBooks = activeBusiness.books.filter(b => b.id !== book.id);
                const updatedBusiness = { ...activeBusiness, books: updatedBooks };
                const updatedBusinesses = businesses.map(b => b.id === activeBusiness.id ? updatedBusiness : b);

                setBusinesses(updatedBusinesses);
                setActiveBusiness(updatedBusiness);
                setActiveBook(null);
                setActiveView('dashboard');
                setDeletingItem(null);
            }
        });
    };
    
    const handleViewTransactions = (book: Book) => {
        setActiveBook(book);
        setActiveView('transactions');
    };

    const handleNewTransactionClick = (book: Book, type: 'income' | 'expense') => {
        setIsCreateTransactionModalOpen({ isOpen: true, book, type });
    };

    const handleCreateTransaction = (data: Omit<Transaction, 'id'>) => {
        if (!activeBusiness || !isCreateTransactionModalOpen.book || !currentUser) return;
        
        const newTransaction: Transaction = {
            ...data,
            id: `tx-${Date.now()}`,
            creatorId: currentUser.id,
            creatorName: currentUser.name,
            entryTimestamp: new Date().toISOString()
        };
        
        const bookToUpdate = isCreateTransactionModalOpen.book;

        const updatedBooks = activeBusiness.books.map(b => {
            if (b.id === bookToUpdate.id) {
                return { ...b, transactions: [...b.transactions, newTransaction] };
            }
            return b;
        });

        const updatedBusiness = { ...activeBusiness, books: updatedBooks };
        const updatedBusinesses = businesses.map(b => b.id === activeBusiness.id ? updatedBusiness : b);
        
        setBusinesses(updatedBusinesses);
        setActiveBusiness(updatedBusiness);
        setActiveBook(updatedBusiness.books.find(b => b.id === bookToUpdate.id) || null);
        setIsCreateTransactionModalOpen({ isOpen: false, book: null, type: 'expense' });
    };

    const handleEditTransactionClick = (tx: Transaction) => {
        if (!activeBook) return;
        const enrichedTx: EnrichedTransaction = { ...tx, bookId: activeBook.id };
        setEditingTransaction(enrichedTx);
    };

    const handleUpdateTransaction = (updatedTx: Transaction) => {
        if (!activeBusiness || !editingTransaction) return;

        const bookId = editingTransaction.bookId;

        const updatedBooks = activeBusiness.books.map(b => {
            if (b.id === bookId) {
                const updatedTransactions = b.transactions.map(tx => tx.id === updatedTx.id ? updatedTx : tx);
                return { ...b, transactions: updatedTransactions };
            }
            return b;
        });
        
        const updatedBusiness = { ...activeBusiness, books: updatedBooks };
        const updatedBusinesses = businesses.map(b => b.id === activeBusiness.id ? updatedBusiness : b);
        
        setBusinesses(updatedBusinesses);
        setActiveBusiness(updatedBusiness);
        setActiveBook(updatedBusiness.books.find(b => b.id === bookId) || null);
        setEditingTransaction(null);
    };

    const handleDeleteTransactionClick = (tx: Transaction) => {
        if (!activeBook || !activeBusiness) return;
        const bookId = activeBook.id;

        setDeletingItem({
            title: t.modals.deleteTransactionTitle,
            message: t.modals.deleteTransactionMessage,
            onConfirm: () => {
                const updatedBooks = activeBusiness.books.map(b => {
                    if (b.id === bookId) {
                        return { ...b, transactions: b.transactions.filter(t => t.id !== tx.id) };
                    }
                    return b;
                });
                const updatedBusiness = { ...activeBusiness, books: updatedBooks };
                const updatedBusinesses = businesses.map(b => b.id === activeBusiness.id ? updatedBusiness : b);
                
                setBusinesses(updatedBusinesses);
                setActiveBusiness(updatedBusiness);
                setActiveBook(updatedBusiness.books.find(b => b.id === bookId) || null);
                setDeletingItem(null);
            }
        });
    };
    
    const handleInviteMember = (businessId: string, email: string, role: 'Manager' | 'Member' = 'Member') => {
        console.log(`Inviting ${email} to business ${businessId} as a ${role}`);
        // This is a mock implementation.
        // In a real app, you would send an invite and the user would accept.
        // Here, we'll just add them to the team.
        const newMember: TeamMember = {
            id: `user-${Date.now()}`,
            name: email.split('@')[0], // Mock name
            email,
            role,
        };

        const businessesToUpdate = businessId === '__ALL_BUSINESSES__' 
            ? businesses.map(b => b.id) 
            : [businessId];

        const updatedBusinesses = businesses.map(business => {
            if (businessesToUpdate.includes(business.id) && !business.team.some(m => m.email.toLowerCase() === email.toLowerCase())) {
                return {
                    ...business,
                    team: [...business.team, newMember]
                }
            }
            return business;
        });

        setBusinesses(updatedBusinesses);
        if (activeBusiness && businessesToUpdate.includes(activeBusiness.id)) {
            setActiveBusiness(updatedBusinesses.find(b => b.id === activeBusiness.id) || null);
        }
        setIsInviteUserModalOpen(false);
    };
    
    const handleUpdateMemberRole = (memberId: string, role: 'Manager' | 'Member') => {
        if (!activeBusiness) return;

        const updatedTeam = activeBusiness.team.map(m => m.id === memberId ? { ...m, role } : m);
        const updatedBusiness = { ...activeBusiness, team: updatedTeam };
        const updatedBusinesses = businesses.map(b => b.id === activeBusiness.id ? updatedBusiness : b);
        
        setBusinesses(updatedBusinesses);
        setActiveBusiness(updatedBusiness);
    };

    const handleRemoveMember = (memberToRemove: TeamMember) => {
        if (!activeBusiness) return;
        setDeletingItem({
            title: t.modals.removeMemberTitle,
            message: t.modals.removeMemberMessage.replace('{userName}', memberToRemove.name).replace('{businessName}', activeBusiness.name),
            onConfirm: () => {
                const updatedTeam = activeBusiness.team.filter(m => m.id !== memberToRemove.id);
                const updatedBusiness = { ...activeBusiness, team: updatedTeam };
                const updatedBusinesses = businesses.map(b => b.id === activeBusiness.id ? updatedBusiness : b);
                
                setBusinesses(updatedBusinesses);
                setActiveBusiness(updatedBusiness);
                setDeletingItem(null);
            },
            confirmText: t.modals.remove
        });
    };

    const handleTransferOwnership = (business: Business, email: string) => {
        setTransferringOwnership({business, email});
    };

    const onConfirmTransferOwnership = (business: Business, email: string) => {
        if (!currentUser) return;
        const currentOwnerId = currentUser.id;
        
        // Find if the target user is already a member
        const targetMember = business.team.find(m => m.email.toLowerCase() === email.toLowerCase());

        let updatedTeam: TeamMember[];

        if(targetMember) {
            // User exists, update roles
            updatedTeam = business.team.map(m => {
                if (m.id === currentOwnerId) return { ...m, role: 'Manager' as 'Manager' }; // Downgrade current owner
                if (m.id === targetMember.id) return { ...m, role: 'Owner' as 'Owner' }; // Upgrade target
                return m;
            });
        } else {
             // User is not in the team, add them as owner and downgrade current owner
            const newOwner: TeamMember = {
                id: `user-${Date.now()}`,
                name: email.split('@')[0], // mock name
                email,
                role: 'Owner'
            };
            updatedTeam = business.team.map(m => m.id === currentOwnerId ? { ...m, role: 'Manager' } : m);
            updatedTeam.push(newOwner);
        }
        
        const updatedBusiness = { ...business, team: updatedTeam };
        const updatedBusinesses = businesses.map(b => b.id === business.id ? updatedBusiness : b);
        setBusinesses(updatedBusinesses);
        if (activeBusiness?.id === business.id) {
            setActiveBusiness(updatedBusiness);
        }
        setTransferringOwnership(null);
    };
    
    const handleImportTransactions = (bookId: string, transactions: Omit<Transaction, 'id'>[]) => {
        if (!activeBusiness || !currentUser) return;

        const newTransactions = transactions.map(tx => ({
            ...tx,
            id: `tx-${Date.now()}-${Math.random()}`,
            creatorId: currentUser.id,
            creatorName: currentUser.name,
            entryTimestamp: new Date().toISOString()
        }));

        const updatedBooks = activeBusiness.books.map(b => {
            if (b.id === bookId) {
                return { ...b, transactions: [...b.transactions, ...newTransactions] };
            }
            return b;
        });

        const updatedBusiness = { ...activeBusiness, books: updatedBooks };
        const updatedBusinesses = businesses.map(b => b.id === activeBusiness.id ? updatedBusiness : b);
        
        setBusinesses(updatedBusinesses);
        setActiveBusiness(updatedBusiness);
        setUploadingTransactionsToBook(null);
    };

    const handleFabClick = () => {
        if (activeView === 'dashboard' || activeView === 'transactions' || activeView === 'book-settings') {
            if (activeBook) {
                // Open a menu to choose income or expense
                // For now, default to expense
                 setIsCreateTransactionModalOpen({ isOpen: true, book: activeBook, type: 'expense' });
            } else if (activeBusiness?.books.length === 1) {
                setIsCreateTransactionModalOpen({ isOpen: true, book: activeBusiness.books[0], type: 'expense' });
            } else {
                // If multiple books, maybe show a book selector first.
                // For now, do nothing or prompt to select a book.
                alert("Please select a book from the dashboard to add a transaction.");
            }
        } else if (activeView === 'users') {
            setIsInviteUserModalOpen(true);
        } else if (activeView === 'settings') {
            // maybe create a business
             setIsCreateBusinessModalOpen(true);
        } else if (activeView === 'reports') {
            // maybe create new report template
        }
    };
    
    const getPageTitle = () => {
        if (activeView === 'transactions' || activeView === 'book-settings') {
            return activeBook?.name ?? t.sidebar.dashboard;
        }
        return t.sidebar[activeView] ?? t.sidebar.dashboard;
    };
    
    const headerMenu: { label: string; icon: React.FC<any>; onClick: () => void; isDestructive?: boolean; }[] = useMemo(() => {
        const items = [];
        if (activeView === 'transactions' && activeBook) {
            items.push({ label: t.header.uploadTransactions, icon: ArrowUpTrayIcon, onClick: () => setUploadingTransactionsToBook(activeBook) });
            items.push({ label: t.header.bookSettings, icon: Cog6ToothIcon, onClick: () => setActiveView('book-settings') });
        }
        if (activeView === 'dashboard' && activeBusiness) {
            items.push({ label: t.header.addBusiness, icon: PlusIcon, onClick: () => setIsCreateBusinessModalOpen(true) });
            items.push({ label: t.header.editBusiness, icon: PencilIcon, onClick: () => setEditingBusiness(activeBusiness) });
        }
        return items;
    }, [activeView, activeBook, activeBusiness, t]);

    const SidebarLink: React.FC<{
        view: AppView;
        icon: React.ElementType;
        label: string;
    }> = ({ view, icon: Icon, label }) => {
        const isActive = activeView === view || (view === 'dashboard' && (activeView === 'transactions' || activeView === 'book-settings'));
        return (
            <li>
                <button
                    onClick={() => handleSelectView(view)}
                    className={`flex items-center p-3 w-full text-base rounded-lg transition-colors group ${
                        isActive
                            ? 'bg-gradient-to-r from-emerald-600 via-lime-500 to-green-400 text-white shadow-lg'
                            : 'text-gray-500 hover:bg-gray-200 dark:text-gray-400 dark:hover:bg-gray-700'
                    }`}
                >
                    <Icon className="w-6 h-6" />
                    <span className="ms-3 flex-1 text-left whitespace-nowrap rtl:text-right">{label}</span>
                </button>
            </li>
        );
    };

    const Sidebar: React.FC<{
        activeView: AppView;
        onSelectView: (view: AppView) => void;
        isSidebarOpen: boolean;
        onLogout: () => void;
        t: any;
    }> = ({ activeView, onSelectView, isSidebarOpen, onLogout, t }) => {
        return (
            <>
                {/* Desktop Sidebar */}
                <aside className="hidden lg:flex lg:flex-col lg:w-72 bg-white dark:bg-gray-800 border-e border-gray-200 dark:border-gray-700 flex-shrink-0">
                     <div className="flex items-center h-20 px-6 bg-gradient-to-br from-emerald-600 to-green-600">
                        {activeBusiness && businesses.length > 0 && <BusinessSwitcher businesses={businesses} activeBusiness={activeBusiness} onSelectBusiness={handleSelectBusiness} />}
                    </div>
                    <div className="flex-1 overflow-y-auto p-4">
                        <ul className="space-y-2">
                            <SidebarLink view="dashboard" icon={DocumentChartBarIcon} label={t.sidebar.dashboard} />
                            <SidebarLink view="reports" icon={ChartPieIcon} label={t.sidebar.reports} />
                            <SidebarLink view="users" icon={UserGroupIcon} label={t.sidebar.users} />
                        </ul>
                    </div>
                    <div className="p-4 border-t border-gray-200 dark:border-gray-700">
                         <ul className="space-y-2">
                            <SidebarLink view="settings" icon={Cog6ToothIcon} label={t.sidebar.settings} />
                             <li>
                                <button
                                    onClick={onLogout}
                                    className="flex items-center p-3 w-full text-base rounded-lg transition-colors text-gray-500 hover:bg-gray-200 dark:text-gray-400 dark:hover:bg-gray-700 group"
                                >
                                    <ArrowLeftOnRectangleIcon className="w-6 h-6" />
                                    <span className="ms-3 flex-1 text-left whitespace-nowrap rtl:text-right">{t.sidebar.logout}</span>
                                </button>
                            </li>
                        </ul>
                    </div>
                </aside>
            </>
        );
    };
    
    const MainContent: React.FC<{
        activeView: AppView;
        activeBook: Book | null;
        activeBusiness: Business | null;
        currentUser: User | null;
        onBackToDashboard: () => void;
        onNewTransactionClick: (book: Book, type: 'income' | 'expense') => void;
        onEditTransactionClick: (tx: Transaction) => void;
        onDeleteTransactionClick: (tx: Transaction) => void;
        onNewBookClick: () => void;
        onSelectView: (view: AppView) => void;
        businesses: Business[];
        onUpdateBusiness: (id: string, name: string) => void;
        onDeleteBusiness: (business: Business) => void;
        onUpdateMemberRole: (memberId: string, role: 'Manager' | 'Member') => void;
        onRemoveMember: (member: TeamMember) => void;
        onInviteMember: (businessId: string, email: string) => void;
        onTransferOwnership: (business: Business, email: string) => void;
        onEditBook: (book: Book) => void;
        onDeleteBook: (book: Book) => void;
        onInviteUserClick: () => void;
        theme: Theme;
        toggleTheme: () => void;
    }> = ({ activeView, activeBook, activeBusiness, currentUser, onBackToDashboard, onNewTransactionClick, onEditTransactionClick, onDeleteTransactionClick, onNewBookClick, onSelectView, businesses, onUpdateBusiness, onDeleteBusiness, onUpdateMemberRole, onRemoveMember, onInviteMember, onTransferOwnership, onEditBook, onDeleteBook, onInviteUserClick, theme, toggleTheme }) => {

        const renderView = () => {
            if (!activeBusiness || !currentUser) return null; // Should be handled by parent
            
            switch(activeView) {
                case 'transactions':
                    return activeBook ? (
                        <TransactionsPage 
                            book={activeBook} 
                            onNewTransactionClick={onNewTransactionClick}
                            onEditTransactionClick={onEditTransactionClick}
                            onDeleteTransactionClick={onDeleteTransactionClick}
                        />
                    ) : (
                        <div className="p-8 text-center">No book selected.</div>
                    );
                case 'book-settings':
                    return activeBook ? (
                         <BookSettingsPage
                            book={activeBook}
                            business={activeBusiness}
                            currentUser={currentUser}
                            onEditBook={onEditBook}
                            onDeleteBook={onDeleteBook}
                            onInviteMember={onInviteUserClick}
                        />
                    ) : (
                        <div className="p-8 text-center">No book selected.</div>
                    );
                case 'reports':
                    return <ReportsPage activeBusiness={activeBusiness} />;
                case 'users':
                    return <UsersPage businesses={businesses} onInviteClick={onInviteUserClick} onUpdateMemberRole={(businessId, memberId, role) => { console.log("Not implemented at top-level"); }} onRemoveMember={(businessId, member) => { console.log("Not implemented at top-level"); }}/>
                case 'settings':
                    return <SettingsPage 
                        theme={theme}
                        toggleTheme={toggleTheme}
                        businesses={businesses}
                        activeBusiness={activeBusiness}
                        currentUser={currentUser}
                        onUpdateBusiness={onUpdateBusiness}
                        onDeleteBusiness={onDeleteBusiness}
                        onUpdateMemberRole={onUpdateMemberRole}
                        onRemoveMember={onRemoveMember}
                        onInviteMember={onInviteMember}
                        onTransferOwnership={onTransferOwnership}
                    />;
                case 'dashboard':
                default:
                    return <Dashboard business={activeBusiness} onViewTransactions={handleViewTransactions} onNewBookClick={onNewBookClick} />;
            }
        }
        
        // This is a simplified header for desktop, MobileHeader is separate
        const DesktopHeader = () => (
            <header className="hidden lg:flex items-center justify-between h-20 px-6 bg-gradient-to-br from-emerald-600 to-green-600 text-white flex-shrink-0">
                <div className="flex items-center gap-4">
                    {(activeView === 'transactions' || activeView === 'book-settings') && (
                         <button onClick={onBackToDashboard} className="p-2 -m-2 rounded-full hover:bg-black/20">
                            <ArrowLeftIcon className="w-6 h-6"/>
                        </button>
                    )}
                    <h1 className="text-2xl font-bold truncate">{getPageTitle()}</h1>
                </div>
                 <div className="flex items-center gap-4">
                     {headerMenu.length > 0 && <HeaderMenu items={headerMenu} />}
                 </div>
            </header>
        );

        return (
            <>
                <DesktopHeader/>
                {renderView()}
            </>
        );
    };

    const MobileHeader: React.FC<{
        activeBusiness: Business;
        businesses: Business[];
        onSelectBusiness: (business: Business) => void;
        onSidebarToggle: () => void;
        t: any;
        headerMenu: any[];
        title: string;
    }> = ({ activeBusiness, businesses, onSelectBusiness, onSidebarToggle, t, headerMenu, title }) => (
        <header className="lg:hidden flex items-center justify-between h-16 px-4 bg-gradient-to-br from-emerald-600 to-green-600 text-white flex-shrink-0 z-20">
            <div className="flex items-center gap-2 truncate">
                {(activeView === 'transactions' || activeView === 'book-settings') ? (
                    <button onClick={() => setActiveView('dashboard')} className="p-1 -m-1 rounded-full hover:bg-black/20">
                        <ArrowLeftIcon className="w-6 h-6"/>
                    </button>
                ) : (
                    <BusinessSwitcher businesses={businesses} activeBusiness={activeBusiness} onSelectBusiness={onSelectBusiness} isMobile />
                )}
                 <h1 className="text-xl font-bold truncate">{title}</h1>
            </div>
            <div className="flex items-center">
                {headerMenu.length > 0 && <HeaderMenu items={headerMenu} />}
            </div>
        </header>
    );

    if (!t) {
        // Translations are loading
        return <div className="flex items-center justify-center h-screen bg-gray-100 dark:bg-gray-950"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div></div>;
    }

    if (!isAuthenticated) {
        if (authScreen === 'signup') {
            return <SignUpPage onSignUp={handleSignUp} onNavigateToLogin={() => setAuthScreen('login')} />;
        }
        return <LoginPage onLogin={handleLogin} onNavigateToSignUp={() => setAuthScreen('signup')} />;
    }
    
    if (!activeBusiness || businesses.length === 0) {
        return (
            <div className="flex flex-col h-screen bg-gray-100 dark:bg-gray-900">
                <div className="flex-grow flex items-center justify-center">
                    <div className="text-center p-8">
                        <BuildingOfficeIcon className="w-16 h-16 text-gray-400 mx-auto" />
                        <h2 className="mt-4 text-2xl font-bold text-gray-800 dark:text-white">{t.app.noBusinessTitle}</h2>
                        <p className="mt-2 text-gray-500 dark:text-gray-400">{t.app.noBusinessDesc}</p>
                        <button
                            onClick={() => setIsCreateBusinessModalOpen(true)}
                            className="mt-6 inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                        >
                            <PlusIcon className="w-5 h-5 mr-2 -ml-1" />
                            {t.app.createFirstBusiness}
                        </button>
                    </div>
                </div>
                 {isCreateBusinessModalOpen && (
                    <CreateBusinessModal
                        businesses={businesses}
                        onClose={() => setIsCreateBusinessModalOpen(false)}
                        onSave={handleCreateBusiness}
                    />
                )}
            </div>
        )
    }

    return (
        <div className={`h-screen w-screen flex flex-col font-sans text-gray-900 dark:text-gray-100 bg-gray-100 dark:bg-gray-900 ${language === 'ar' ? 'rtl' : 'ltr'}`}>
            <div className="flex flex-1 overflow-hidden">
                {/* Sidebar for Desktop */}
                <Sidebar
                    activeView={activeView}
                    onSelectView={handleSelectView}
                    isSidebarOpen={isSidebarOpen}
                    onLogout={handleLogout}
                    t={t}
                />

                {/* Main content */}
                <div className="flex flex-col flex-1 w-0">
                    {/* Mobile Header */}
                    <MobileHeader 
                        activeBusiness={activeBusiness}
                        businesses={businesses}
                        onSelectBusiness={handleSelectBusiness}
                        onSidebarToggle={() => setIsSidebarOpen(!isSidebarOpen)}
                        t={t}
                        headerMenu={headerMenu}
                        title={getPageTitle()}
                    />
                    
                    <MainContent
                        activeView={activeView}
                        activeBook={activeBook}
                        activeBusiness={activeBusiness}
                        currentUser={currentUser}
                        onBackToDashboard={() => setActiveView('dashboard')}
                        onNewTransactionClick={handleNewTransactionClick}
                        onEditTransactionClick={handleEditTransactionClick}
                        onDeleteTransactionClick={handleDeleteTransactionClick}
                        onNewBookClick={() => setIsCreateBookModalOpen(true)}
                        onSelectView={handleSelectView}
                        businesses={businesses}
                        onUpdateBusiness={handleUpdateBusiness}
                        onDeleteBusiness={handleDeleteBusiness}
                        onUpdateMemberRole={handleUpdateMemberRole}
                        onRemoveMember={handleRemoveMember}
                        onInviteMember={handleInviteMember}
                        onTransferOwnership={handleTransferOwnership}
                        onEditBook={handleEditBook}
                        onDeleteBook={handleDeleteBook}
                        onInviteUserClick={() => setIsInviteUserModalOpen(true)}
                        theme={theme}
                        toggleTheme={toggleTheme}
                    />
                </div>
            </div>
            
            <BottomNavBar
                activeView={activeView}
                onSelectView={handleSelectView}
                onFabClick={handleFabClick}
            />

            {/* Modals */}
            {isCreateBusinessModalOpen && <CreateBusinessModal businesses={businesses} onClose={() => setIsCreateBusinessModalOpen(false)} onSave={handleCreateBusiness} />}
            {editingBusiness && <EditBusinessModal business={editingBusiness} businesses={businesses} onClose={() => setEditingBusiness(null)} onSave={handleUpdateBusiness} />}
            {isCreateBookModalOpen && activeBusiness && <CreateBookModal activeBusiness={activeBusiness} onClose={() => setIsCreateBookModalOpen(false)} onSave={handleCreateBook} />}
            {editingBook && activeBusiness && <EditBookModal book={editingBook} activeBusiness={activeBusiness} onClose={() => setEditingBook(null)} onSave={handleUpdateBook} />}
            {isCreateTransactionModalOpen.isOpen && isCreateTransactionModalOpen.book && <CreateTransactionModal book={isCreateTransactionModalOpen.book} transactionType={isCreateTransactionModalOpen.type} onClose={() => setIsCreateTransactionModalOpen({ isOpen: false, book: null, type: 'expense' })} onSave={handleCreateTransaction} />}
            {editingTransaction && <EditTransactionModal transaction={editingTransaction} onClose={() => setEditingTransaction(null)} onSave={handleUpdateTransaction} />}
            {deletingItem && <ConfirmDeleteModal title={deletingItem.title} message={deletingItem.message} onClose={() => setDeletingItem(null)} onConfirm={deletingItem.onConfirm} confirmText={deletingItem.confirmText} />}
            {transferringOwnership && <ConfirmTransferOwnershipModal newOwnerEmail={transferringOwnership.email} onClose={() => setTransferringOwnership(null)} onConfirm={() => { if(transferringOwnership) onConfirmTransferOwnership(transferringOwnership.business, transferringOwnership.email) }} />}
            {isInviteUserModalOpen && <InviteUserModal businesses={businesses} onClose={() => setIsInviteUserModalOpen(false)} onInvite={handleInviteMember} />}
            {uploadingTransactionsToBook && <UploadTransactionsModal book={uploadingTransactionsToBook} onClose={() => setUploadingTransactionsToBook(null)} onImport={handleImportTransactions} />}
        </div>
    );
};
export default App;