// frontend/src/components/admin/UserModals.js
import React, { useState, useEffect } from 'react';

const UserModals = ({
    showCreateModal,
    showEditModal,
    selectedUser,
    onCreateUser,
    onUpdateUser,
    onCloseCreate,
    onCloseEdit
}) => {
    const [formData, setFormData] = useState({
        emri: '',
        surname: '',
        emaili: '',
        passwordi: '',
        roli: 'user',
        isCounselor: false,
        specialization: '',
        counselorBio: '',
        isAvailable: true
    });
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (showEditModal && selectedUser) {
            setFormData({
                emri: selectedUser.EMRI || '',
                surname: selectedUser.SURNAME || '',
                emaili: selectedUser.EMAILI || '',
                passwordi: '',
                roli: selectedUser.ROLI || 'user',
                isCounselor: selectedUser.IS_COUNSELOR === 1,
                specialization: selectedUser.SPECIALIZATION || '',
                counselorBio: selectedUser.COUNSELOR_BIO || '',
                isAvailable: selectedUser.IS_AVAILABLE === 1
            });
        } else if (showCreateModal) {
            setFormData({
                emri: '',
                surname: '',
                emaili: '',
                passwordi: '',
                roli: 'user',
                isCounselor: false,
                specialization: '',
                counselorBio: '',
                isAvailable: true
            });
        }
        setErrors({});
    }, [showCreateModal, showEditModal, selectedUser]);

    const validateForm = () => {
        const newErrors = {};

        if (!formData.emri.trim()) {
            newErrors.emri = 'Name is required';
        } else if (formData.emri.length < 2) {
            newErrors.emri = 'Name must be at least 2 characters';
        }

        if (!formData.surname.trim()) {
            newErrors.surname = 'Surname is required';
        } else if (formData.surname.length < 2) {
            newErrors.surname = 'Surname must be at least 2 characters';
        }

        if (!formData.emaili.trim()) {
            newErrors.emaili = 'Email is required';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.emaili)) {
            newErrors.emaili = 'Please enter a valid email address';
        }

        if (showCreateModal && !formData.passwordi) {
            newErrors.passwordi = 'Password is required';
        } else if (formData.passwordi && formData.passwordi.length < 6) {
            newErrors.passwordi = 'Password must be at least 6 characters';
        }

        if (formData.isCounselor) {
            if (!formData.specialization.trim()) {
                newErrors.specialization = 'Specialization is required for counselors';
            }
            if (!formData.counselorBio.trim()) {
                newErrors.counselorBio = 'Bio is required for counselors';
            }
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!validateForm()) {
            return;
        }

        setLoading(true);
        try {
            const submitData = {
                ...formData,
                isCounselor: formData.isCounselor ? 1 : 0,
                isAvailable: formData.isAvailable ? 1 : 0
            };

            // Remove password field if empty for edit
            if (showEditModal && !formData.passwordi) {
                delete submitData.passwordi;
            }

            if (showCreateModal) {
                await onCreateUser(submitData);
            } else {
                await onUpdateUser(submitData);
            }
        } catch (error) {
            console.error('Form submission error:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));

        // Clear error when user starts typing
        if (errors[name]) {
            setErrors(prev => ({
                ...prev,
                [name]: ''
            }));
        }
    };

    const Modal = ({ show, onClose, title, children }) => {
        if (!show) return null;

        return (
            <div className="fixed inset-0 z-50 overflow-y-auto">
                <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                    <div 
                        className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
                        onClick={onClose}
                    ></div>

                    <span className="hidden sm:inline-block sm:align-middle sm:h-screen">&#8203;</span>

                    <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
                        <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-lg leading-6 font-medium text-gray-900">
                                    {title}
                                </h3>
                                <button
                                    onClick={onClose}
                                    className="text-gray-400 hover:text-gray-600"
                                >
                                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>
                            {children}
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    const FormField = ({ label, name, type = "text", required = false, error, ...props }) => (
        <div>
            <label className="block text-sm font-medium text-gray-700">
                {label} {required && <span className="text-red-500">*</span>}
            </label>
            <input
                type={type}
                name={name}
                value={formData[name]}
                onChange={handleChange}
                className={`mt-1 block w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 ${
                    error
                        ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                        : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                }`}
                {...props}
            />
            {error && (
                <p className="mt-1 text-sm text-red-600">{error}</p>
            )}
        </div>
    );

    const TextareaField = ({ label, name, required = false, error, rows = 3, ...props }) => (
        <div>
            <label className="block text-sm font-medium text-gray-700">
                {label} {required && <span className="text-red-500">*</span>}
            </label>
            <textarea
                name={name}
                rows={rows}
                value={formData[name]}
                onChange={handleChange}
                className={`mt-1 block w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 ${
                    error
                        ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                        : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                }`}
                {...props}
            />
            {error && (
                <p className="mt-1 text-sm text-red-600">{error}</p>
            )}
        </div>
    );

    const CheckboxField = ({ label, name, description }) => (
        <div className="flex items-start">
            <div className="flex items-center h-5">
                <input
                    type="checkbox"
                    name={name}
                    checked={formData[name]}
                    onChange={handleChange}
                    className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300 rounded"
                />
            </div>
            <div className="ml-3 text-sm">
                <label className="font-medium text-gray-700">{label}</label>
                {description && (
                    <p className="text-gray-500">{description}</p>
                )}
            </div>
        </div>
    );

    const formContent = (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                    label="First Name"
                    name="emri"
                    required
                    error={errors.emri}
                    placeholder="Enter first name"
                />
                <FormField
                    label="Last Name"
                    name="surname"
                    required
                    error={errors.surname}
                    placeholder="Enter last name"
                />
            </div>

            <FormField
                label="Email Address"
                name="emaili"
                type="email"
                required
                error={errors.emaili}
                placeholder="Enter email address"
            />

            <FormField
                label={showCreateModal ? "Password" : "New Password (leave blank to keep current)"}
                name="passwordi"
                type="password"
                required={showCreateModal}
                error={errors.passwordi}
                placeholder={showCreateModal ? "Enter password" : "Enter new password (optional)"}
            />

            <div>
                <label className="block text-sm font-medium text-gray-700">Role</label>
                <select
                    name="roli"
                    value={formData.roli}
                    onChange={handleChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                >
                    <option value="user">User</option>
                    <option value="counselor">Counselor</option>
                </select>
            </div>

            <CheckboxField
                label="Is Counselor"
                name="isCounselor"
                description="Grant counselor privileges to this user"
            />

            {formData.isCounselor && (
                <>
                    <FormField
                        label="Specialization"
                        name="specialization"
                        required={formData.isCounselor}
                        error={errors.specialization}
                        placeholder="e.g., Career Counseling, Psychology"
                    />

                    <TextareaField
                        label="Professional Bio"
                        name="counselorBio"
                        required={formData.isCounselor}
                        error={errors.counselorBio}
                        placeholder="Brief description of counselor's background and expertise"
                        rows={4}
                    />

                    <CheckboxField
                        label="Available for Counseling"
                        name="isAvailable"
                        description="Allow students to book sessions with this counselor"
                    />
                </>
            )}

            <div className="flex justify-end space-x-3 pt-6">
                <button
                    type="button"
                    onClick={showCreateModal ? onCloseCreate : onCloseEdit}
                    className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                    Cancel
                </button>
                <button
                    type="submit"
                    disabled={loading}
                    className="inline-flex justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {loading ? (
                        <>
                            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            {showCreateModal ? 'Creating...' : 'Updating...'}
                        </>
                    ) : (
                        showCreateModal ? 'Create User' : 'Update User'
                    )}
                </button>
            </div>
        </form>
    );

    return (
        <>
            <Modal
                show={showCreateModal}
                onClose={onCloseCreate}
                title="Create New User"
            >
                {formContent}
            </Modal>

            <Modal
                show={showEditModal}
                onClose={onCloseEdit}
                title="Edit User"
            >
                {formContent}
            </Modal>
        </>
    );
};

export default UserModals;