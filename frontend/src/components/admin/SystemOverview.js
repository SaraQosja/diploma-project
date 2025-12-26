// frontend/src/components/admin/SystemOverview.js
import React, { useState, useEffect } from 'react';
import { useAnalytics } from '../../hooks/useAdmin';

const SystemOverview = ({ stats }) => {
    const { analytics, fetchAnalytics, loading: analyticsLoading } = useAnalytics();
    const [selectedPeriod, setSelectedPeriod] = useState(30);

    useEffect(() => {
        fetchAnalytics(selectedPeriod);
    }, [fetchAnalytics, selectedPeriod]);

    const StatCard = ({ title, value, icon, color = 'blue', change = null }) => (
        <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
                <div className="flex items-center">
                    <div className="flex-shrink-0">
                        <div className={`bg-${color}-500 rounded-md p-3`}>
                            <span className="text-white text-xl">{icon}</span>
                        </div>
                    </div>
                    <div className="ml-5 w-0 flex-1">
                        <dl>
                            <dt className="text-sm font-medium text-gray-500 truncate">
                                {title}
                            </dt>
                            <dd className="text-lg font-medium text-gray-900">
                                {value?.toLocaleString() || '0'}
                            </dd>
                        </dl>
                    </div>
                </div>
                {change && (
                    <div className="mt-4">
                        <div className="flex items-center">
                            <span className={`text-sm font-medium ${
                                change >= 0 ? 'text-green-600' : 'text-red-600'
                            }`}>
                                {change >= 0 ? '↗' : '↘'} {Math.abs(change)}%
                            </span>
                            <span className="text-sm text-gray-500 ml-1">
                                vs last period
                            </span>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );

    const QuickActionCard = ({ title, description, icon, onClick, color = 'blue' }) => (
        <div 
            onClick={onClick}
            className={`bg-white p-6 rounded-lg shadow cursor-pointer hover:shadow-md transition-shadow border-l-4 border-${color}-500`}
        >
            <div className="flex items-center">
                <div className={`bg-${color}-100 p-3 rounded-full`}>
                    <span className={`text-${color}-600 text-xl`}>{icon}</span>
                </div>
                <div className="ml-4">
                    <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
                    <p className="text-sm text-gray-600">{description}</p>
                </div>
            </div>
        </div>
    );

    const ActivityFeed = () => {
        const recentActivities = [
            { id: 1, type: 'user_register', message: 'New user registered: John Doe', time: '2 minutes ago' },
            { id: 2, type: 'test_completed', message: 'Career test completed by Mary Smith', time: '15 minutes ago' },
            { id: 3, type: 'chat_created', message: 'New chat room created: Engineering Students', time: '1 hour ago' },
            { id: 4, type: 'user_register', message: 'New counselor joined: Dr. Jane Wilson', time: '2 hours ago' },
            { id: 5, type: 'test_completed', message: 'Personality test completed by Alex Johnson', time: '3 hours ago' }
        ];

        const getActivityIcon = (type) => {
            switch (type) {
                case 'user_register': return '👤';
                case 'test_completed': return '✅';
                case 'chat_created': return '💬';
                default: return '📝';
            }
        };

        return (
            <div className="bg-white shadow rounded-lg">
                <div className="px-6 py-4 border-b border-gray-200">
                    <h3 className="text-lg font-medium text-gray-900">Recent Activity</h3>
                </div>
                <div className="divide-y divide-gray-200">
                    {recentActivities.map((activity) => (
                        <div key={activity.id} className="px-6 py-4">
                            <div className="flex items-center space-x-3">
                                <span className="text-lg">{getActivityIcon(activity.type)}</span>
                                <div className="flex-1">
                                    <p className="text-sm text-gray-900">{activity.message}</p>
                                    <p className="text-xs text-gray-500">{activity.time}</p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
                <div className="px-6 py-3 bg-gray-50 text-center">
                    <button className="text-sm text-blue-600 hover:text-blue-800">
                        View all activities
                    </button>
                </div>
            </div>
        );
    };

    const ChartContainer = () => {
        if (!analytics || analyticsLoading) {
            return (
                <div className="bg-white shadow rounded-lg p-6">
                    <div className="animate-pulse">
                        <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
                        <div className="h-64 bg-gray-200 rounded"></div>
                    </div>
                </div>
            );
        }

        return (
            <div className="bg-white shadow rounded-lg">
                <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                    <h3 className="text-lg font-medium text-gray-900">User Growth</h3>
                    <select 
                        value={selectedPeriod}
                        onChange={(e) => setSelectedPeriod(parseInt(e.target.value))}
                        className="border border-gray-300 rounded-md px-3 py-2 text-sm"
                    >
                        <option value={7}>Last 7 days</option>
                        <option value={30}>Last 30 days</option>
                        <option value={90}>Last 90 days</option>
                    </select>
                </div>
                <div className="p-6">
                    {/* Simple chart representation */}
                    <div className="space-y-3">
                        {analytics.userTrends?.slice(-7).map((trend, index) => (
                            <div key={index} className="flex items-center justify-between">
                                <span className="text-sm text-gray-600">{trend.DATE}</span>
                                <div className="flex items-center space-x-2">
                                    <div 
                                        className="bg-blue-500 h-2 rounded"
                                        style={{ width: `${Math.max(trend.REGISTRATIONS * 10, 10)}px` }}
                                    ></div>
                                    <span className="text-sm font-medium text-gray-900">
                                        {trend.REGISTRATIONS}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
    };

    if (!stats) {
        return (
            <div className="animate-pulse">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    {[...Array(4)].map((_, i) => (
                        <div key={i} className="bg-gray-200 h-32 rounded-lg"></div>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            {/* Statistics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    title="Total Users"
                    value={stats.totalUsers}
                    icon="👥"
                    color="blue"
                    change={5.2}
                />
                <StatCard
                    title="Active Counselors"
                    value={stats.totalCounselors}
                    icon="🎯"
                    color="green"
                    change={2.1}
                />
                <StatCard
                    title="Available Tests"
                    value={stats.totalTests}
                    icon="📝"
                    color="purple"
                />
                <StatCard
                    title="Universities"
                    value={stats.totalUniversities}
                    icon="🎓"
                    color="yellow"
                />
                <StatCard
                    title="Career Options"
                    value={stats.totalCareers}
                    icon="💼"
                    color="indigo"
                />
                <StatCard
                    title="Chat Rooms"
                    value={stats.totalChatRooms}
                    icon="💬"
                    color="pink"
                />
                <StatCard
                    title="Recent Users"
                    value={stats.recentUsers}
                    icon="🆕"
                    color="teal"
                />
                <StatCard
                    title="Test Completions"
                    value={stats.testCompletions}
                    icon="✅"
                    color="orange"
                />
            </div>

            {/* Charts and Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <ChartContainer />
                <ActivityFeed />
            </div>

            {/* Quick Actions */}
            <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-6">Quick Actions</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <QuickActionCard
                        title="Add New User"
                        description="Create a new user account or counselor profile"
                        icon="➕"
                        color="blue"
                        onClick={() => console.log('Add user')}
                    />
                    <QuickActionCard
                        title="Create Test"
                        description="Design a new career or personality assessment"
                        icon="📋"
                        color="green"
                        onClick={() => console.log('Create test')}
                    />
                    <QuickActionCard
                        title="System Backup"
                        description="Backup all system data and configurations"
                        icon="💾"
                        color="purple"
                        onClick={() => console.log('Backup system')}
                    />
                    <QuickActionCard
                        title="View Logs"
                        description="Check system logs and admin activities"
                        icon="📊"
                        color="orange"
                        onClick={() => console.log('View logs')}
                    />
                    <QuickActionCard
                        title="Send Notification"
                        description="Send system-wide notifications to users"
                        icon="📢"
                        color="red"
                        onClick={() => console.log('Send notification')}
                    />
                    <QuickActionCard
                        title="Export Data"
                        description="Export user data and analytics reports"
                        icon="📤"
                        color="teal"
                        onClick={() => console.log('Export data')}
                    />
                </div>
            </div>

            {/* System Health */}
            <div className="bg-white shadow rounded-lg">
                <div className="px-6 py-4 border-b border-gray-200">
                    <h3 className="text-lg font-medium text-gray-900">System Health</h3>
                </div>
                <div className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="text-center">
                            <div className="text-2xl font-bold text-green-600">99.9%</div>
                            <div className="text-sm text-gray-500">Uptime</div>
                        </div>
                        <div className="text-center">
                            <div className="text-2xl font-bold text-blue-600">24ms</div>
                            <div className="text-sm text-gray-500">Response Time</div>
                        </div>
                        <div className="text-center">
                            <div className="text-2xl font-bold text-purple-600">2.1GB</div>
                            <div className="text-sm text-gray-500">Storage Used</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SystemOverview;