// frontend/src/hooks/useProfile.js
import { useState, useEffect, useCallback } from 'react';
import { profileService } from '../services/profileService';
import { useAuth } from '../context/AuthContext';

export const useProfile = () => {
  const { user: authUser, updateUser } = useAuth();
  const [profile, setProfile] = useState(null);
  const [completion, setCompletion] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);


  const loadProfile = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await profileService.getProfile();
      if (response.success) {
        setProfile(response.data);
        setCompletion(response.data.completion || 0);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Gabim në ngarkimin e profilit');
      console.error('Error loading profile:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const updateBasicProfile = useCallback(async (profileData) => {
    try {
      setLoading(true);
      setError(null);

      const response = await profileService.updateBasicProfile(profileData);
      if (response.success) {
        await loadProfile(); 
       
        updateUser({
          fullName: `${profileData.emri} ${profileData.mbiemri}`,
          email: profileData.email
        });

        return response;
      }
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Gabim në përditësimin e profilit';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [loadProfile, updateUser]);


  const updateExtendedProfile = useCallback(async (profileData) => {
    try {
      setLoading(true);
      setError(null);

      const response = await profileService.updateExtendedProfile(profileData);
      if (response.success) {
        await loadProfile(); 
        return response;
      }
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Gabim në përditësimin e profilit të zgjeruar';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [loadProfile]);

  
  const changePassword = useCallback(async (passwordData) => {
    try {
      setLoading(true);
      setError(null);

      const response = await profileService.changePassword(passwordData);
      if (response.success) {
        return response;
      }
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Gabim në ndryshimin e fjalëkalimit';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);


  const markProfileCompleted = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await profileService.markProfileCompleted();
      if (response.success) {
        await loadProfile();
        return response;
      }
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Gabim në shënimin e profilit';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [loadProfile]);

  const refreshCompletion = useCallback(async () => {
    try {
      const response = await profileService.getProfileCompletion();
      if (response.success) {
        setCompletion(response.data.completion);
        return response.data.completion;
      }
    } catch (err) {
      console.error('Error getting profile completion:', err);
    }
  }, []);


  const clearError = useCallback(() => {
    setError(null);
  }, []);


  useEffect(() => {
    if (authUser) {
      loadProfile();
    }
  }, [authUser, loadProfile]);


  const getProfileInitials = useCallback(() => {
    if (!profile) return 'US';
    const firstName = profile.emri || '';
    const lastName = profile.mbiemri || '';
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  }, [profile]);

  const getCompletionMessage = useCallback(() => {
    if (completion >= 80) return 'Profili juaj është i kompletuar!';
    if (completion >= 50) return 'Profili juaj është pjesërisht i kompletuar';
    return 'Ju lutemi kompletoni profilin tuaj';
  }, [completion]);

  const isProfileComplete = useCallback(() => {
    return completion >= 80;
  }, [completion]);

  const getMissingFields = useCallback(() => {
    if (!profile) return [];

    const missingFields = [];
    
    if (!profile.emri) missingFields.push('Emri');
    if (!profile.mbiemri) missingFields.push('Mbiemri');
    if (!profile.email) missingFields.push('Email-i');
    if (!profile.profile?.education_level) missingFields.push('Niveli arsimor');
    if (!profile.profile?.current_school) missingFields.push('Shkolla aktuale');
    if (!profile.profile?.interests) missingFields.push('Interesat');
    if (!profile.profile?.goals) missingFields.push('Qëllimet');
    if (!profile.profile?.strengths) missingFields.push('Pikat e forta');
    if (!profile.profile?.skills) missingFields.push('Aftësitë');

    return missingFields;
  }, [profile]);

  return {

    profile,
    completion,
    loading,
    error,
  
    loadProfile,
    updateBasicProfile,
    updateExtendedProfile,
    changePassword,
    markProfileCompleted,
    refreshCompletion,
    clearError,
    getProfileInitials,
    getCompletionMessage,
    isProfileComplete,
    getMissingFields,
    
    isLoaded: !!profile,
    fullName: profile ? `${profile.emri || ''} ${profile.mbiemri || ''}`.trim() : '',
    roleDisplay: profile?.roli === 'ADMIN' ? 'Administrator' : 
                 profile?.roli === 'COUNSELOR' ? 'Këshillues' : 'Nxënës'
  };
};