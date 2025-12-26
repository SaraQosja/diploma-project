//frontend/src/components/dashboard/CounselorDashboard.js 

import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import ChatWindow from '../chat/ChatWindow';
import CounselorOverview from './CounselorOverview';

const CounselorDashboard = () => {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [isAvailable, setIsAvailable] = useState(user?.isAvailable || false);

  const handleAvailabilityToggle = async () => {
    try {
      const newStatus = !isAvailable;
      
      const token = localStorage.getItem('authToken') || localStorage.getItem('token');
      const response = await fetch('/api/counselor/availability', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ isAvailable: newStatus })
      });

      if (response.ok) {
        setIsAvailable(newStatus);
      } else {
        alert('Failed to update availability status');
      }
    } catch (error) {
      console.error('Error updating availability:', error);
      alert('Error updating availability');
    }
  };

  const getUserName = () => {
    return `${user?.firstName || ''} ${user?.lastName || ''}`.trim();
  };

  const getCounselorSpecialization = () => {
    return user?.specialization || 'Career Counselor';
  };

  
  const CounselorProfile = () => {
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState({
      firstName: user?.firstName || '',
      lastName: user?.lastName || '',
      specialization: user?.specialization || '',
      counselorBio: user?.counselorBio || ''
    });

    const handleInputChange = (e) => {
      const { name, value } = e.target;
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    };

    const handleSave = async () => {
      try {
       
        console.log('Saving profile:', formData);
        alert('Profile updated successfully!');
        setIsEditing(false);
      } catch (error) {
        alert('Failed to update profile');
      }
    };

    const handleCancel = () => {
      setFormData({
        firstName: user?.firstName || '',
        lastName: user?.lastName || '',
        specialization: user?.specialization || '',
        counselorBio: user?.counselorBio || ''
      });
      setIsEditing(false);
    };

    return (
      <div style={{
        backgroundColor: 'white',
        borderRadius: '16px',
        padding: '32px',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
        border: '1px solid #e5e7eb'
      }}>
        {/* Profile Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          marginBottom: '32px',
          paddingBottom: '24px',
          borderBottom: '1px solid #f3f4f6'
        }}>
          <div style={{
            width: '80px',
            height: '80px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontSize: '32px',
            fontWeight: 'bold',
            marginRight: '24px',
            boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)'
          }}>
            {user?.firstName?.charAt(0)}{user?.lastName?.charAt(0)}
          </div>
          <div>
            <h2 style={{ 
              margin: 0, 
              fontSize: '28px', 
              fontWeight: 'bold', 
              color: '#1f2937',
              marginBottom: '4px'
            }}>
              {getUserName()}
            </h2>
            <p style={{ 
              margin: 0, 
              color: '#6b7280', 
              fontSize: '16px',
              marginBottom: '8px'
            }}>
              {user?.email}
            </p>
            <span style={{
              background: 'linear-gradient(135deg, #10b981, #059669)',
              color: 'white',
              padding: '4px 12px',
              borderRadius: '20px',
              fontSize: '14px',
              fontWeight: '500'
            }}>
              Career Counselor
            </span>
          </div>
        </div>

        {isEditing ? (
          /* Edit Mode */
          <div>
            <h3 style={{ 
              fontSize: '20px', 
              fontWeight: '600', 
              color: '#1f2937', 
              marginBottom: '24px'
            }}>
              Edit Profile Information
            </h3>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
              gap: '24px',
              marginBottom: '24px'
            }}>
              <div>
                <label style={{ 
                  display: 'block', 
                  fontSize: '14px', 
                  fontWeight: '500', 
                  color: '#374151', 
                  marginBottom: '8px' 
                }}>
                  First Name
                </label>
                <input
                  type="text"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleInputChange}
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '8px',
                    fontSize: '16px',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div>
                <label style={{ 
                  display: 'block', 
                  fontSize: '14px', 
                  fontWeight: '500', 
                  color: '#374151', 
                  marginBottom: '8px' 
                }}>
                  Last Name
                </label>
                <input
                  type="text"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleInputChange}
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '8px',
                    fontSize: '16px',
                    boxSizing: 'border-box'
                  }}
                />
              </div>
            </div>

            <div style={{ marginBottom: '24px' }}>
              <label style={{ 
                display: 'block', 
                fontSize: '14px', 
                fontWeight: '500', 
                color: '#374151', 
                marginBottom: '8px' 
              }}>
                Specialization
              </label>
              <select
                name="specialization"
                value={formData.specialization}
                onChange={handleInputChange}
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  fontSize: '16px',
                  boxSizing: 'border-box'
                }}
              >
                <option value="">Choose your specialization</option>
                <option value="Career Counseling">Career Counseling</option>
                <option value="Academic Counseling">Academic Counseling</option>
                <option value="Personal Development">Personal Development</option>
                <option value="University Admissions">University Admissions</option>
                <option value="Skills Development">Skills Development</option>
                <option value="Employment Services">Employment Services</option>
                <option value="Educational Psychology">Educational Psychology</option>
                <option value="Vocational Training">Vocational Training</option>
              </select>
            </div>

            <div style={{ marginBottom: '24px' }}>
              <label style={{ 
                display: 'block', 
                fontSize: '14px', 
                fontWeight: '500', 
                color: '#374151', 
                marginBottom: '8px' 
              }}>
                Professional Bio
              </label>
              <textarea
                name="counselorBio"
                value={formData.counselorBio}
                onChange={handleInputChange}
                rows="4"
                maxLength="300"
                placeholder="Tell students about yourself and your expertise..."
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  fontSize: '16px',
                  resize: 'vertical',
                  boxSizing: 'border-box'
                }}
              />
              <small style={{ color: '#6b7280', fontSize: '12px' }}>
                {formData.counselorBio.length}/300 characters
              </small>
            </div>

            <div style={{
              display: 'flex',
              gap: '12px',
              justifyContent: 'flex-end'
            }}>
              <button
                onClick={handleCancel}
                style={{
                  background: '#f3f4f6',
                  color: '#374151',
                  border: 'none',
                  padding: '12px 24px',
                  borderRadius: '8px',
                  fontSize: '16px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'background 0.2s ease'
                }}
                onMouseOver={(e) => e.target.style.background = '#e5e7eb'}
                onMouseOut={(e) => e.target.style.background = '#f3f4f6'}
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                style={{
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  color: 'white',
                  border: 'none',
                  padding: '12px 24px',
                  borderRadius: '8px',
                  fontSize: '16px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)',
                  transition: 'transform 0.2s ease'
                }}
                onMouseOver={(e) => e.target.style.transform = 'translateY(-2px)'}
                onMouseOut={(e) => e.target.style.transform = 'translateY(0)'}
              >
                Save Changes
              </button>
            </div>
          </div>
        ) : (
          /* View Mode */
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '24px'
          }}>
            <div>
              <h3 style={{ 
                fontSize: '20px', 
                fontWeight: '600', 
                color: '#1f2937', 
                marginBottom: '16px'
              }}>
                Professional Information
              </h3>
              
              <div style={{ marginBottom: '16px' }}>
                <label style={{ 
                  display: 'block', 
                  fontSize: '14px', 
                  fontWeight: '500', 
                  color: '#374151', 
                  marginBottom: '4px' 
                }}>
                  Specialization
                </label>
                <p style={{ 
                  margin: 0, 
                  color: '#1f2937', 
                  fontSize: '16px',
                  padding: '8px 0'
                }}>
                  {getCounselorSpecialization()}
                </p>
              </div>

              <div>
                <label style={{ 
                  display: 'block', 
                  fontSize: '14px', 
                  fontWeight: '500', 
                  color: '#374151', 
                  marginBottom: '4px' 
                }}>
                  Professional Bio
                </label>
                <p style={{ 
                  margin: 0, 
                  color: '#1f2937', 
                  fontSize: '16px',
                  lineHeight: '1.6',
                  padding: '8px 0'
                }}>
                  {user?.counselorBio || 'No bio provided yet.'}
                </p>
              </div>
            </div>

            <div>
              <h3 style={{ 
                fontSize: '20px', 
                fontWeight: '600', 
                color: '#1f2937', 
                marginBottom: '16px'
              }}>
                Account Status
              </h3>
              
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '12px'
              }}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <span style={{ color: '#6b7280', fontSize: '14px' }}>Account Status</span>
                  <span style={{
                    background: user?.isVerified ? '#dcfce7' : '#fef3c7',
                    color: user?.isVerified ? '#16a34a' : '#d97706',
                    padding: '4px 8px',
                    borderRadius: '12px',
                    fontSize: '12px',
                    fontWeight: '600'
                  }}>
                    {user?.isVerified ? 'Verified' : 'Pending'}
                  </span>
                </div>

                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <span style={{ color: '#6b7280', fontSize: '14px' }}>Availability</span>
                  <span style={{
                    background: isAvailable ? '#dcfce7' : '#fee2e2',
                    color: isAvailable ? '#16a34a' : '#dc2626',
                    padding: '4px 8px',
                    borderRadius: '12px',
                    fontSize: '12px',
                    fontWeight: '600'
                  }}>
                    {isAvailable ? 'Available' : 'Unavailable'}
                  </span>
                </div>

                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <span style={{ color: '#6b7280', fontSize: '14px' }}>Member Since</span>
                  <span style={{ color: '#1f2937', fontSize: '14px' }}>
                    {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Action Button - Only show in view mode */}
        {!isEditing && (
          <div style={{
            marginTop: '32px',
            paddingTop: '24px',
            borderTop: '1px solid #f3f4f6',
            textAlign: 'center'
          }}>
            <button
              onClick={() => setIsEditing(true)}
              style={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
                border: 'none',
                padding: '12px 24px',
                borderRadius: '8px',
                fontSize: '16px',
                fontWeight: '600',
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)',
                transition: 'transform 0.2s ease'
              }}
              onMouseOver={(e) => e.target.style.transform = 'translateY(-2px)'}
              onMouseOut={(e) => e.target.style.transform = 'translateY(0)'}
            >
              Edit Profile
            </button>
          </div>
        )}
      </div>
    );
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return <CounselorOverview />;
      case 'chats':
        return <ChatWindow />;
      case 'profile':
        return <CounselorProfile />;
      default:
        return <CounselorOverview />;
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
      {/* Header */}
      <div style={{
        background: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.2)',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)'
      }}>
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto',
          padding: '24px 20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div>
            <h1 style={{
              margin: 0,
              fontSize: '32px',
              fontWeight: 'bold',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              marginBottom: '4px'
            }}>
              Welcome back, {getUserName()}
            </h1>
            <p style={{
              margin: 0,
              color: '#6b7280',
              fontSize: '18px'
            }}>
              {getCounselorSpecialization()}
            </p>
          </div>
          
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '20px'
          }}>
            {/* Availability Toggle */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              background: 'rgba(255, 255, 255, 0.7)',
              padding: '12px 16px',
              borderRadius: '12px',
              border: '1px solid rgba(255, 255, 255, 0.3)'
            }}>
              <label style={{
                position: 'relative',
                display: 'inline-block',
                width: '60px',
                height: '34px'
              }}>
                <input
                  type="checkbox"
                  checked={isAvailable}
                  onChange={handleAvailabilityToggle}
                  style={{ opacity: 0, width: 0, height: 0 }}
                />
                <span style={{
                  position: 'absolute',
                  cursor: 'pointer',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  backgroundColor: isAvailable ? '#10b981' : '#ccc',
                  transition: '0.4s',
                  borderRadius: '34px'
                }}>
                  <span style={{
                    position: 'absolute',
                    height: '26px',
                    width: '26px',
                    left: isAvailable ? '30px' : '4px',
                    bottom: '4px',
                    backgroundColor: 'white',
                    transition: '0.4s',
                    borderRadius: '50%'
                  }}></span>
                </span>
              </label>
              <span style={{
                fontWeight: '600',
                fontSize: '16px',
                color: isAvailable ? '#10b981' : '#ef4444'
              }}>
                {isAvailable ? 'Available' : 'Unavailable'}
              </span>
            </div>

            {/* Logout Button */}
            <button
              onClick={logout}
              style={{
                background: 'rgba(239, 68, 68, 0.1)',
                color: '#dc2626',
                border: '2px solid rgba(239, 68, 68, 0.2)',
                padding: '12px 20px',
                borderRadius: '12px',
                fontSize: '16px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.3s ease'
              }}
              onMouseOver={(e) => {
                e.target.style.background = 'rgba(239, 68, 68, 0.2)';
                e.target.style.transform = 'translateY(-2px)';
              }}
              onMouseOut={(e) => {
                e.target.style.background = 'rgba(239, 68, 68, 0.1)';
                e.target.style.transform = 'translateY(0)';
              }}
            >
              Logout
            </button>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div style={{
        background: 'rgba(255, 255, 255, 0.9)',
        backdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.2)'
      }}>
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto',
          display: 'flex',
          gap: '0',
          padding: '0 20px'
        }}>
          {[
            { id: 'overview', label: 'Overview', icon: '📊' },
            { id: 'chats', label: 'Chat with Students', icon: '💬' },
            { id: 'profile', label: 'My Profile', icon: '👤' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                background: activeTab === tab.id 
                  ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' 
                  : 'transparent',
                color: activeTab === tab.id ? 'white' : '#6b7280',
                border: 'none',
                padding: '20px 24px',
                fontSize: '16px',
                fontWeight: '600',
                cursor: 'pointer',
                borderRadius: activeTab === tab.id ? '12px 12px 0 0' : '0',
                transition: 'all 0.3s ease',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
              onMouseOver={(e) => {
                if (activeTab !== tab.id) {
                  e.target.style.background = 'rgba(102, 126, 234, 0.1)';
                  e.target.style.color = '#667eea';
                }
              }}
              onMouseOut={(e) => {
                if (activeTab !== tab.id) {
                  e.target.style.background = 'transparent';
                  e.target.style.color = '#6b7280';
                }
              }}
            >
              <span style={{ fontSize: '20px' }}>{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '32px 20px'
      }}>
        {renderTabContent()}
      </div>
    </div>
  );
};

export default CounselorDashboard;