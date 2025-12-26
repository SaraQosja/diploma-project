import React, { useState, useEffect } from 'react';
import api from '../../services/api';

const CounselorProfile = () => {
  const [profile, setProfile] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    specialization: '',
    experience: 0,
    education: '',
    certifications: ''
  });

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      setIsLoading(true);
      setError('');
      
      const response = await api.get('/api/counselor/profile');

      console.log('Profile response:', response.data);

      if (response.data.success) {
        const data = response.data.data;
        setProfile(data);
        setFormData({
          firstName: data.firstName || '',
          lastName: data.lastName || '',
          specialization: data.specialization || '',
          experience: data.experience || 0,
          education: data.education || '',
          certifications: data.certifications || ''
        });
      } else {
        setError(response.data.message || 'Failed to load profile');
      }
    } catch (error) {
      console.error('Load profile error:', error);
      if (error.response?.status === 401) {
        setError('Session expired. Please log in again.');
      } else {
        setError('Failed to load profile');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'experience' ? parseInt(value) || 0 : value
    }));
    setError('');
    setSuccess('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.firstName.trim() || !formData.lastName.trim()) {
      setError('First name and last name are required');
      return;
    }

    try {
      setIsLoading(true);
      setError('');
      setSuccess('');
      
      console.log('Submitting form data:', formData);
      
      const response = await api.put('/api/counselor/profile', formData);

      console.log('Update response:', response.data);

      if (response.data.success) {
        setProfile(response.data.data);
        setIsEditing(false);
        setSuccess('Profile updated successfully!');
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(response.data.message || 'Failed to update profile');
      }
    } catch (error) {
      console.error('Update error:', error);
      setError(error.response?.data?.message || 'Failed to update profile');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleAvailability = async () => {
    try {
      setError('');
      setSuccess('');
      
      const newStatus = !profile.isActive;
      
      console.log('Toggling availability to:', newStatus);
      
      const response = await api.put('/api/counselor/availability', {
        isAvailable: newStatus
      });

      console.log('Availability response:', response.data);

      if (response.data.success) {
        setProfile(prev => ({ ...prev, isActive: newStatus }));
        setSuccess(`Status updated to ${newStatus ? 'available' : 'unavailable'}`);
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(response.data.message || 'Failed to update availability');
      }
    } catch (error) {
      console.error('Availability error:', error);
      setError('Failed to update availability');
    }
  };

  const handleCancel = () => {
    if (profile) {
      setFormData({
        firstName: profile.firstName || '',
        lastName: profile.lastName || '',
        specialization: profile.specialization || '',
        experience: profile.experience || 0,
        education: profile.education || '',
        certifications: profile.certifications || ''
      });
    }
    setIsEditing(false);
    setError('');
    setSuccess('');
  };

  if (isLoading && !profile) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading profile...</p>
      </div>
    );
  }

  if (error && !profile) {
    return (
      <div className="error-container">
        <p className="error-message">{error}</p>
        <button onClick={loadProfile} className="retry-btn">
          Try Again
        </button>
      </div>
    );
  }

  if (!profile) {
    return <div>No profile data available</div>;
  }

  return (
    <div className="counselor-profile">
      {/* Header */}
      <div className="header">
        <div className="profile-info">
          <div className="avatar">
            {profile.firstName?.charAt(0) || 'C'}{profile.lastName?.charAt(0) || 'C'}
          </div>
          <div className="info">
            <h2>{profile.firstName} {profile.lastName}</h2>
            <p className="email">{profile.email}</p>
            <span className="role">Career Counselor</span>
          </div>
        </div>
        <button 
          onClick={toggleAvailability}
          className={`availability-btn ${profile.isActive ? 'available' : 'unavailable'}`}
          disabled={isLoading}
        >
          {profile.isActive ? 'Available' : 'Unavailable'}
        </button>
      </div>

      {/* Alerts */}
      {error && (
        <div className="error-alert">
          {error}
        </div>
      )}

      {success && (
        <div className="success-alert">
          {success}
        </div>
      )}

      {/* Main Content */}
      {isEditing ? (
        <form onSubmit={handleSubmit} className="edit-form">
          <h3>Edit Profile Information</h3>
          
          <div className="form-row">
            <div className="form-group">
              <label>First Name</label>
              <input
                type="text"
                name="firstName"
                value={formData.firstName}
                onChange={handleInputChange}
                placeholder="First Name *"
                required
                disabled={isLoading}
              />
            </div>
            <div className="form-group">
              <label>Last Name</label>
              <input
                type="text"
                name="lastName"
                value={formData.lastName}
                onChange={handleInputChange}
                placeholder="Last Name *"
                required
                disabled={isLoading}
              />
            </div>
          </div>

          <div className="form-group">
            <label>Specialization</label>
            <select
              name="specialization"
              value={formData.specialization}
              onChange={handleInputChange}
              disabled={isLoading}
            >
              <option value="">Select Specialization</option>
              <option value="General Career Counseling">General Career Counseling</option>
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

          <div className="form-group">
            <label>Years of Experience</label>
            <input
              type="number"
              name="experience"
              value={formData.experience}
              onChange={handleInputChange}
              placeholder="Years of Experience"
              min="0"
              max="50"
              disabled={isLoading}
            />
          </div>

          <div className="form-group">
            <label>Professional Bio</label>
            <textarea
              name="education"
              value={formData.education}
              onChange={handleInputChange}
              placeholder="Tell students about your background, education, and expertise..."
              rows="4"
              disabled={isLoading}
              maxLength="300"
            />
            <small className="char-count">
              {formData.education.length}/300 characters
            </small>
          </div>

          <div className="form-actions">
            <button 
              type="button" 
              onClick={handleCancel}
              disabled={isLoading}
              className="cancel-btn"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              disabled={isLoading}
              className="save-btn"
            >
              {isLoading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      ) : (
        <div className="profile-view">
          {/* Professional Information */}
          <div className="section">
            <div className="section-header">
              <h3>Professional Information</h3>
              <button 
                onClick={() => setIsEditing(true)} 
                className="edit-btn"
                disabled={isLoading}
              >
                Edit Profile
              </button>
            </div>
            
            <div className="info-grid">
              <div className="info-item">
                <label>Full Name</label>
                <p>{profile.firstName} {profile.lastName}</p>
              </div>
              <div className="info-item">
                <label>Email</label>
                <p>{profile.email}</p>
              </div>
              <div className="info-item">
                <label>Specialization</label>
                <p>{profile.specialization || 'Not specified'}</p>
              </div>
              <div className="info-item">
                <label>Experience</label>
                <p>{profile.experience} years</p>
              </div>
              <div className="info-item full-width">
                <label>Professional Bio</label>
                <p>{profile.education || 'No professional bio provided yet.'}</p>
              </div>
            </div>
          </div>

          {/* Account Status */}
          <div className="section">
            <h3>Account Status</h3>
            <div className="status-grid">
              <div className="status-item">
                <label>Account Status</label>
                <span className="badge approved">Approved</span>
              </div>
              <div className="status-item">
                <label>Verification Status</label>
                <span className={`badge ${profile.isVerified ? 'verified' : 'pending'}`}>
                  {profile.isVerified ? 'Verified' : 'Pending Verification'}
                </span>
              </div>
              <div className="status-item">
                <label>Availability</label>
                <span className={`badge ${profile.isActive ? 'available' : 'unavailable'}`}>
                  {profile.isActive ? 'Available' : 'Unavailable'}
                </span>
              </div>
              <div className="status-item">
                <label>Member Since</label>
                <p>{profile.createdAt ? new Date(profile.createdAt).toLocaleDateString() : 'N/A'}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .counselor-profile {
          max-width: 800px;
          margin: 0 auto;
          padding: 20px;
          background: white;
          border-radius: 8px;
          box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }

        .loading-container, .error-container {
          text-align: center;
          padding: 40px 20px;
        }

        .spinner {
          width: 40px;
          height: 40px;
          border: 4px solid #f3f3f3;
          border-top: 4px solid #4CAF50;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin: 0 auto 20px;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        .error-message {
          color: #d32f2f;
          margin-bottom: 20px;
        }

        .retry-btn {
          background: #4CAF50;
          color: white;
          border: none;
          padding: 10px 20px;
          border-radius: 4px;
          cursor: pointer;
        }

        .header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 30px;
          padding-bottom: 20px;
          border-bottom: 1px solid #e5e5e5;
        }

        .profile-info {
          display: flex;
          align-items: center;
          gap: 15px;
        }

        .avatar {
          width: 70px;
          height: 70px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-size: 24px;
          font-weight: bold;
        }

        .info h2 {
          margin: 0 0 5px 0;
          color: #333;
          font-size: 24px;
        }

        .email {
          color: #666;
          margin: 0 0 5px 0;
          font-size: 16px;
        }

        .role {
          color: #4CAF50;
          font-weight: 600;
          font-size: 16px;
        }

        .availability-btn {
          padding: 12px 24px;
          border: none;
          border-radius: 25px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          font-size: 14px;
        }

        .availability-btn.available {
          background: #4CAF50;
          color: white;
        }

        .availability-btn.unavailable {
          background: #f44336;
          color: white;
        }

        .availability-btn:hover:not(:disabled) {
          opacity: 0.8;
          transform: translateY(-1px);
        }

        .availability-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .error-alert {
          background: #ffebee;
          color: #c62828;
          padding: 12px 16px;
          border-radius: 4px;
          margin-bottom: 20px;
          border: 1px solid #ffcdd2;
        }

        .success-alert {
          background: #e8f5e8;
          color: #2e7d2e;
          padding: 12px 16px;
          border-radius: 4px;
          margin-bottom: 20px;
          border: 1px solid #c8e6c9;
        }

        .section {
          margin-bottom: 30px;
          padding: 24px;
          background: #fafafa;
          border-radius: 8px;
        }

        .section-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
        }

        .section h3 {
          margin: 0 0 20px 0;
          color: #333;
          font-size: 20px;
          font-weight: 600;
        }

        .edit-btn {
          background: #4CAF50;
          color: white;
          border: none;
          padding: 10px 16px;
          border-radius: 4px;
          cursor: pointer;
          font-weight: 600;
          font-size: 14px;
        }

        .edit-btn:hover:not(:disabled) {
          background: #45a049;
        }

        .edit-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .info-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 24px;
        }

        .info-item.full-width {
          grid-column: 1 / -1;
        }

        .info-item label {
          display: block;
          font-weight: 600;
          color: #555;
          margin-bottom: 6px;
          font-size: 14px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .info-item p {
          margin: 0;
          color: #333;
          line-height: 1.5;
          font-size: 16px;
        }

        .status-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 20px;
        }

        .status-item label {
          display: block;
          font-weight: 600;
          color: #555;
          margin-bottom: 6px;
          font-size: 14px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .status-item p {
          margin: 0;
          color: #333;
          font-size: 16px;
        }

        .badge {
          padding: 6px 12px;
          border-radius: 16px;
          font-size: 12px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .badge.approved, .badge.verified {
          background: #e8f5e8;
          color: #2e7d2e;
        }

        .badge.pending {
          background: #fff3cd;
          color: #856404;
        }

        .badge.available {
          background: #d4edda;
          color: #155724;
        }

        .badge.unavailable {
          background: #f8d7da;
          color: #721c24;
        }

        .edit-form {
          background: #fafafa;
          padding: 24px;
          border-radius: 8px;
        }

        .edit-form h3 {
          margin: 0 0 24px 0;
          color: #333;
          font-size: 20px;
        }

        .form-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
          margin-bottom: 16px;
        }

        .form-group {
          margin-bottom: 16px;
        }

        .form-group label {
          display: block;
          font-weight: 600;
          color: #333;
          margin-bottom: 6px;
          font-size: 14px;
        }

        .edit-form input,
        .edit-form select,
        .edit-form textarea {
          width: 100%;
          padding: 12px;
          border: 2px solid #ddd;
          border-radius: 6px;
          box-sizing: border-box;
          font-size: 16px;
          transition: border-color 0.2s;
        }

        .edit-form input:focus,
        .edit-form select:focus,
        .edit-form textarea:focus {
          outline: none;
          border-color: #4CAF50;
        }

        .edit-form input:disabled,
        .edit-form select:disabled,
        .edit-form textarea:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .char-count {
          color: #666;
          font-size: 12px;
          margin-top: 4px;
        }

        .form-actions {
          display: flex;
          gap: 12px;
          justify-content: flex-end;
          margin-top: 24px;
          padding-top: 20px;
          border-top: 1px solid #ddd;
        }

        .cancel-btn, .save-btn {
          padding: 12px 24px;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          font-weight: 600;
          font-size: 14px;
          transition: all 0.2s;
        }

        .cancel-btn {
          background: #f5f5f5;
          color: #333;
          border: 2px solid #ddd;
        }

        .save-btn {
          background: #4CAF50;
          color: white;
        }

        .cancel-btn:hover:not(:disabled) {
          background: #e9e9e9;
        }

        .save-btn:hover:not(:disabled) {
          background: #45a049;
        }

        .cancel-btn:disabled, .save-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        @media (max-width: 768px) {
          .header {
            flex-direction: column;
            gap: 16px;
            text-align: center;
          }

          .info-grid,
          .status-grid,
          .form-row {
            grid-template-columns: 1fr;
          }

          .counselor-profile {
            padding: 16px;
          }

          .section {
            padding: 20px;
          }
        }
      `}</style>
    </div>
  );
};

export default CounselorProfile;