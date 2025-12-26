// frontend/src/components/profile/EditProfile.js
import React, { useState, useEffect } from 'react';
import { 
  X, 
  Save, 
  User, 
  Mail, 
  Phone, 
  Calendar,
  MapPin,
  School,
  Target,
  Globe,
  Plus,
  Minus
} from 'lucide-react';
import { useProfile } from '../../hooks/useProfile';

const EditProfile = ({ isOpen, onClose }) => {
  const { profile, updateBasicProfile, updateExtendedProfile, loading } = useProfile();
  
  const [activeTab, setActiveTab] = useState('basic');
  const [basicData, setBasicData] = useState({
    emri: '',
    mbiemri: '',
    email: '',
    telefoni: '',
    ditelindja: ''
  });
  
  const [extendedData, setExtendedData] = useState({
    bio: '',
    gjinia: '',
    qyteti: '',
    adresa: '',
    shkolla_aktuale: '',
    klasa: '',
    interesa: [],
    aftesi: [],
    qellimet_karrieres: '',
    linkedin_url: '',
    github_url: '',
    portfolio_url: ''
  });

  const [errors, setErrors] = useState({});
  const [newInterest, setNewInterest] = useState('');
  const [newSkill, setNewSkill] = useState('');


  useEffect(() => {
    if (profile && isOpen) {
      setBasicData({
        emri: profile.emri || '',
        mbiemri: profile.mbiemri || '',
        email: profile.email || '',
        telefoni: profile.telefoni || '',
        ditelindja: profile.ditelindja ? profile.ditelindja.split('T')[0] : ''
      });
      
      setExtendedData({
        bio: profile.profile.bio || '',
        gjinia: profile.profile.gjinia || '',
        qyteti: profile.profile.qyteti || '',
        adresa: profile.profile.adresa || '',
        shkolla_aktuale: profile.profile.shkolla_aktuale || '',
        klasa: profile.profile.klasa || '',
        interesa: profile.profile.interesa || [],
        aftesi: profile.profile.aftesi || [],
        qellimet_karrieres: profile.profile.qellimet_karrieres || '',
        linkedin_url: profile.profile.linkedin_url || '',
        github_url: profile.profile.github_url || '',
        portfolio_url: profile.profile.portfolio_url || ''
      });
    }
  }, [profile, isOpen]);

  const validateBasic = () => {
    const newErrors = {};
    
    if (!basicData.emri.trim()) newErrors.emri = 'Emri është i detyrueshëm';
    if (!basicData.mbiemri.trim()) newErrors.mbiemri = 'Mbiemri është i detyrueshëm';
    if (!basicData.email.trim()) {
      newErrors.email = 'Email-i është i detyrueshëm';
    } else if (!/\S+@\S+\.\S+/.test(basicData.email)) {
      newErrors.email = 'Format i gabuar i email-it';
    }
    if (basicData.telefoni && !/^\+?[\d\s\-\(\)]+$/.test(basicData.telefoni)) {
      newErrors.telefoni = 'Format i gabuar i telefonit';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateExtended = () => {
    const newErrors = {};
    
    if (extendedData.bio && extendedData.bio.length > 500) {
      newErrors.bio = 'Biografia nuk mund të jetë më shumë se 500 karaktere';
    }
    if (extendedData.linkedin_url && extendedData.linkedin_url.trim() && !isValidUrl(extendedData.linkedin_url)) {
      newErrors.linkedin_url = 'LinkedIn URL i pavlefshëm';
    }
    if (extendedData.github_url && extendedData.github_url.trim() && !isValidUrl(extendedData.github_url)) {
      newErrors.github_url = 'GitHub URL i pavlefshëm';
    }
    if (extendedData.portfolio_url && extendedData.portfolio_url.trim() && !isValidUrl(extendedData.portfolio_url)) {
      newErrors.portfolio_url = 'Portfolio URL i pavlefshëm';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const isValidUrl = (string) => {
    try {
      new URL(string);
      return true;
    } catch {
      return false;
    }
  };

  const handleBasicChange = (e) => {
    const { name, value } = e.target;
    setBasicData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleExtendedChange = (e) => {
    const { name, value } = e.target;
    setExtendedData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const addInterest = () => {
    if (newInterest.trim() && !extendedData.interesa.includes(newInterest.trim())) {
      setExtendedData(prev => ({
        ...prev,
        interesa: [...prev.interesa, newInterest.trim()]
      }));
      setNewInterest('');
    }
  };

  const removeInterest = (index) => {
    setExtendedData(prev => ({
      ...prev,
      interesa: prev.interesa.filter((_, i) => i !== index)
    }));
  };

  const addSkill = () => {
    if (newSkill.trim() && !extendedData.aftesi.includes(newSkill.trim())) {
      setExtendedData(prev => ({
        ...prev,
        aftesi: [...prev.aftesi, newSkill.trim()]
      }));
      setNewSkill('');
    }
  };

  const removeSkill = (index) => {
    setExtendedData(prev => ({
      ...prev,
      aftesi: prev.aftesi.filter((_, i) => i !== index)
    }));
  };

  const handleSaveBasic = async () => {
    if (!validateBasic()) return;
    
    try {
      await updateBasicProfile(basicData);
      onClose();
    } catch (error) {
      console.error('Error updating basic profile:', error);
    }
  };

  const handleSaveExtended = async () => {
    if (!validateExtended()) return;
    
    try {
      await updateExtendedProfile(extendedData);
      onClose();
    } catch (error) {
      console.error('Error updating extended profile:', error);
    }
  };

  if (!isOpen) return null;

  const tabs = [
    { id: 'basic', name: 'Bazik', icon: User },
    { id: 'extended', name: 'Të detajuara', icon: Target }
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">Edito Profilin</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Tabs */}
        <div className="border-b">
          <nav className="flex space-x-8 px-6">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm ${
                    isActive
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span>{tab.name}</span>
                </button>
              );
            })}
          </nav>
        </div>

        <div className="p-6">
          {activeTab === 'basic' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Emri *
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                      type="text"
                      name="emri"
                      value={basicData.emri}
                      onChange={handleBasicChange}
                      className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        errors.emri ? 'border-red-300' : 'border-gray-300'
                      }`}
                      placeholder="Shkruani emrin"
                    />
                  </div>
                  {errors.emri && <p className="text-red-500 text-xs mt-1">{errors.emri}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Mbiemri *
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                      type="text"
                      name="mbiemri"
                      value={basicData.mbiemri}
                      onChange={handleBasicChange}
                      className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        errors.mbiemri ? 'border-red-300' : 'border-gray-300'
                      }`}
                      placeholder="Shkruani mbiemrin"
                    />
                  </div>
                  {errors.mbiemri && <p className="text-red-500 text-xs mt-1">{errors.mbiemri}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email *
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                      type="email"
                      name="email"
                      value={basicData.email}
                      onChange={handleBasicChange}
                      className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        errors.email ? 'border-red-300' : 'border-gray-300'
                      }`}
                      placeholder="email@example.com"
                    />
                  </div>
                  {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Telefoni
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                      type="tel"
                      name="telefoni"
                      value={basicData.telefoni}
                      onChange={handleBasicChange}
                      className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        errors.telefoni ? 'border-red-300' : 'border-gray-300'
                      }`}
                      placeholder="+355 69 123 4567"
                    />
                  </div>
                  {errors.telefoni && <p className="text-red-500 text-xs mt-1">{errors.telefoni}</p>}
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Datëlindja
                  </label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                      type="date"
                      name="ditelindja"
                      value={basicData.ditelindja}
                      onChange={handleBasicChange}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end space-x-4 pt-6 border-t">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Anulo
                </button>
                <button
                  onClick={handleSaveBasic}
                  disabled={loading}
                  className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {loading ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  <span>{loading ? 'Duke ruajtur...' : 'Ruaj Ndryshimet'}</span>
                </button>
              </div>
            </div>
          )}

          {activeTab === 'extended' && (
            <div className="space-y-6">
              {/* Biography */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Biografia
                </label>
                <textarea
                  name="bio"
                  value={extendedData.bio}
                  onChange={handleExtendedChange}
                  rows="4"
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.bio ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="Shkruani një përshkrim të shkurtër për veten..."
                />
                <div className="flex justify-between items-center mt-1">
                  {errors.bio && <p className="text-red-500 text-xs">{errors.bio}</p>}
                  <p className="text-xs text-gray-500 ml-auto">
                    {extendedData.bio.length}/500 karaktere
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Gjinia
                  </label>
                  <select
                    name="gjinia"
                    value={extendedData.gjinia}
                    onChange={handleExtendedChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Zgjidhni gjininë</option>
                    <option value="M">Mashkull</option>
                    <option value="F">Femër</option>
                    <option value="Other">Tjetër</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Qyteti
                  </label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                      type="text"
                      name="qyteti"
                      value={extendedData.qyteti}
                      onChange={handleExtendedChange}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Tiranë, Durrës, Vlorë..."
                    />
                  </div>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Adresa
                  </label>
                  <input
                    type="text"
                    name="adresa"
                    value={extendedData.adresa}
                    onChange={handleExtendedChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Adresa e plotë"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Shkolla/Universiteti
                  </label>
                  <div className="relative">
                    <School className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                      type="text"
                      name="shkolla_aktuale"
                      value={extendedData.shkolla_aktuale}
                      onChange={handleExtendedChange}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Emri i shkollës ose universitetit"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Klasa/Viti
                  </label>
                  <input
                    type="text"
                    name="klasa"
                    value={extendedData.klasa}
                    onChange={handleExtendedChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="12, Bachelor 3, Master 1..."
                  />
                </div>
              </div>

              {/* Interests */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Interesat
                </label>
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <input
                      type="text"
                      value={newInterest}
                      onChange={(e) => setNewInterest(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && addInterest()}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Shtoni një interes të ri..."
                    />
                    <button
                      type="button"
                      onClick={addInterest}
                      className="flex items-center justify-center w-10 h-10 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                  
                  {extendedData.interesa.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {extendedData.interesa.map((interest, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full"
                        >
                          {interest}
                          <button
                            type="button"
                            onClick={() => removeInterest(index)}
                            className="ml-2 text-blue-600 hover:text-blue-800"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Skills */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Aftësitë
                </label>
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <input
                      type="text"
                      value={newSkill}
                      onChange={(e) => setNewSkill(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && addSkill()}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Shtoni një aftësi të re..."
                    />
                    <button
                      type="button"
                      onClick={addSkill}
                      className="flex items-center justify-center w-10 h-10 bg-green-600 text-white rounded-lg hover:bg-green-700"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                  
                  {extendedData.aftesi.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {extendedData.aftesi.map((skill, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center px-3 py-1 bg-green-100 text-green-800 text-sm rounded-full"
                        >
                          {skill}
                          <button
                            type="button"
                            onClick={() => removeSkill(index)}
                            className="ml-2 text-green-600 hover:text-green-800"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Career Goals */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Qëllimet e Karrierës
                </label>
                <textarea
                  name="qellimet_karrieres"
                  value={extendedData.qellimet_karrieres}
                  onChange={handleExtendedChange}
                  rows="3"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Çfarë dëshironi të arrini në karrierën tuaj..."
                />
              </div>

              {/* Social Links */}
              <div className="space-y-4">
                <h4 className="text-sm font-medium text-gray-900">Linqe Sociale dhe Profesionale</h4>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    LinkedIn URL
                  </label>
                  <div className="relative">
                    <Globe className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                      type="url"
                      name="linkedin_url"
                      value={extendedData.linkedin_url}
                      onChange={handleExtendedChange}
                      className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        errors.linkedin_url ? 'border-red-300' : 'border-gray-300'
                      }`}
                      placeholder="https://linkedin.com/in/yourprofile"
                    />
                  </div>
                  {errors.linkedin_url && <p className="text-red-500 text-xs mt-1">{errors.linkedin_url}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    GitHub URL
                  </label>
                  <div className="relative">
                    <Globe className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                      type="url"
                      name="github_url"
                      value={extendedData.github_url}
                      onChange={handleExtendedChange}
                      className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        errors.github_url ? 'border-red-300' : 'border-gray-300'
                      }`}
                      placeholder="https://github.com/yourusername"
                    />
                  </div>
                  {errors.github_url && <p className="text-red-500 text-xs mt-1">{errors.github_url}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Portfolio URL
                  </label>
                  <div className="relative">
                    <Globe className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                      type="url"
                      name="portfolio_url"
                      value={extendedData.portfolio_url}
                      onChange={handleExtendedChange}
                      className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        errors.portfolio_url ? 'border-red-300' : 'border-gray-300'
                      }`}
                      placeholder="https://yourportfolio.com"
                    />
                  </div>
                  {errors.portfolio_url && <p className="text-red-500 text-xs mt-1">{errors.portfolio_url}</p>}
                </div>
              </div>

              <div className="flex items-center justify-end space-x-4 pt-6 border-t">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Anulo
                </button>
                <button
                  onClick={handleSaveExtended}
                  disabled={loading}
                  className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {loading ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  <span>{loading ? 'Duke ruajtur...' : 'Ruaj Ndryshimet'}</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EditProfile;