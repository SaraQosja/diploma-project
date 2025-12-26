// frontend/src/components/common/Header.js
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const Header = () => {
  const location = useLocation();
  const { user, isAuthenticated, logout, isAdmin, isCounselor, isStudent } = useAuth();

  // Nëse nuk është i autentifikuar, mos shfaq header
  if (!isAuthenticated) {
    return null;
  }

  const userRole = user?.role || user?.userType || user?.ROLI;

  // Admin Navigation
  const adminNavItems = [
    { path: '/admin', label: 'Dashboard', icon: '🏠' },
    { path: '/admin/users', label: 'User Management', icon: '👥' },
    { path: '/admin/tests', label: 'Test Management', icon: '📝' },
    { path: '/admin/analytics', label: 'Analytics', icon: '📊' },
    { path: '/admin/settings', label: 'Settings', icon: '⚙️' }
  ];

  // Counselor Navigation
  const counselorNavItems = [
    { path: '/counselor', label: 'Dashboard', icon: '🏠' },
    { path: '/counselor/chats', label: 'Active Chats', icon: '💬' },
    { path: '/counselor/profile', label: 'Profile', icon: '👤' }
  ];

  // Student Navigation
  const studentNavItems = [
    { path: '/dashboard', label: 'Dashboard', icon: '🏠' },
    { path: '/profile', label: 'Profile', icon: '👤' },
    { path: '/tests', label: 'Tests & Grades', icon: '🎓' }, 
    { path: '/recommendations', label: 'Recommendations', icon: '🎯' },
    { path: '/chat', label: 'Chat', icon: '💬' }
  ];

  // Zgjidh navigation items bazuar në rol
  let navItems = studentNavItems; // default
  if (userRole === 'admin' || userRole === 'ADMIN') {
    navItems = adminNavItems;
  } else if (userRole === 'counselor' || userRole === 'keshillues') {
    navItems = counselorNavItems;
  }

  const isActive = (path) => {
    if (path === '/admin' && location.pathname.startsWith('/admin')) {
      return location.pathname === '/admin' || location.pathname === '/admin/';
    }
    return location.pathname === path || 
           (path === '/tests' && (location.pathname.startsWith('/tests') || location.pathname.startsWith('/grades')));
  };

  const handleLogout = () => {
    if (window.confirm('Are you sure you want to logout?')) {
      logout();
    }
  };

  const getRoleBadge = () => {
    if (userRole === 'admin' || userRole === 'ADMIN') {
      return <span style={{ 
        background: '#dc2626', 
        color: 'white', 
        padding: '2px 8px', 
        borderRadius: '12px', 
        fontSize: '10px', 
        fontWeight: '600',
        marginLeft: '8px'
      }}>ADMIN</span>;
    } else if (userRole === 'counselor' || userRole === 'keshillues') {
      return <span style={{ 
        background: '#059669', 
        color: 'white', 
        padding: '2px 8px', 
        borderRadius: '12px', 
        fontSize: '10px', 
        fontWeight: '600',
        marginLeft: '8px'
      }}>COUNSELOR</span>;
    }
    return null;
  };

  return (
    <nav style={{
      background: 'white',
      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
      padding: '0 20px',
      position: 'fixed',
      top: 0,
      width: '100%',
      zIndex: 1000
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        maxWidth: '1200px',
        margin: '0 auto',
        height: '70px'
      }}>
        {/* Logo */}
        <Link to={navItems[0].path} style={{
          display: 'flex',
          alignItems: 'center',
          textDecoration: 'none',
          color: '#1f2937',
          fontSize: '24px',
          fontWeight: 'bold'
        }}>
          🎯 CareerGuide
          {getRoleBadge()}
        </Link>

        {/* Navigation */}
        <div style={{ display: 'flex', gap: '32px' }}>
          {navItems.map(item => (
            <Link
              key={item.path}
              to={item.path}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                textDecoration: 'none',
                color: isActive(item.path) ? '#3b82f6' : '#6b7280',
                fontWeight: isActive(item.path) ? '600' : '500',
                fontSize: '16px',
                padding: '8px 16px',
                borderRadius: '8px',
                background: isActive(item.path) ? '#eff6ff' : 'transparent',
                transition: 'all 0.2s ease'
              }}
              onMouseOver={(e) => {
                if (!isActive(item.path)) {
                  e.target.style.background = '#f3f4f6';
                }
              }}
              onMouseOut={(e) => {
                if (!isActive(item.path)) {
                  e.target.style.background = 'transparent';
                }
              }}
            >
              <span style={{ fontSize: '18px' }}>{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          ))}
        </div>

        {/* User Menu */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '16px'
        }}>
          <div style={{ textAlign: 'right' }}>
            <div style={{ color: '#374151', fontSize: '14px', fontWeight: '500' }}>
              {user?.firstName || user?.EMRI || 'User'} {user?.lastName || user?.SURNAME || ''}
            </div>
            <div style={{ color: '#6b7280', fontSize: '12px' }}>
              {userRole || 'Student'}
            </div>
          </div>
          <button 
            onClick={handleLogout}
            style={{
              padding: '8px 16px',
              background: '#ef4444',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              fontSize: '14px',
              fontWeight: '500',
              cursor: 'pointer'
            }}
          >
            Logout
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Header;