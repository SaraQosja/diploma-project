import React, { useState, useEffect } from 'react';
import { 
    Plus, 
    Search, 
    Edit, 
    Trash2, 
    Eye, 
    Clock, 
    Users, 
    CheckCircle,
    XCircle,
    Copy,
    FileText  // Shto këtë
} from 'lucide-react';

const TestManagement = () => {
    const [tests, setTests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [modalMode, setModalMode] = useState('create');
    const [selectedTest, setSelectedTest] = useState(null);
    const [filters, setFilters] = useState({
        search: '',
        type: ''
    });
    const [pagination, setPagination] = useState({
        currentPage: 1,
        totalPages: 1,
        total: 0,
        limit: 10
    });

    useEffect(() => {
        fetchTests();
    }, [filters, pagination.currentPage]);

    const fetchTests = async () => {
        try {
            setLoading(true);
            const queryParams = new URLSearchParams({
                page: pagination.currentPage,
                limit: pagination.limit,
                ...filters
            });

            const response = await fetch(`/api/admin/tests?${queryParams}`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                const data = await response.json();
                setTests(data.data.tests);
                setPagination(prev => ({
                    ...prev,
                    totalPages: data.data.totalPages,
                    total: data.data.total
                }));
                setError('');
            } else {
                setError('Failed to fetch tests');
            }
        } catch (err) {
            setError('Error loading tests');
        } finally {
            setLoading(false);
        }
    };

    const handleCreateTest = async (testData) => {
        try {
            const response = await fetch('/api/admin/tests', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(testData)
            });

            if (response.ok) {
                setShowModal(false);
                fetchTests();
                setError('');
            } else {
                const errorData = await response.json();
                setError(errorData.message || 'Failed to create test');
            }
        } catch (err) {
            setError('Error creating test');
        }
    };

    const handleUpdateTest = async (testId, testData) => {
        try {
            const response = await fetch(`/api/admin/tests/${testId}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(testData)
            });

            if (response.ok) {
                setShowModal(false);
                fetchTests();
                setError('');
            } else {
                const errorData = await response.json();
                setError(errorData.message || 'Failed to update test');
            }
        } catch (err) {
            setError('Error updating test');
        }
    };

    const handleDeleteTest = async (testId) => {
        if (!window.confirm('Are you sure you want to delete this test? This action cannot be undone.')) {
            return;
        }

        try {
            const response = await fetch(`/api/admin/tests/${testId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                fetchTests();
                setError('');
            } else {
                const errorData = await response.json();
                setError(errorData.message || 'Failed to delete test');
            }
        } catch (err) {
            setError('Error deleting test');
        }
    };

    const handleDuplicateTest = async (test) => {
        const duplicatedTest = {
            ...test,
            title: `${test.title} (Copy)`,
            _id: undefined,
            createdAt: undefined,
            updatedAt: undefined
        };
        
        await handleCreateTest(duplicatedTest);
    };

    const openModal = (mode, test = null) => {
        setModalMode(mode);
        setSelectedTest(test);
        setShowModal(true);
    };

    const TestModal = () => {
        const [formData, setFormData] = useState({
            title: selectedTest?.title || '',
            description: selectedTest?.description || '',
            type: selectedTest?.type || 'career',
            timeLimit: selectedTest?.timeLimit || 30,
            passingScore: selectedTest?.passingScore || 70,
            questions: selectedTest?.questions || [
                {
                    question: '',
                    type: 'multiple_choice',
                    options: ['', '', '', ''],
                    correctAnswer: 0,
                    points: 1
                }
            ],
            isActive: selectedTest?.isActive ?? true
        });

        const handleSubmit = (e) => {
            e.preventDefault();
            
            // Validate questions
            const validQuestions = formData.questions.filter(q => 
                q.question.trim() && 
                q.options.every(opt => opt.trim())
            );
            
            if (validQuestions.length === 0) {
                setError('Please add at least one complete question');
                return;
            }

            const testData = {
                ...formData,
                questions: validQuestions
            };

            if (modalMode === 'create') {
                handleCreateTest(testData);
            } else if (modalMode === 'edit') {
                handleUpdateTest(selectedTest._id, testData);
            }
        };

        const handleChange = (e) => {
            const { name, value, type, checked } = e.target;
            setFormData(prev => ({
                ...prev,
                [name]: type === 'checkbox' ? checked : value
            }));
        };

        const addQuestion = () => {
            setFormData(prev => ({
                ...prev,
                questions: [
                    ...prev.questions,
                    {
                        question: '',
                        type: 'multiple_choice',
                        options: ['', '', '', ''],
                        correctAnswer: 0,
                        points: 1
                    }
                ]
            }));
        };

        const updateQuestion = (index, field, value) => {
            setFormData(prev => ({
                ...prev,
                questions: prev.questions.map((q, i) => 
                    i === index ? { ...q, [field]: value } : q
                )
            }));
        };

        const updateQuestionOption = (qIndex, optIndex, value) => {
            setFormData(prev => ({
                ...prev,
                questions: prev.questions.map((q, i) => 
                    i === qIndex ? {
                        ...q,
                        options: q.options.map((opt, oi) => oi === optIndex ? value : opt)
                    } : q
                )
            }));
        };

        const removeQuestion = (index) => {
            if (formData.questions.length > 1) {
                setFormData(prev => ({
                    ...prev,
                    questions: prev.questions.filter((_, i) => i !== index)
                }));
            }
        };

        return (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-lg font-semibold">
                            {modalMode === 'create' ? 'Create Test' : 
                             modalMode === 'edit' ? 'Edit Test' : 'View Test'}
                        </h3>
                        <button
                            onClick={() => setShowModal(false)}
                            className="text-gray-500 hover:text-gray-700"
                        >
                            ×
                        </button>
                    </div>

                    {modalMode === 'view' ? (
                        <div className="space-y-6">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                                    <p className="text-sm text-gray-900">{selectedTest?.title}</p>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                                    <p className="text-sm text-gray-900 capitalize">{selectedTest?.type}</p>
                                </div>
                            </div>
                            
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                                <p className="text-sm text-gray-900">{selectedTest?.description}</p>
                            </div>

                            <div className="grid grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Time Limit</label>
                                    <p className="text-sm text-gray-900">{selectedTest?.timeLimit} minutes</p>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Passing Score</label>
                                    <p className="text-sm text-gray-900">{selectedTest?.passingScore}%</p>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                                    <span className={`inline-flex px-2 py-1 text-xs rounded-full ${
                                        selectedTest?.isActive 
                                            ? 'bg-green-100 text-green-800' 
                                            : 'bg-red-100 text-red-800'
                                    }`}>
                                        {selectedTest?.isActive ? 'Active' : 'Inactive'}
                                    </span>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Questions ({selectedTest?.questions?.length})</label>
                                <div className="space-y-4">
                                    {selectedTest?.questions?.map((question, index) => (
                                        <div key={index} className="border rounded-lg p-4">
                                            <h4 className="font-medium mb-2">Q{index + 1}: {question.question}</h4>
                                            <div className="space-y-1">
                                                {question.options.map((option, optIndex) => (
                                                    <div key={optIndex} className={`flex items-center space-x-2 ${
                                                        question.correctAnswer === optIndex ? 'text-green-600 font-medium' : 'text-gray-700'
                                                    }`}>
                                                        <span className="text-sm">
                                                            {String.fromCharCode(65 + optIndex)}. {option}
                                                            {question.correctAnswer === optIndex && ' ✓'}
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>
                                            <p className="text-sm text-gray-500 mt-2">Points: {question.points}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-6">
                            {/* Basic Information */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Title *
                                    </label>
                                    <input
                                        type="text"
                                        name="title"
                                        value={formData.title}
                                        onChange={handleChange}
                                        required
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Type *
                                    </label>
                                    <select
                                        name="type"
                                        value={formData.type}
                                        onChange={handleChange}
                                        required
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                                    >
                                        <option value="career">Career Assessment</option>
                                        <option value="personality">Personality Test</option>
                                        <option value="skill">Skill Assessment</option>
                                        <option value="academic">Academic Test</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Description *
                                </label>
                                <textarea
                                    name="description"
                                    value={formData.description}
                                    onChange={handleChange}
                                    required
                                    rows={3}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                                />
                            </div>

                            <div className="grid grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Time Limit (minutes)
                                    </label>
                                    <input
                                        type="number"
                                        name="timeLimit"
                                        value={formData.timeLimit}
                                        onChange={handleChange}
                                        min="1"
                                        max="300"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Passing Score (%)
                                    </label>
                                    <input
                                        type="number"
                                        name="passingScore"
                                        value={formData.passingScore}
                                        onChange={handleChange}
                                        min="0"
                                        max="100"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                                    />
                                </div>
                                <div className="flex items-end">
                                    <label className="flex items-center">
                                        <input
                                            type="checkbox"
                                            name="isActive"
                                            checked={formData.isActive}
                                            onChange={handleChange}
                                            className="mr-2"
                                        />
                                        <span className="text-sm text-gray-700">Active</span>
                                    </label>
                                </div>
                            </div>

                            {/* Questions Section */}
                            <div>
                                <div className="flex items-center justify-between mb-4">
                                    <h4 className="text-lg font-medium text-gray-900">Questions</h4>
                                    <button
                                        type="button"
                                        onClick={addQuestion}
                                        className="flex items-center space-x-2 text-blue-600 hover:text-blue-800"
                                    >
                                        <Plus className="w-4 h-4" />
                                        <span>Add Question</span>
                                    </button>
                                </div>

                                <div className="space-y-6">
                                    {formData.questions.map((question, qIndex) => (
                                        <div key={qIndex} className="border rounded-lg p-4 bg-gray-50">
                                            <div className="flex items-center justify-between mb-3">
                                                <h5 className="font-medium text-gray-900">Question {qIndex + 1}</h5>
                                                {formData.questions.length > 1 && (
                                                    <button
                                                        type="button"
                                                        onClick={() => removeQuestion(qIndex)}
                                                        className="text-red-600 hover:text-red-800"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                )}
                                            </div>

                                            <div className="space-y-3">
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                                        Question Text *
                                                    </label>
                                                    <input
                                                        type="text"
                                                        value={question.question}
                                                        onChange={(e) => updateQuestion(qIndex, 'question', e.target.value)}
                                                        required
                                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                                                        placeholder="Enter your question here..."
                                                    />
                                                </div>

                                                <div className="grid grid-cols-2 gap-4">
                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                                            Answer Options *
                                                        </label>
                                                        <div className="space-y-2">
                                                            {question.options.map((option, optIndex) => (
                                                                <div key={optIndex} className="flex items-center space-x-2">
                                                                    <input
                                                                        type="radio"
                                                                        name={`correct-${qIndex}`}
                                                                        checked={question.correctAnswer === optIndex}
                                                                        onChange={() => updateQuestion(qIndex, 'correctAnswer', optIndex)}
                                                                        className="text-blue-600"
                                                                    />
                                                                    <span className="text-sm font-medium text-gray-700 w-6">
                                                                        {String.fromCharCode(65 + optIndex)}.
                                                                    </span>
                                                                    <input
                                                                        type="text"
                                                                        value={option}
                                                                        onChange={(e) => updateQuestionOption(qIndex, optIndex, e.target.value)}
                                                                        required
                                                                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                                                                        placeholder={`Option ${String.fromCharCode(65 + optIndex)}`}
                                                                    />
                                                                </div>
                                                            ))}
                                                        </div>
                                                        <p className="text-xs text-gray-500 mt-1">
                                                            Select the correct answer by clicking the radio button
                                                        </p>
                                                    </div>

                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                                            Points
                                                        </label>
                                                        <input
                                                            type="number"
                                                            value={question.points}
                                                            onChange={(e) => updateQuestion(qIndex, 'points', parseInt(e.target.value) || 1)}
                                                            min="1"
                                                            max="10"
                                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="flex justify-end space-x-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                                >
                                    {modalMode === 'create' ? 'Create Test' : 'Update Test'}
                                </button>
                            </div>
                        </form>
                    )}
                </div>
            </div>
        );
    };

    return (
        <div className="space-y-6">
            {/* Header with Actions */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="flex-1 max-w-md">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                        <input
                            type="text"
                            placeholder="Search tests..."
                            value={filters.search}
                            onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                            className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>
                </div>
                
                <div className="flex items-center space-x-3">
                    <select
                        value={filters.type}
                        onChange={(e) => setFilters(prev => ({ ...prev, type: e.target.value }))}
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="">All Types</option>
                        <option value="career">Career Assessment</option>
                        <option value="personality">Personality Test</option>
                        <option value="skill">Skill Assessment</option>
                        <option value="academic">Academic Test</option>
                    </select>
                    
                    <button
                        onClick={() => openModal('create')}
                        className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                    >
                        <Plus className="w-5 h-5" />
                        <span>Create Test</span>
                    </button>
                </div>
            </div>

            {/* Error Message */}
            {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <p className="text-red-600">{error}</p>
                </div>
            )}

            {/* Tests Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {loading ? (
                    Array.from({ length: 6 }).map((_, index) => (
                        <div key={index} className="bg-white rounded-lg shadow-md p-6 animate-pulse">
                            <div className="h-4 bg-gray-200 rounded mb-4"></div>
                            <div className="h-3 bg-gray-200 rounded mb-2"></div>
                            <div className="h-3 bg-gray-200 rounded mb-4"></div>
                            <div className="flex justify-between items-center">
                                <div className="h-6 bg-gray-200 rounded w-16"></div>
                                <div className="flex space-x-2">
                                    <div className="h-8 w-8 bg-gray-200 rounded"></div>
                                    <div className="h-8 w-8 bg-gray-200 rounded"></div>
                                    <div className="h-8 w-8 bg-gray-200 rounded"></div>
                                </div>
                            </div>
                        </div>
                    ))
                ) : tests.length === 0 ? (
                    <div className="col-span-full text-center py-12">
                        <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-500">No tests found</p>
                        <button
                            onClick={() => openModal('create')}
                            className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                        >
                            Create your first test
                        </button>
                    </div>
                ) : (
                    tests.map((test) => (
                        <div key={test._id} className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow">
                            <div className="p-6">
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex-1">
                                        <h3 className="font-semibold text-gray-900 mb-2">{test.title}</h3>
                                        <p className="text-sm text-gray-600 line-clamp-2">{test.description}</p>
                                    </div>
                                    <span className={`inline-flex px-2 py-1 text-xs rounded-full capitalize ${
                                        test.type === 'career' ? 'bg-blue-100 text-blue-800' :
                                        test.type === 'personality' ? 'bg-purple-100 text-purple-800' :
                                        test.type === 'skill' ? 'bg-green-100 text-green-800' :
                                        'bg-orange-100 text-orange-800'
                                    }`}>
                                        {test.type}
                                    </span>
                                </div>

                                <div className="flex items-center space-x-4 text-sm text-gray-500 mb-4">
                                    <div className="flex items-center space-x-1">
                                        <Clock className="w-4 h-4" />
                                        <span>{test.timeLimit}min</span>
                                    </div>
                                    <div className="flex items-center space-x-1">
                                        <Users className="w-4 h-4" />
                                        <span>{test.questions?.length || 0}Q</span>
                                    </div>
                                    <div className="flex items-center space-x-1">
                                        {test.isActive ? (
                                            <CheckCircle className="w-4 h-4 text-green-500" />
                                        ) : (
                                            <XCircle className="w-4 h-4 text-red-500" />
                                        )}
                                        <span>{test.isActive ? 'Active' : 'Inactive'}</span>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                                    <span className="text-sm text-gray-500">
                                        Pass: {test.passingScore}%
                                    </span>
                                    <div className="flex items-center space-x-2">
                                        <button
                                            onClick={() => openModal('view', test)}
                                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                                            title="View test"
                                        >
                                            <Eye className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => openModal('edit', test)}
                                            className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg"
                                            title="Edit test"
                                        >
                                            <Edit className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => handleDuplicateTest(test)}
                                            className="p-2 text-green-600 hover:bg-green-50 rounded-lg"
                                            title="Duplicate test"
                                        >
                                            <Copy className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => handleDeleteTest(test._id)}
                                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                                            title="Delete test"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
                <div className="flex items-center justify-between bg-white px-4 py-3 rounded-lg shadow-md">
                    <div className="text-sm text-gray-700">
                        Showing {(pagination.currentPage - 1) * pagination.limit + 1} to{' '}
                        {Math.min(pagination.currentPage * pagination.limit, pagination.total)} of{' '}
                        {pagination.total} tests
                    </div>
                    <div className="flex items-center space-x-2">
                        <button
                            onClick={() => setPagination(prev => ({ ...prev, currentPage: prev.currentPage - 1 }))}
                            disabled={pagination.currentPage === 1}
                            className="px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                        >
                            Previous
                        </button>
                        <span className="px-3 py-2 text-sm text-gray-700">
                            Page {pagination.currentPage} of {pagination.totalPages}
                        </span>
                        <button
                            onClick={() => setPagination(prev => ({ ...prev, currentPage: prev.currentPage + 1 }))}
                            disabled={pagination.currentPage === pagination.totalPages}
                            className="px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                        >
                            Next
                        </button>
                    </div>
                </div>
            )}

            {/* Modal */}
            {showModal && <TestModal />}
        </div>
    );
};

export default TestManagement;