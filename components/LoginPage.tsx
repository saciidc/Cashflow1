





import React, { useState } from 'react';
import Spinner from './Spinner';
import { EnvelopeIcon, LockClosedIcon, EyeIcon, EyeSlashIcon } from './icons/Icon';
import { useTranslations } from '../hooks/useTranslations';

interface LoginPageProps {
    onLogin: (email: string) => void;
    onNavigateToSignUp: () => void;
}

const LoginPage: React.FC<LoginPageProps> = ({ onLogin, onNavigateToSignUp }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [rememberMe, setRememberMe] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [isPasswordVisible, setIsPasswordVisible] = useState(false);
    const t = useTranslations();

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        setTimeout(() => {
            if (!email || !password) {
                setError(t.login.emptyFields);
                setIsLoading(false);
                return;
            }
            onLogin(email);
        }, 1000);
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-950 px-4 py-12">
            <div className="w-full max-w-sm">
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-emerald-500 to-green-600 rounded-2xl mb-4 shadow-lg">
                        <span className="text-4xl font-bold text-white">C</span>
                    </div>
                    <h1 className="text-3xl font-bold tracking-tight text-gray-800 dark:text-white">{t.login.title}</h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-2">{t.login.description}</p>
                </div>
                
                <div className="bg-white dark:bg-gray-800 shadow-xl rounded-2xl p-8">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium leading-6 text-gray-900 dark:text-gray-200">
                                {t.login.emailLabel}
                            </label>
                            <div className="mt-2 relative">
                                <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                                    <EnvelopeIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
                                </span>
                                <input
                                    id="email"
                                    name="email"
                                    type="email"
                                    autoComplete="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="block w-full rounded-md border-0 py-2.5 pl-10 pr-3 text-gray-900 dark:text-white bg-white dark:bg-gray-900/50 ring-1 ring-inset ring-gray-300 dark:ring-gray-700 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-primary-600 dark:focus:ring-primary-500 sm:text-sm sm:leading-6"
                                    placeholder={t.login.emailPlaceholder}
                                />
                            </div>
                        </div>

                        <div>
                            <label htmlFor="password" className="block text-sm font-medium leading-6 text-gray-900 dark:text-gray-200">
                                {t.login.passwordLabel}
                            </label>
                            <div className="mt-2 relative">
                                 <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                                    <LockClosedIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
                                </span>
                                <input
                                    id="password"
                                    name="password"
                                    type={isPasswordVisible ? 'text' : 'password'}
                                    autoComplete="current-password"
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="block w-full rounded-md border-0 py-2.5 pl-10 pr-10 text-gray-900 dark:text-white bg-white dark:bg-gray-900/50 ring-1 ring-inset ring-gray-300 dark:ring-gray-700 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-primary-600 dark:focus:ring-primary-500 sm:text-sm sm:leading-6"
                                    placeholder="••••••••"
                                />
                                <button type="button" onClick={() => setIsPasswordVisible(!isPasswordVisible)} className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                                    {isPasswordVisible ? <EyeSlashIcon className="h-5 w-5"/> : <EyeIcon className="h-5 w-5"/>}
                                </button>
                            </div>
                        </div>

                        <div className="flex items-center justify-between">
                            <div className="flex items-center">
                                <input
                                    id="remember-me"
                                    name="remember-me"
                                    type="checkbox"
                                    checked={rememberMe}
                                    onChange={(e) => setRememberMe(e.target.checked)}
                                    className="h-4 w-4 rounded border-gray-300 dark:border-gray-600 text-primary-600 focus:ring-primary-600"
                                />
                                <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-900 dark:text-gray-300">
                                    {t.login.rememberMe}
                                </label>
                            </div>
                            <div className="text-sm">
                                <a href="#" className="font-semibold text-primary-600 hover:text-primary-500 dark:text-primary-400 dark:hover:text-primary-300">
                                    {t.login.forgotPassword}
                                </a>
                            </div>
                        </div>

                        {error && (
                            <div className="text-center text-sm text-red-600 dark:text-red-500 bg-red-50 dark:bg-red-500/10 p-3 rounded-md">
                                {error}
                            </div>
                        )}
                        
                        <div>
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-lg text-sm font-medium text-white bg-gradient-to-r from-emerald-600 via-lime-500 to-green-400 hover:from-emerald-700 hover:to-green-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:from-emerald-400 disabled:to-green-300 disabled:cursor-wait transition-all duration-300 shadow-lg hover:shadow-primary-500/40"
                            >
                                {isLoading ? <Spinner size="sm" /> : t.login.signIn}
                            </button>
                        </div>
                    </form>
                </div>
                <p className="mt-8 text-center text-sm text-gray-500 dark:text-gray-400">
                    {t.login.notAMember}{' '}
                    <button onClick={onNavigateToSignUp} className="font-semibold leading-6 text-primary-600 hover:text-primary-500 dark:text-primary-400 dark:hover:text-primary-300">
                        {t.login.startTrial}
                    </button>
                </p>
            </div>
        </div>
    );
};

export default LoginPage;