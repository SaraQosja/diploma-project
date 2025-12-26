// frontend/src/pages/Profile.js 
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useProfile } from '../hooks/useProfile';
import { profileService } from '../services/profileService';

const Profile = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const {
    profile,
    completion,
    loading,
    error,
    updateBasicProfile,
    updateExtendedProfile,
    changePassword,
    clearError,
    getProfileInitials
  } = useProfile();

  const [activeTab, setActiveTab] = useState('personal');
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({});
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  useEffect(() => {
    if (profile && !isEditing) {
      setEditData({
        emri: profile.emri || '',
        mbiemri: profile.mbiemri || '',
        email: profile.email || '',
        education_level: profile.profile?.education_level || '',
        current_school: profile.profile?.current_school || '',
        interests: profile.profile?.interests || '',
        goals: profile.profile?.goals || '',
        strengths: profile.profile?.strengths || '',
        skills: profile.profile?.skills || ''
      });
    }
  }, [profile, isEditing]);

  const handleLogout = async () => {
    await logout();
  };

  const handleEdit = () => {
    setIsEditing(true);
    clearError();
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    
    if (profile) {
      setEditData({
        emri: profile.emri || '',
        mbiemri: profile.mbiemri || '',
        email: profile.email || '',
        education_level: profile.profile?.education_level || '',
        current_school: profile.profile?.current_school || '',
        interests: profile.profile?.interests || '',
        goals: profile.profile?.goals || '',
        strengths: profile.profile?.strengths || '',
        skills: profile.profile?.skills || ''
      });
    }
    clearError();
  };

  const handleSave = async () => {
    try {
   
      await updateBasicProfile({
        emri: editData.emri,
        mbiemri: editData.mbiemri,
        email: editData.email
      });

      await updateExtendedProfile({
        education_level: editData.education_level,
        current_school: editData.current_school,
        interests: editData.interests,
        goals: editData.goals,
        strengths: editData.strengths,
        skills: editData.skills
      });

      setIsEditing(false);
      alert('Profili u përditësua me sukses!');
    } catch (err) {
      console.error('Error updating profile:', err);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      alert('Fjalëkalimet nuk përputhen');
      return;
    }

    if (passwordData.newPassword.length < 6) {
      alert('Fjalëkalimi duhet të jetë të paktën 6 karaktere');
      return;
    }

    try {
      await changePassword({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      });
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      alert('Fjalëkalimi u ndryshua me sukses!');
    } catch (err) {
      console.error('Error changing password:', err);
    }
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <div style={{ textAlign: 'center', color: 'white' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>⏳</div>
          <p>Duke ngarkuar profilin...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
      {/* Navigation */}
      <nav style={{ 
        background: 'rgba(255, 255, 255, 0.95)', 
        backdropFilter: 'blur(10px)',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
        padding: '16px 0'
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <span style={{ fontSize: '24px', marginRight: '8px' }}>🎯</span>
              <span style={{ fontSize: '20px', fontWeight: 'bold', color: '#1f2937' }}>CareerGuide</span>
            </div>

            {/* Navigation Menu */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
              <NavLink onClick={() => navigate('/dashboard')}>
                🏠 Dashboard
              </NavLink>
              <NavLink active={true}>
                👤 Profile
              </NavLink>
              <NavLink onClick={() => navigate('/tests')}>
                📝 Tests & Grades🎓
              </NavLink>
              <NavLink onClick={() => navigate('/recommendations')}>
                🎯 Recommendations
              </NavLink>
              <NavLink onClick={() => navigate('/chat')}>
                💬 Chat
              </NavLink>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
              <div style={{ textAlign: 'right' }}>
                <p style={{ margin: 0, fontWeight: '600', color: '#1f2937' }}>
                  {profile ? `${profile.emri} ${profile.mbiemri}` : `${user?.firstName} ${user?.lastName}`}
                </p>
              </div>
              <button
                onClick={handleLogout}
                style={{
                  background: 'rgba(239, 68, 68, 0.1)',
                  color: '#dc2626',
                  border: '1px solid rgba(239, 68, 68, 0.2)',
                  padding: '8px 16px',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: 'pointer'
                }}
              >
                Logout 🚪
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main style={{ padding: '40px 20px' }}>
        <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
          
          {/* Error Message */}
          {error && (
            <div style={{
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.2)',
              color: '#dc2626',
              padding: '16px',
              borderRadius: '8px',
              marginBottom: '20px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <span>{error}</span>
              <button onClick={clearError} style={{ background: 'none', border: 'none', color: '#dc2626', fontSize: '20px', cursor: 'pointer' }}>
                ×
              </button>
            </div>
          )}

          {/* Profile Header */}
          <div style={{
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(10px)',
            borderRadius: '20px',
            padding: '40px',
            marginBottom: '30px',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            textAlign: 'center'
          }}>
            {/* Profile Photo */}
            <div style={{ 
              width: '120px', 
              height: '120px', 
              borderRadius: '50%', 
              background: 'linear-gradient(135deg, #4f46e5, #7c3aed)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontSize: '48px',
              fontWeight: 'bold',
              margin: '0 auto 24px',
              cursor: 'pointer',
              transition: 'transform 0.2s ease'
            }}>
              {profile ? getProfileInitials() : (user?.firstName?.charAt(0) || 'U') + (user?.lastName?.charAt(0) || 'S')}
            </div>

            <h1 style={{ 
              fontSize: '32px', 
              fontWeight: 'bold', 
              color: '#1f2937',
              marginBottom: '8px'
            }}>
              {profile ? `${profile.emri} ${profile.mbiemri}` : `${user?.firstName || 'User'} ${user?.lastName || 'Name'}`}
            </h1>
            
            <p style={{ 
              fontSize: '18px', 
              color: '#6b7280',
              marginBottom: '16px'
            }}>
              {profile?.email || user?.email || 'No email'}
            </p>

            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              background: 'rgba(34, 197, 94, 0.1)',
              color: '#16a34a',
              padding: '8px 16px',
              borderRadius: '20px',
              fontSize: '16px',
              fontWeight: '500'
            }}>
              <span style={{ marginRight: '8px' }}>🎓</span>
              {profile ? profileService.getRoleDisplayName(profile.roli) : 'Nxënës'}
              {profile?.statusi === 'ACTIVE' ? ' ✅' : ' ⏳'}
            </div>

            {/* Profile Completion */}
            <div style={{ marginTop: '24px' }}>
              <p style={{ fontSize: '16px', color: '#6b7280', marginBottom: '8px' }}>
                Plotësimi i profilit: <strong style={{ 
                  color: completion >= 80 ? '#10b981' : completion >= 50 ? '#f59e0b' : '#ef4444' 
                }}>{completion || 0}%</strong>
              </p>
              <div style={{
                width: '100%',
                height: '8px',
                background: '#e5e7eb',
                borderRadius: '4px',
                overflow: 'hidden'
              }}>
                <div style={{
                  width: `${completion || 0}%`,
                  height: '100%',
                  background: completion >= 80 ? 'linear-gradient(90deg, #10b981, #059669)' : 
                            completion >= 50 ? 'linear-gradient(90deg, #f59e0b, #d97706)' : 
                            'linear-gradient(90deg, #ef4444, #dc2626)',
                  transition: 'width 0.3s ease'
                }} />
              </div>
              <p style={{ fontSize: '14px', color: '#6b7280', marginTop: '8px' }}>
                {profileService.getProfileCompletionMessage(completion || 0)}
              </p>
            </div>
          </div>

          {/* Profile Tabs */}
          <div style={{
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(10px)',
            borderRadius: '20px',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            overflow: 'hidden'
          }}>
            {/* Tab Headers */}
            <div style={{ 
              display: 'flex', 
              borderBottom: '1px solid rgba(0, 0, 0, 0.1)' 
            }}>
              <TabButton 
                active={activeTab === 'personal'}
                onClick={() => setActiveTab('personal')}
              >
                👤 Informacion Bazik
              </TabButton>
              <TabButton 
                active={activeTab === 'extended'}
                onClick={() => setActiveTab('extended')}
              >
                📚 Informacion i Zgjeruar
              </TabButton>
              <TabButton 
                active={activeTab === 'password'}
                onClick={() => setActiveTab('password')}
              >
                🔒 Ndrysho Fjalëkalimin
              </TabButton>
              <TabButton 
                active={activeTab === 'settings'}
                onClick={() => setActiveTab('settings')}
              >
                ⚙️ Cilësimet
              </TabButton>
            </div>

            {/* Tab Content */}
            <div style={{ padding: '32px' }}>
              {activeTab === 'personal' && (
                <PersonalInfoTab 
                  profile={profile}
                  isEditing={isEditing}
                  editData={editData}
                  setEditData={setEditData}
                  onEdit={handleEdit}
                  onSave={handleSave}
                  onCancel={handleCancelEdit}
                />
              )}
              {activeTab === 'extended' && (
                <ExtendedInfoTab 
                  profile={profile}
                  isEditing={isEditing}
                  editData={editData}
                  setEditData={setEditData}
                  onEdit={handleEdit}
                  onSave={handleSave}
                  onCancel={handleCancelEdit}
                />
              )}
              {activeTab === 'password' && (
                <PasswordTab 
                  passwordData={passwordData}
                  setPasswordData={setPasswordData}
                  onSubmit={handlePasswordChange}
                />
              )}
              {activeTab === 'settings' && (
                <SettingsTab profile={profile} />
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

const NavLink = ({ children, onClick, active = false }) => {
  return (
    <button
      onClick={onClick}
      style={{
        background: active ? 'rgba(79, 70, 229, 0.1)' : 'transparent',
        color: active ? '#4f46e5' : '#6b7280',
        border: 'none',
        padding: '8px 16px',
        borderRadius: '8px',
        fontSize: '14px',
        fontWeight: '500',
        cursor: 'pointer',
        transition: 'all 0.2s ease'
      }}
    >
      {children}
    </button>
  );
};

const TabButton = ({ children, active, onClick }) => {
  return (
    <button
      onClick={onClick}
      style={{
        flex: 1,
        padding: '16px 24px',
        background: active ? 'rgba(79, 70, 229, 0.1)' : 'transparent',
        color: active ? '#4f46e5' : '#6b7280',
        border: 'none',
        fontSize: '16px',
        fontWeight: '500',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        borderBottom: active ? '2px solid #4f46e5' : '2px solid transparent'
      }}
    >
      {children}
    </button>
  );
};

const PersonalInfoTab = ({ profile, isEditing, editData, setEditData, onEdit, onSave, onCancel }) => {
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h3 style={{ fontSize: '24px', fontWeight: 'bold', color: '#1f2937', margin: 0 }}>
          Informacioni Personal
        </h3>
        {!isEditing ? (
          <button onClick={onEdit} style={buttonStyle.primary}>
            Edito Informacionin ✏️
          </button>
        ) : (
          <div style={{ display: 'flex', gap: '12px' }}>
            <button onClick={onSave} style={buttonStyle.success}>
              Ruaj ✅
            </button>
            <button onClick={onCancel} style={buttonStyle.secondary}>
              Anulo ❌
            </button>
          </div>
        )}
      </div>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
        <InfoField 
          label="Emri" 
          value={profile?.emri || 'E pa specifikuar'}
          isEditing={isEditing}
          editValue={editData.emri}
          onChange={(value) => setEditData({...editData, emri: value})}
        />
        <InfoField 
          label="Mbiemri" 
          value={profile?.mbiemri || 'E pa specifikuar'}
          isEditing={isEditing}
          editValue={editData.mbiemri}
          onChange={(value) => setEditData({...editData, mbiemri: value})}
        />
        <InfoField 
          label="Email" 
          value={profile?.email || 'E pa specifikuar'}
          isEditing={isEditing}
          editValue={editData.email}
          onChange={(value) => setEditData({...editData, email: value})}
          type="email"
        />
        <InfoField 
          label="Roli" 
          value={profile ? profileService.getRoleDisplayName(profile.roli) : 'E pa specifikuar'}
          isEditing={false}
        />
        <InfoField 
          label="Statusi" 
          value={profile ? profileService.getStatusDisplayName(profile.statusi) : 'E pa specifikuar'}
          isEditing={false}
        />
        <InfoField 
          label="Data e krijimit" 
          value={profile ? profileService.formatDate(profile.created_at) : 'E pa specifikuar'}
          isEditing={false}
        />
      </div>
    </div>
  );
};

const ExtendedInfoTab = ({ profile, isEditing, editData, setEditData, onEdit, onSave, onCancel }) => {
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h3 style={{ fontSize: '24px', fontWeight: 'bold', color: '#1f2937', margin: 0 }}>
          Informacioni i Zgjeruar
        </h3>
        {!isEditing ? (
          <button onClick={onEdit} style={buttonStyle.primary}>
            Edito Informacionin ✏️
          </button>
        ) : (
          <div style={{ display: 'flex', gap: '12px' }}>
            <button onClick={onSave} style={buttonStyle.success}>
              Ruaj ✅
            </button>
            <button onClick={onCancel} style={buttonStyle.secondary}>
              Anulo ❌
            </button>
          </div>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '24px' }}>
        <InfoField 
          label="Niveli Arsimor" 
          value={profile?.profile?.education_level || 'E pa specifikuar'}
          isEditing={isEditing}
          editValue={editData.education_level}
          onChange={(value) => setEditData({...editData, education_level: value})}
          type="select"
          options={profileService.getEducationLevels()}
        />
        <InfoField 
          label="Shkolla Aktuale" 
          value={profile?.profile?.current_school || 'E pa specifikuar'}
          isEditing={isEditing}
          editValue={editData.current_school}
          onChange={(value) => setEditData({...editData, current_school: value})}
        />
        <InfoField 
          label="Interesat" 
          value={profile?.profile?.interests || 'E pa specifikuar'}
          isEditing={isEditing}
          editValue={editData.interests}
          onChange={(value) => setEditData({...editData, interests: value})}
          type="textarea"
        />
        <InfoField 
          label="Qëllimet" 
          value={profile?.profile?.goals || 'E pa specifikuar'}
          isEditing={isEditing}
          editValue={editData.goals}
          onChange={(value) => setEditData({...editData, goals: value})}
          type="textarea"
        />
        <InfoField 
          label="Pikat e Forta" 
          value={profile?.profile?.strengths || 'E pa specifikuar'}
          isEditing={isEditing}
          editValue={editData.strengths}
          onChange={(value) => setEditData({...editData, strengths: value})}
          type="textarea"
        />
        <InfoField 
          label="Aftësitë" 
          value={profile?.profile?.skills || 'E pa specifikuar'}
          isEditing={isEditing}
          editValue={editData.skills}
          onChange={(value) => setEditData({...editData, skills: value})}
          type="textarea"
        />
      </div>
    </div>
  );
};


const PasswordTab = ({ passwordData, setPasswordData, onSubmit }) => {
  return (
    <div style={{ maxWidth: '500px' }}>
      <h3 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '24px', color: '#1f2937' }}>
        Ndrysho Fjalëkalimin
      </h3>
      
      <form onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <InputField 
          label="Fjalëkalimi aktual" 
          type="password" 
          placeholder="Shkruani fjalëkalimin aktual"
          value={passwordData.currentPassword}
          onChange={(e) => setPasswordData({...passwordData, currentPassword: e.target.value})}
          required
        />
        <InputField 
          label="Fjalëkalimi i ri" 
          type="password" 
          placeholder="Shkruani fjalëkalimin e ri"
          value={passwordData.newPassword}
          onChange={(e) => setPasswordData({...passwordData, newPassword: e.target.value})}
          required
        />
        <InputField 
          label="Konfirmo fjalëkalimin" 
          type="password" 
          placeholder="Konfirmoni fjalëkalimin e ri"
          value={passwordData.confirmPassword}
          onChange={(e) => setPasswordData({...passwordData, confirmPassword: e.target.value})}
          required
        />

        <button type="submit" style={buttonStyle.primary}>
          Përditëso Fjalëkalimin 🔒
        </button>
      </form>
    </div>
  );
};

const SettingsTab = ({ profile }) => {
  return (
    <div>
      <h3 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '24px', color: '#1f2937' }}>
        Cilësimet e Llogarisë
      </h3>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        <div style={{ 
          padding: '20px',
          background: 'rgba(0, 0, 0, 0.02)',
          borderRadius: '12px'
        }}>
          <h4 style={{ margin: '0 0 16px 0', fontSize: '18px', fontWeight: '600', color: '#1f2937' }}>
            Informacioni i Llogarisë
          </h4>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
            <div>
              <p style={{ margin: '0 0 4px 0', fontSize: '14px', color: '#6b7280' }}>ID e Përdoruesit</p>
              <p style={{ margin: 0, fontSize: '16px', fontWeight: '500', color: '#1f2937' }}>{profile?.id || 'N/A'}</p>
            </div>
            <div>
              <p style={{ margin: '0 0 4px 0', fontSize: '14px', color: '#6b7280' }}>Roli</p>
              <p style={{ margin: 0, fontSize: '16px', fontWeight: '500', color: '#1f2937' }}>
                {profile ? profileService.getRoleDisplayName(profile.roli) : 'N/A'}
              </p>
            </div>
            <div>
              <p style={{ margin: '0 0 4px 0', fontSize: '14px', color: '#6b7280' }}>Statusi</p>
              <p style={{ margin: 0, fontSize: '16px', fontWeight: '500', color: '#1f2937' }}>
                {profile ? profileService.getStatusDisplayName(profile.statusi) : 'N/A'}
              </p>
            </div>
            <div>
              <p style={{ margin: '0 0 4px 0', fontSize: '14px', color: '#6b7280' }}>Krijuar më</p>
              <p style={{ margin: 0, fontSize: '16px', fontWeight: '500', color: '#1f2937' }}>
                {profile ? profileService.formatDate(profile.created_at) : 'N/A'}
              </p>
            </div>
          </div>
        </div>

        <div style={{ 
          padding: '20px',
          background: 'rgba(0, 0, 0, 0.02)',
          borderRadius: '12px'
        }}>
          <h4 style={{ margin: '0 0 16px 0', fontSize: '18px', fontWeight: '600', color: '#1f2937' }}>
            Plotësimi i Profilit
          </h4>
          <p style={{ margin: '0 0 12px 0', fontSize: '14px', color: '#6b7280' }}>
            {profileService.getProfileCompletionMessage(profile?.completion || 0)}
          </p>
          
          {profile && profileService.getMissingFields(profile).length > 0 && (
            <div>
              <p style={{ margin: '0 0 8px 0', fontSize: '14px', fontWeight: '500', color: '#374151' }}>
                Fusha që mungojnë:
              </p>
              <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '14px', color: '#6b7280' }}>
                {profileService.getMissingFields(profile).map(field => (
                  <li key={field}>{field}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};


const InfoField = ({ label, value, isEditing, editValue, onChange, type = 'text', options = [] }) => (
  <div>
    <label style={{ fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px', display: 'block' }}>
      {label}
    </label>
    {isEditing ? (
      type === 'textarea' ? (
        <textarea
          value={editValue || ''}
          onChange={(e) => onChange(e.target.value)}
          rows="3"
          style={inputStyle}
        />
      ) : type === 'select' ? (
        <select
          value={editValue || ''}
          onChange={(e) => onChange(e.target.value)}
          style={inputStyle}
        >
          <option value="">Zgjidhni një opsion</option>
          {options.map(option => (
            <option key={option.value} value={option.value}>{option.label}</option>
          ))}
        </select>
      ) : (
        <input
          type={type}
          value={editValue || ''}
          onChange={(e) => onChange(e.target.value)}
          style={inputStyle}
        />
      )
    ) : (
      <p style={{ 
        background: 'rgba(0, 0, 0, 0.05)', 
        padding: '12px 16px', 
        borderRadius: '8px', 
        color: '#1f2937',
        margin: 0,
        minHeight: '20px'
      }}>
        {value}
      </p>
    )}
  </div>
);

const InputField = ({ label, type, placeholder, value, onChange, required = false }) => (
  <div>
    <label style={{ fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px', display: 'block' }}>
      {label}
    </label>
    <input 
      type={type}
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      required={required}
      style={inputStyle}
    />
  </div>
);


const inputStyle = {
  width: '100%',
  padding: '12px 16px',
  borderRadius: '8px',
  border: '1px solid #d1d5db',
  fontSize: '16px',
  outline: 'none',
  transition: 'border-color 0.2s ease',
  boxSizing: 'border-box',
  fontFamily: 'inherit'
};

const buttonStyle = {
  primary: {
    background: 'linear-gradient(135deg, #4f46e5, #7c3aed)',
    color: 'white',
    border: 'none',
    padding: '12px 24px',
    borderRadius: '8px',
    fontSize: '16px',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'transform 0.2s ease'
  },
  success: {
    background: 'linear-gradient(135deg, #10b981, #059669)',
    color: 'white',
    border: 'none',
    padding: '12px 24px',
    borderRadius: '8px',
    fontSize: '16px',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'transform 0.2s ease'
  },
  secondary: {
    background: 'rgba(107, 114, 128, 0.1)',
    color: '#374151',
    border: '1px solid rgba(107, 114, 128, 0.2)',
    padding: '12px 24px',
    borderRadius: '8px',
    fontSize: '16px',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'all 0.2s ease'
  }
};

export default Profile;