//frontend/src/components/auth/Register.js

import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useAuth } from '../../context/AuthContext';

const Register = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { register: registerUser, isAuthenticated, error, clearError } = useAuth();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm({
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      password: '',
      confirmPassword: '',
      role: '',
      specialization: '',
      counselorBio: '',
      terms: false
    }
  });

  const watchedPassword = watch('password');
  const watchedRole = watch('role');

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    clearError();
  }, [clearError]);

  const onSubmit = async (data) => {
    try {
      setIsSubmitting(true);
      clearError();

      const userData = {
        firstName: data.firstName.trim(),
        lastName: data.lastName.trim(),
        email: data.email.toLowerCase().trim(),
        password: data.password,
        role: data.role
      };

      if (data.role === 'counselor') {
        userData.specialization = data.specialization.trim();
        userData.counselorBio = data.counselorBio.trim();
      }

      console.log('Sending userData:', userData);

      const result = await registerUser(userData);

      if (result.success) {
        navigate('/dashboard', { replace: true });
      }
    } catch (error) {
      console.error('Registration error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderCounselorFields = () => {
    if (watchedRole !== 'counselor') return null;

    return (
      <>
        {/* Specialization Field */}
        <div className="form-group">
          <label htmlFor="specialization" className="form-label">Specialization *</label>
          <select
            id="specialization"
            className={`form-input ${errors.specialization ? 'error' : ''}`}
            {...register('specialization', {
              required: watchedRole === 'counselor' ? 'Specialization is required for counselors' : false
            })}
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
          {errors.specialization && (
            <p className="error-message">{errors.specialization.message}</p>
          )}
        </div>

        {/* Bio Field */}
        <div className="form-group">
          <label htmlFor="counselorBio" className="form-label">Brief Bio</label>
          <textarea
            id="counselorBio"
            rows="3"
            className={`form-input ${errors.counselorBio ? 'error' : ''}`}
            placeholder="Tell students a bit about yourself and your expertise..."
            {...register('counselorBio', {
              maxLength: {
                value: 300,
                message: 'Bio must be less than 300 characters'
              }
            })}
          />
          {errors.counselorBio && (
            <p className="error-message">{errors.counselorBio.message}</p>
          )}
          <small style={{ color: '#6b7280', fontSize: '12px' }}>
            {watch('counselorBio')?.length || 0}/300 characters
          </small>
        </div>

        {/* Counselor Note */}
        <div style={{ 
          backgroundColor: '#f0f9ff', 
          border: '1px solid #0ea5e9', 
          borderRadius: '8px', 
          padding: '16px', 
          marginBottom: '20px' 
        }}>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '20px', marginRight: '8px' }}>💡</span>
            <h4 style={{ margin: 0, color: '#0369a1' }}>Counselor Registration</h4>
          </div>
          <p style={{ margin: 0, fontSize: '14px', color: '#0c4a6e' }}>
            As a counselor, you'll be able to chat with students, provide career guidance, 
            and help them discover their potential. Your profile will be visible to students 
            looking for guidance in your specialization.
          </p>
        </div>
      </>
    );
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <h2 className="auth-title">Create Account</h2>
          <p className="auth-subtitle">Join our Career Counseling platform</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)}>
          {error && (
            <div className="alert alert-error">
              <span>⚠️</span>
              <p>{error}</p>
            </div>
          )}

          {/* Name Fields */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
            <div>
              <label htmlFor="firstName" className="form-label">First Name *</label>
              <input
                id="firstName"
                type="text"
                className={`form-input ${errors.firstName ? 'error' : ''}`}
                placeholder="First name"
                {...register('firstName', {
                  required: 'First name is required',
                  minLength: {
                    value: 2,
                    message: 'First name must be at least 2 characters'
                  },
                  pattern: {
                    value: /^[a-zA-ZëËçÇ\s]+$/,
                    message: 'First name can only contain letters'
                  }
                })}
              />
              {errors.firstName && (
                <p className="error-message">{errors.firstName.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="lastName" className="form-label">Last Name *</label>
              <input
                id="lastName"
                type="text"
                className={`form-input ${errors.lastName ? 'error' : ''}`}
                placeholder="Last name"
                {...register('lastName', {
                  required: 'Last name is required',
                  minLength: {
                    value: 2,
                    message: 'Last name must be at least 2 characters'
                  },
                  pattern: {
                    value: /^[a-zA-ZëËçÇ\s]+$/,
                    message: 'Last name can only contain letters'
                  }
                })}
              />
              {errors.lastName && (
                <p className="error-message">{errors.lastName.message}</p>
              )}
            </div>
          </div>

          {/* Role Field */}
          <div className="form-group">
            <label htmlFor="role" className="form-label">I am a *</label>
            <select
              id="role"
              className={`form-input ${errors.role ? 'error' : ''}`}
              {...register('role', {
                required: 'Please select your role'
              })}
            >
              <option value="">Choose your role</option>
              <option value="nxenes">Student (Nxënës)</option>
              <option value="counselor">Career Counselor (Këshillues)</option>
            </select>
            {errors.role && (
              <p className="error-message">{errors.role.message}</p>
            )}
          </div>

          {/* Counselor-specific fields */}
          {renderCounselorFields()}

          {/* Email Field */}
          <div className="form-group">
            <label htmlFor="email" className="form-label">Email Address *</label>
            <input
              id="email"
              type="email"
              className={`form-input ${errors.email ? 'error' : ''}`}
              placeholder="Enter your email"
              {...register('email', {
                required: 'Email is required',
                pattern: {
                  value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                  message: 'Please enter a valid email address'
                }
              })}
            />
            {errors.email && (
              <p className="error-message">{errors.email.message}</p>
            )}
          </div>

          {/* Password Fields */}
          <div className="form-group">
            <label htmlFor="password" className="form-label">Password *</label>
            <div style={{ position: 'relative' }}>
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                className={`form-input ${errors.password ? 'error' : ''}`}
                placeholder="Create a password"
                {...register('password', {
                  required: 'Password is required',
                  minLength: {
                    value: 8,
                    message: 'Password must be at least 8 characters'
                  },
                  pattern: {
                    value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
                    message: 'Password must contain uppercase, lowercase, number and special character'
                  }
                })}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: '#6b7280',
                  fontSize: '18px'
                }}
              >
                {showPassword ? '👁️' : '🙈'}
              </button>
            </div>
            {errors.password && (
              <p className="error-message">{errors.password.message}</p>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword" className="form-label">Confirm Password *</label>
            <div style={{ position: 'relative' }}>
              <input
                id="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                className={`form-input ${errors.confirmPassword ? 'error' : ''}`}
                placeholder="Confirm your password"
                {...register('confirmPassword', {
                  required: 'Please confirm your password',
                  validate: (value) => {
                    if (value !== watchedPassword) {
                      return 'Passwords do not match';
                    }
                  }
                })}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                style={{
                  position: 'absolute',
                  right: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: '#6b7280',
                  fontSize: '18px'
                }}
              >
                {showConfirmPassword ? '👁️' : '🙈'}
              </button>
            </div>
            {errors.confirmPassword && (
              <p className="error-message">{errors.confirmPassword.message}</p>
            )}
          </div>

          {/* Terms Checkbox */}
          <div style={{ display: 'flex', alignItems: 'flex-start', marginBottom: '24px' }}>
            <input
              id="terms"
              type="checkbox"
              style={{ marginRight: '12px', marginTop: '4px' }}
              {...register('terms', {
                required: 'You must accept the terms and conditions'
              })}
            />
            <label htmlFor="terms" style={{ fontSize: '14px', color: '#374151' }}>
              I agree to the{' '}
              <Link to="/terms" className="auth-link">Terms and Conditions</Link>
              {' '}and{' '}
              <Link to="/privacy" className="auth-link">Privacy Policy</Link>
            </label>
          </div>
          {errors.terms && (
            <p className="error-message" style={{ marginTop: '-16px', marginBottom: '16px' }}>
              {errors.terms.message}
            </p>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="btn btn-primary"
            style={{ width: '100%', marginBottom: '24px' }}
          >
            {isSubmitting ? 'Creating account...' : 'Create Account'}
          </button>
        </form>

        <div style={{ textAlign: 'center' }}>
          <p style={{ color: '#6b7280', fontSize: '14px' }}>
            Already have an account?{' '}
            <Link to="/login" className="auth-link">
              Sign in here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;