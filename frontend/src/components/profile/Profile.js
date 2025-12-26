// frontend/src/components/profile/Profile.js 
import React, { useState, useEffect } from 'react';
import { useProfile } from '../../hooks/useProfile';
import { profileService } from '../../services/profileService';

const Profile = () => {
  const {
    profile,
    completion,
    loading,
    error,
    updateBasicProfile,
    updateExtendedProfile,
    changePassword,
    clearError,
    getProfileInitials,
    getCompletionColor,
    getMissingFields
  } = useProfile();

  const [activeTab, setActiveTab] = useState('basic');
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({});
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [showPasswordForm, setShowPasswordForm] = useState(false);

  
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

  const handleEdit = () => {
    setIsEditing(true);
    clearError();
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
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
    clearError();
  };

  const handleSaveBasic = async () => {
    try {
      await updateBasicProfile({
        emri: editData.emri,
        mbiemri: editData.mbiemri,
        email: editData.email
      });
      setIsEditing(false);
    } catch (err) {
      console.error('Error updating basic profile:', err);
    }
  };

  const handleSaveExtended = async () => {
    try {
      await updateExtendedProfile({
        education_level: editData.education_level,
        current_school: editData.current_school,
        interests: editData.interests,
        goals: editData.goals,
        strengths: editData.strengths,
        skills: editData.skills
      });
      setIsEditing(false);
    } catch (err) {
      console.error('Error updating extended profile:', err);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      alert('Fjalëkalimet nuk përputhen');
      return;
    }

    try {
      await changePassword({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      });
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setShowPasswordForm(false);
      alert('Fjalëkalimi u ndryshua me sukses!');
    } catch (err) {
      console.error('Error changing password:', err);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">Profili nuk u gjet</p>
      </div>
    );
  }

  const missingFields = getMissingFields();

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-20 h-20 bg-blue-600 rounded-full flex items-center justify-center text-white text-2xl font-bold">
              {getProfileInitials()}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {profile.emri} {profile.mbiemri}
              </h1>
              <p className="text-gray-600">{profile.email}</p>
              <p className="text-sm text-gray-500">
                {profileService.getRoleDisplayName(profile.roli)}
              </p>
            </div>
          </div>
          <div className="text-right">
            <div className="mb-2">
              <span className={`text-sm font-medium ${getCompletionColor()}`}>
                Plotësimi i profilit: {completion}%
              </span>
            </div>
            <div className="w-32 bg-gray-200 rounded-full h-2">
              <div 
                className={`h-2 rounded-full ${profileService.getProfileCompletionBgColor(completion)}`}
                style={{ width: `${completion}%` }}
              ></div>
            </div>
            {missingFields.length > 0 && (
              <p className="text-xs text-gray-500 mt-1">
                Mungojnë: {missingFields.slice(0, 2).join(', ')}
                {missingFields.length > 2 && ` +${missingFields.length - 2}`}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
          <button onClick={clearError} className="float-right">&times;</button>
        </div>
      )}

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow-md">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            <button
              onClick={() => setActiveTab('basic')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'basic'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Informacion Bazik
            </button>
            <button
              onClick={() => setActiveTab('extended')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'extended'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Ndryshim Fjalëkalimi
            </button>
            <button
              onClick={() => setActiveTab('settings')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'settings'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Cilësimet
            </button>
          </nav>
        </div>

        <div className="p-6">
          {/* Basic Info Tab */}
          {activeTab === 'basic' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-lg font-medium text-gray-900">Informacioni Personal</h2>
                {!isEditing ? (
                  <button
                    onClick={handleEdit}
                    className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
                  >
                    Edito Informacionin
                  </button>
                ) : (
                  <div className="space-x-2">
                    <button
                      onClick={activeTab === 'basic' ? handleSaveBasic : handleSaveExtended}
                      className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
                    >
                      Ruaj
                    </button>
                    <button
                      onClick={handleCancelEdit}
                      className="bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-gray-600"
                    >
                      Anulo
                    </button>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Emri</label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={editData.emri}
                      onChange={(e) => setEditData({...editData, emri: e.target.value})}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  ) : (
                    <p className="text-gray-900">{profile.emri}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Mbiemri</label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={editData.mbiemri}
                      onChange={(e) => setEditData({...editData, mbiemri: e.target.value})}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  ) : (
                    <p className="text-gray-900">{profile.mbiemri}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                  {isEditing ? (
                    <input
                      type="email"
                      value={editData.email}
                      onChange={(e) => setEditData({...editData, email: e.target.value})}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  ) : (
                    <p className="text-gray-900">{profile.email}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Niveli Arsimor</label>
                  {isEditing ? (
                    <select
                      value={editData.education_level}
                      onChange={(e) => setEditData({...editData, education_level: e.target.value})}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Zgjidhni nivelin</option>
                      {profileService.getEducationLevels().map(level => (
                        <option key={level.value} value={level.value}>{level.label}</option>
                      ))}
                    </select>
                  ) : (
                    <p className="text-gray-900">{profile.profile?.education_level || 'E pa specifikuar'}</p>
                  )}
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Shkolla Aktuale</label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={editData.current_school}
                      onChange={(e) => setEditData({...editData, current_school: e.target.value})}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  ) : (
                    <p className="text-gray-900">{profile.profile?.current_school || 'E pa specifikuar'}</p>
                  )}
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Interesat</label>
                  {isEditing ? (
                    <textarea
                      value={editData.interests}
                      onChange={(e) => setEditData({...editData, interests: e.target.value})}
                      rows="3"
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Shkruani interesat tuaja..."
                    />
                  ) : (
                    <p className="text-gray-900">{profile.profile?.interests || 'E pa specifikuar'}</p>
                  )}
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Qëllimet</label>
                  {isEditing ? (
                    <textarea
                      value={editData.goals}
                      onChange={(e) => setEditData({...editData, goals: e.target.value})}
                      rows="3"
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Shkruani qëllimet tuaja..."
                    />
                  ) : (
                    <p className="text-gray-900">{profile.profile?.goals || 'E pa specifikuar'}</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Change Password Tab */}
          {activeTab === 'extended' && (
            <div className="space-y-6">
              <h2 className="text-lg font-medium text-gray-900">Ndryshimi i Fjalëkalimit</h2>
              
              <form onSubmit={handlePasswordChange} className="space-y-4 max-w-md">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Fjalëkalimi Aktual
                  </label>
                  <input
                    type="password"
                    value={passwordData.currentPassword}
                    onChange={(e) => setPasswordData({...passwordData, currentPassword: e.target.value})}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Fjalëkalimi i Ri
                  </label>
                  <input
                    type="password"
                    value={passwordData.newPassword}
                    onChange={(e) => setPasswordData({...passwordData, newPassword: e.target.value})}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    minLength="6"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Konfirmo Fjalëkalimin
                  </label>
                  <input
                    type="password"
                    value={passwordData.confirmPassword}
                    onChange={(e) => setPasswordData({...passwordData, confirmPassword: e.target.value})}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <button
                  type="submit"
                  className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700"
                >
                  Ndrysho Fjalëkalimin
                </button>
              </form>
            </div>
          )}

          {/* Settings Tab */}
          {activeTab === 'settings' && (
            <div className="space-y-6">
              <h2 className="text-lg font-medium text-gray-900">Cilësimet e Profilit</h2>
              
              <div className="space-y-4">
                <div className="bg-gray-50 p-4 rounded-md">
                  <h3 className="font-medium text-gray-900 mb-2">Statusi i Llogarisë</h3>
                  <p className="text-sm text-gray-600">
                    Statusi: {profileService.getStatusDisplayName(profile.statusi)}
                  </p>
                  <p className="text-sm text-gray-600">
                    Krijuar më: {profileService.formatDate(profile.created_at)}
                  </p>
                  {profile.updated_at && (
                    <p className="text-sm text-gray-600">
                      Përditësuar më: {profileService.formatDate(profile.updated_at)}
                    </p>
                  )}
                </div>

                <div className="bg-gray-50 p-4 rounded-md">
                  <h3 className="font-medium text-gray-900 mb-2">Plotësimi i Profilit</h3>
                  <p className="text-sm text-gray-600 mb-2">
                    {profileService.getProfileCompletionMessage(completion)}
                  </p>
                  {missingFields.length > 0 && (
                    <div>
                      <p className="text-sm font-medium text-gray-700 mb-1">Fusha që mungojnë:</p>
                      <ul className="text-sm text-gray-600 list-disc list-inside">
                        {missingFields.map(field => (
                          <li key={field}>{field}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Profile;