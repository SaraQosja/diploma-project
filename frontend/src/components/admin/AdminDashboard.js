// frontend/src/components/admin/AdminDashboard.js
import React, { useState, useEffect } from 'react';
import { useAdmin } from '../../hooks/useAdmin';
import SystemOverview from './SystemOverview';
import UserManagement from './UserManagement';
import TestManagement from './TestManagement';
import CareerManagement from './CareerManagement';
import ChatManagement from './ChatManagement';
import Analytics from './Analytics';
import Settings from './Settings';
import Loading from '../common/Loading';

const AdminDashboard = () => {
    const [activeTab, setActiveTab] = useState('overview');
    const { dashboardStats, fetchDashboardStats, loading, error } = useAdmin();

    useEffect(() => {
        fetchDashboardStats();
    }, [fetchDashboardStats]);

    const tabs = [
        { id: 'overview', name: 'Overview', icon: '📊' },
        { id: 'users', name: 'Users', icon: '👥' },
        { id: 'tests', name: 'Tests', icon: '📝' },
        { id: 'careers', name: 'Careers', icon: '💼' },
        { id: 'universities', name: 'Universities', icon: '🎓' },
        { id: 'chat', name: 'Chat', icon: '💬' },
        { id: 'analytics', name: 'Analytics', icon: '📈' },
        { id: 'settings', name: 'Settings', icon: '⚙️' }
    ];

    const renderContent = () => {
        switch (activeTab) {
            case 'overview':
                return <SystemOverview stats={dashboardStats} />;
            case 'users':
                return <UserManagement />;
            case 'tests':
                return <TestManagement />;
            case 'careers':
                return <CareerManagement />;
            case 'universities':
                return <CareerManagement type="universities" />;
            case 'chat':
                return <ChatManagement />;
            case 'analytics':
                return <Analytics />;
            case 'settings':
                return <Settings />;
            default:
                return <SystemOverview stats={dashboardStats} />;
        }
    };

    if (loading && !dashboardStats) {
        return <Loading />;
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white shadow">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center py-6">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
                            <p className="mt-1 text-sm text-gray-500">
                                Manage your career guidance platform
                            </p>
                        </div>
                        <div className="flex items-center space-x-4">
                            <div className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
                                System Online
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Navigation Tabs */}
            <div className="bg-white shadow-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <nav className="flex space-x-8 overflow-x-auto">
                        {tabs.map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                                    activeTab === tab.id
                                        ? 'border-blue-500 text-blue-600'
                                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                }`}
                            >
                                <span>{tab.icon}</span>
                                <span>{tab.name}</span>
                            </button>
                        ))}
                    </nav>
                </div>
            </div>

            {/* Error Display */}
            {error && (
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <div className="bg-red-50 border border-red-200 rounded-md p-4">
                        <div className="flex">
                            <div className="flex-shrink-0">
                                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                </svg>
                            </div>
                            <div className="ml-3">
                                <h3 className="text-sm font-medium text-red-800">Error</h3>
                                <p className="mt-2 text-sm text-red-700">{error}</p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Main Content */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {renderContent()}
            </div>
        </div>
    );
};

export default AdminDashboard;