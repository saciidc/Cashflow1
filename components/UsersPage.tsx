
import React, { useMemo } from 'react';
import { Business, TeamMember } from '../types';
import { useTranslations } from '../hooks/useTranslations';
import { UserGroupIcon, UserPlusIcon, TrashIcon } from './icons/Icon';

interface AggregatedUser {
    id: string;
    name: string;
    email: string;
    memberships: {
        businessId: string;
        businessName: string;
        role: 'Owner' | 'Manager' | 'Member';
        memberId: string;
    }[];
}

interface UsersPageProps {
    businesses: Business[];
    onInviteClick: () => void;
    onUpdateMemberRole: (businessId: string, memberId: string, role: 'Manager' | 'Member') => void;
    onRemoveMember: (businessId: string, member: TeamMember) => void;
}

const UsersPage: React.FC<UsersPageProps> = ({ businesses, onInviteClick, onUpdateMemberRole, onRemoveMember }) => {
    const t = useTranslations();
    
    const aggregatedUsers = useMemo(() => {
        const usersMap = new Map<string, AggregatedUser>();

        businesses.forEach(business => {
            business.team.forEach(member => {
                if (!usersMap.has(member.email)) {
                    usersMap.set(member.email, {
                        id: member.id,
                        name: member.name,
                        email: member.email,
                        memberships: [],
                    });
                }
                usersMap.get(member.email)!.memberships.push({
                    businessId: business.id,
                    businessName: business.name,
                    role: member.role,
                    memberId: member.id,
                });
            });
        });

        return Array.from(usersMap.values()).sort((a, b) => a.name.localeCompare(b.name));
    }, [businesses]);

    return (
        <div className="flex-1 flex flex-col">
            <main className="flex-1 overflow-y-auto p-3 sm:p-6">
                <div className="max-w-5xl mx-auto">
                    <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                        <p className="text-gray-500 dark:text-gray-400">{t.users.description}</p>
                        <button
                            onClick={onInviteClick}
                            className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white text-sm rounded-lg font-semibold hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors shadow-sm"
                        >
                            <UserPlusIcon className="w-5 h-5" />
                            <span>{t.users.inviteUser}</span>
                        </button>
                    </div>

                    <div className="space-y-4">
                        {aggregatedUsers.length > 0 ? (
                            aggregatedUsers.map(user => (
                                <div key={user.email} className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden">
                                    <div className="p-4 flex items-center gap-4 border-b border-gray-100 dark:border-gray-700">
                                        <div className="w-10 h-10 rounded-full bg-primary-100 dark:bg-primary-500/20 text-primary-600 dark:text-primary-300 flex items-center justify-center font-bold text-lg flex-shrink-0">
                                            {user.name.charAt(0).toUpperCase()}
                                        </div>
                                        <div>
                                            <p className="font-semibold text-gray-800 dark:text-gray-100">{user.name}</p>
                                            <p className="text-sm text-gray-500 dark:text-gray-400">{user.email}</p>
                                        </div>
                                    </div>
                                    <div className="p-4">
                                        <h4 className="text-sm font-semibold text-gray-600 dark:text-gray-300 mb-2">{t.users.businessMemberships}</h4>
                                        <div className="space-y-2">
                                            {user.memberships.map(membership => (
                                                <div key={membership.businessId} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700/50 rounded-md">
                                                    <p className="text-sm font-medium text-gray-700 dark:text-gray-200">{membership.businessName}</p>
                                                    <div className="flex items-center gap-2">
                                                        {membership.role === 'Owner' ? (
                                                            <span className="text-xs font-bold text-amber-500 px-2 py-1 rounded-full bg-amber-100 dark:bg-amber-500/10">{t.settings.owner}</span>
                                                        ) : (
                                                            <>
                                                                <select
                                                                    value={membership.role}
                                                                    onChange={e => onUpdateMemberRole(membership.businessId, membership.memberId, e.target.value as 'Manager' | 'Member')}
                                                                    className="input-field text-xs h-8 w-28"
                                                                >
                                                                    <option value="Member">{t.settings.roleMember}</option>
                                                                    <option value="Manager">{t.settings.roleManager}</option>
                                                                </select>
                                                                <button
                                                                    onClick={() => onRemoveMember(membership.businessId, {id: membership.memberId, name: user.name, email: user.email, role: membership.role})}
                                                                    className="p-1.5 text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-500 rounded-md hover:bg-gray-100 dark:hover:bg-gray-600"
                                                                    aria-label={t.users.removeUserFrom.replace('{userName}', user.name).replace('{businessName}', membership.businessName)}
                                                                >
                                                                    <TrashIcon className="w-4 h-4" />
                                                                </button>
                                                            </>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="text-center py-10 bg-white dark:bg-gray-800 rounded-xl shadow-md">
                                <UserGroupIcon className="w-12 h-12 mx-auto text-gray-400 dark:text-gray-500" />
                                <p className="mt-2 font-semibold text-gray-600 dark:text-gray-300">{t.users.noUsers}</p>
                                <p className="text-sm text-gray-500 dark:text-gray-400">{t.users.noUsersDescription}</p>
                            </div>
                        )}
                    </div>
                </div>
            </main>
             <style dangerouslySetInnerHTML={{ __html: `
                .input-field {
                    display: block;
                    width: 100%;
                    padding: 0.25rem 0.5rem;
                    background-color: #fff;
                    border: 1px solid #d1d5db;
                    border-radius: 0.375rem;
                    box-shadow: 0 1px 2px 0 rgb(0 0 0 / 0.05);
                    -webkit-appearance: none;
                    -moz-appearance: none;
                    appearance: none;
                }
                .dark .input-field {
                    color: #e5e7eb;
                    background-color: #1f2937;
                    border-color: #4b5563;
                }
                .input-field:focus {
                    outline: 2px solid transparent;
                    outline-offset: 2px;
                    border-color: #4f46e5;
                    box-shadow: 0 0 0 1px #4f46e5;
                }
            `}}/>
        </div>
    );
};

export default UsersPage;
