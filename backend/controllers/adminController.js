// backend/controllers/adminController.js
const db = require('../config/database');
const bcrypt = require('bcryptjs');
const logger = require('../utils/logger');

class AdminController {
    // Dashboard Statistics
    async getDashboardStats(req, res) {
        try {
            const adminId = req.user.id;
            
            // Log admin action
            await this.logAdminAction(adminId, 'VIEW_DASHBOARD', 'Viewed admin dashboard');

            // Get total users
            const totalUsersResult = await db.query('SELECT COUNT(*) as count FROM USERS WHERE ROLI != ?', ['admin']);
            const totalUsers = totalUsersResult.rows[0].COUNT;

            // Get total counselors
            const totalCounselorsResult = await db.query('SELECT COUNT(*) as count FROM USERS WHERE IS_COUNSELOR = ?', [1]);
            const totalCounselors = totalCounselorsResult.rows[0].COUNT;

            // Get total tests
            const totalTestsResult = await db.query('SELECT COUNT(*) as count FROM TESTS');
            const totalTests = totalTestsResult.rows[0].COUNT;

            // Get total universities
            const totalUniversitiesResult = await db.query('SELECT COUNT(*) as count FROM UNIVERSITIES');
            const totalUniversities = totalUniversitiesResult.rows[0].COUNT;

            // Get total careers
            const totalCareersResult = await db.query('SELECT COUNT(*) as count FROM CAREERS');
            const totalCareers = totalCareersResult.rows[0].COUNT;

            // Get total chat rooms
            const totalChatRoomsResult = await db.query('SELECT COUNT(*) as count FROM CHAT_ROOMS');
            const totalChatRooms = totalChatRoomsResult.rows[0].COUNT;

            // Get recent activities (last 7 days)
            const recentUsersResult = await db.query(
                'SELECT COUNT(*) as count FROM USERS WHERE CREATED_AT >= SYSDATE - 7'
            );
            const recentUsers = recentUsersResult.rows[0].COUNT;

            // Get active chat rooms today
            const activeChatRoomsResult = await db.query(
                'SELECT COUNT(DISTINCT ROOM_ID) as count FROM CHAT_MESSAGES WHERE CREATED_AT >= TRUNC(SYSDATE)'
            );
            const activeChatRooms = activeChatRoomsResult.rows[0].COUNT;

            // Get test completion stats (last 30 days)
            const testCompletionsResult = await db.query(
                'SELECT COUNT(*) as count FROM USER_TEST_RESULTS WHERE CREATED_AT >= SYSDATE - 30'
            );
            const testCompletions = testCompletionsResult.rows[0].COUNT;

            res.json({
                success: true,
                data: {
                    totalUsers,
                    totalCounselors,
                    totalTests,
                    totalUniversities,
                    totalCareers,
                    totalChatRooms,
                    recentUsers,
                    activeChatRooms,
                    testCompletions
                }
            });
        } catch (error) {
            logger.error('Error fetching dashboard stats:', error);
            res.status(500).json({ 
                success: false, 
                message: 'Error fetching dashboard statistics' 
            });
        }
    }

    // User Management
    async getAllUsers(req, res) {
        try {
            const { page = 1, limit = 20, search = '', role = '' } = req.query;
            const offset = (page - 1) * limit;
            
            let whereClause = "WHERE ROLI != 'admin'";
            let queryParams = [];
            
            if (search) {
                whereClause += " AND (UPPER(EMRI) LIKE ? OR UPPER(SURNAME) LIKE ? OR UPPER(EMAILI) LIKE ?)";
                const searchPattern = `%${search.toUpperCase()}%`;
                queryParams.push(searchPattern, searchPattern, searchPattern);
            }
            
            if (role) {
                whereClause += " AND ROLI = ?";
                queryParams.push(role);
            }

            const query = `
                SELECT * FROM (
                    SELECT u.*, ROW_NUMBER() OVER (ORDER BY u.CREATED_AT DESC) as rn
                    FROM USERS u ${whereClause}
                ) WHERE rn BETWEEN ? AND ?
            `;
            
            queryParams.push(offset + 1, offset + parseInt(limit));
            
            const result = await db.query(query, queryParams);
            
            // Get total count
            const countQuery = `SELECT COUNT(*) as total FROM USERS ${whereClause}`;
            const countResult = await db.query(countQuery, queryParams.slice(0, -2));
            const totalUsers = countResult.rows[0].TOTAL;

            await this.logAdminAction(req.user.id, 'VIEW_USERS', `Viewed users list - Page: ${page}`);

            res.json({
                success: true,
                data: {
                    users: result.rows,
                    pagination: {
                        currentPage: parseInt(page),
                        totalPages: Math.ceil(totalUsers / limit),
                        totalUsers,
                        limit: parseInt(limit)
                    }
                }
            });
        } catch (error) {
            logger.error('Error fetching users:', error);
            res.status(500).json({ 
                success: false, 
                message: 'Error fetching users' 
            });
        }
    }

    async createUser(req, res) {
        try {
            const { emri, surname, emaili, passwordi, roli = 'user', isCounselor = 0, specialization = null, counselorBio = null } = req.body;

            // Check if email exists
            const emailCheck = await db.query('SELECT ID FROM USERS WHERE EMAILI = ?', [emaili]);
            if (emailCheck.rows.length > 0) {
                return res.status(400).json({ 
                    success: false, 
                    message: 'Email already exists' 
                });
            }

            const hashedPassword = await bcrypt.hash(passwordi, 10);

            const query = `
                INSERT INTO USERS (
                    EMRI, SURNAME, EMAILI, PASSWORDI, ROLI, 
                    IS_VERIFIED, IS_COUNSELOR, SPECIALIZATION, COUNSELOR_BIO, IS_AVAILABLE,
                    CREATED_AT, UPDATED_AT
                ) VALUES (?, ?, ?, ?, ?, 1, ?, ?, ?, ?, SYSTIMESTAMP, SYSTIMESTAMP)
            `;

            await db.query(query, [
                emri, surname, emaili, hashedPassword, roli,
                isCounselor, specialization, counselorBio, isCounselor
            ]);

            await this.logAdminAction(req.user.id, 'CREATE_USER', `Created user: ${emri} ${surname} (${emaili})`);

            res.status(201).json({
                success: true,
                message: 'User created successfully'
            });
        } catch (error) {
            logger.error('Error creating user:', error);
            res.status(500).json({ 
                success: false, 
                message: 'Error creating user' 
            });
        }
    }

    async updateUser(req, res) {
        try {
            const { id } = req.params;
            const { emri, surname, emaili, roli, isCounselor, specialization, counselorBio, isAvailable } = req.body;

            // Check if user exists
            const userCheck = await db.query('SELECT ID FROM USERS WHERE ID = ?', [id]);
            if (userCheck.rows.length === 0) {
                return res.status(404).json({ 
                    success: false, 
                    message: 'User not found' 
                });
            }

            // Check if email exists for other users
            const emailCheck = await db.query('SELECT ID FROM USERS WHERE EMAILI = ? AND ID != ?', [emaili, id]);
            if (emailCheck.rows.length > 0) {
                return res.status(400).json({ 
                    success: false, 
                    message: 'Email already exists' 
                });
            }

            const query = `
                UPDATE USERS SET 
                    EMRI = ?, SURNAME = ?, EMAILI = ?, ROLI = ?,
                    IS_COUNSELOR = ?, SPECIALIZATION = ?, COUNSELOR_BIO = ?, 
                    IS_AVAILABLE = ?, UPDATED_AT = SYSTIMESTAMP
                WHERE ID = ?
            `;

            await db.query(query, [
                emri, surname, emaili, roli,
                isCounselor, specialization, counselorBio, isAvailable, id
            ]);

            await this.logAdminAction(req.user.id, 'UPDATE_USER', `Updated user ID: ${id}`);

            res.json({
                success: true,
                message: 'User updated successfully'
            });
        } catch (error) {
            logger.error('Error updating user:', error);
            res.status(500).json({ 
                success: false, 
                message: 'Error updating user' 
            });
        }
    }

    async deleteUser(req, res) {
        try {
            const { id } = req.params;

            // Check if user exists
            const userCheck = await db.query('SELECT EMRI, SURNAME FROM USERS WHERE ID = ?', [id]);
            if (userCheck.rows.length === 0) {
                return res.status(404).json({ 
                    success: false, 
                    message: 'User not found' 
                });
            }

            const user = userCheck.rows[0];

            // Delete user (this should cascade to related tables)
            await db.query('DELETE FROM USERS WHERE ID = ?', [id]);

            await this.logAdminAction(req.user.id, 'DELETE_USER', `Deleted user: ${user.EMRI} ${user.SURNAME} (ID: ${id})`);

            res.json({
                success: true,
                message: 'User deleted successfully'
            });
        } catch (error) {
            logger.error('Error deleting user:', error);
            res.status(500).json({ 
                success: false, 
                message: 'Error deleting user' 
            });
        }
    }

    // Test Management
    async getAllTests(req, res) {
        try {
            const { page = 1, limit = 20, search = '' } = req.query;
            const offset = (page - 1) * limit;
            
            let whereClause = "";
            let queryParams = [];
            
            if (search) {
                whereClause = "WHERE UPPER(TEST_NAME) LIKE ? OR UPPER(TEST_TYPE) LIKE ?";
                const searchPattern = `%${search.toUpperCase()}%`;
                queryParams.push(searchPattern, searchPattern);
            }

            const query = `
                SELECT * FROM (
                    SELECT t.*, ROW_NUMBER() OVER (ORDER BY t.CREATED_AT DESC) as rn
                    FROM TESTS t ${whereClause}
                ) WHERE rn BETWEEN ? AND ?
            `;
            
            queryParams.push(offset + 1, offset + parseInt(limit));
            
            const result = await db.query(query, queryParams);
            
            // Get total count
            const countQuery = `SELECT COUNT(*) as total FROM TESTS ${whereClause}`;
            const countResult = await db.query(countQuery, queryParams.slice(0, -2));
            const totalTests = countResult.rows[0].TOTAL;

            await this.logAdminAction(req.user.id, 'VIEW_TESTS', `Viewed tests list - Page: ${page}`);

            res.json({
                success: true,
                data: {
                    tests: result.rows,
                    pagination: {
                        currentPage: parseInt(page),
                        totalPages: Math.ceil(totalTests / limit),
                        totalTests,
                        limit: parseInt(limit)
                    }
                }
            });
        } catch (error) {
            logger.error('Error fetching tests:', error);
            res.status(500).json({ 
                success: false, 
                message: 'Error fetching tests' 
            });
        }
    }

    async createTest(req, res) {
        try {
            const { testName, testDescription, testType, durationMinutes, totalQuestions, isActive = 1 } = req.body;

            const query = `
                INSERT INTO TESTS (
                    TEST_NAME, TEST_DESCRIPTION, TEST_TYPE, 
                    DURATION_MINUTES, TOTAL_QUESTIONS, IS_ACTIVE, CREATED_AT
                ) VALUES (?, ?, ?, ?, ?, ?, SYSTIMESTAMP)
            `;

            await db.query(query, [testName, testDescription, testType, durationMinutes, totalQuestions, isActive]);

            await this.logAdminAction(req.user.id, 'CREATE_TEST', `Created test: ${testName}`);

            res.status(201).json({
                success: true,
                message: 'Test created successfully'
            });
        } catch (error) {
            logger.error('Error creating test:', error);
            res.status(500).json({ 
                success: false, 
                message: 'Error creating test' 
            });
        }
    }

    async updateTest(req, res) {
        try {
            const { id } = req.params;
            const { testName, testDescription, testType, durationMinutes, totalQuestions, isActive } = req.body;

            // Check if test exists
            const testCheck = await db.query('SELECT TEST_ID FROM TESTS WHERE TEST_ID = ?', [id]);
            if (testCheck.rows.length === 0) {
                return res.status(404).json({ 
                    success: false, 
                    message: 'Test not found' 
                });
            }

            const query = `
                UPDATE TESTS SET 
                    TEST_NAME = ?, TEST_DESCRIPTION = ?, TEST_TYPE = ?,
                    DURATION_MINUTES = ?, TOTAL_QUESTIONS = ?, IS_ACTIVE = ?
                WHERE TEST_ID = ?
            `;

            await db.query(query, [testName, testDescription, testType, durationMinutes, totalQuestions, isActive, id]);

            await this.logAdminAction(req.user.id, 'UPDATE_TEST', `Updated test ID: ${id}`);

            res.json({
                success: true,
                message: 'Test updated successfully'
            });
        } catch (error) {
            logger.error('Error updating test:', error);
            res.status(500).json({ 
                success: false, 
                message: 'Error updating test' 
            });
        }
    }

    async deleteTest(req, res) {
        try {
            const { id } = req.params;

            // Check if test exists
            const testCheck = await db.query('SELECT TEST_NAME FROM TESTS WHERE TEST_ID = ?', [id]);
            if (testCheck.rows.length === 0) {
                return res.status(404).json({ 
                    success: false, 
                    message: 'Test not found' 
                });
            }

            const testName = testCheck.rows[0].TEST_NAME;

            await db.query('DELETE FROM TESTS WHERE TEST_ID = ?', [id]);

            await this.logAdminAction(req.user.id, 'DELETE_TEST', `Deleted test: ${testName} (ID: ${id})`);

            res.json({
                success: true,
                message: 'Test deleted successfully'
            });
        } catch (error) {
            logger.error('Error deleting test:', error);
            res.status(500).json({ 
                success: false, 
                message: 'Error deleting test' 
            });
        }
    }

    // University Management
    async getAllUniversities(req, res) {
        try {
            const { page = 1, limit = 20, search = '', country = '' } = req.query;
            const offset = (page - 1) * limit;
            
            let whereClause = "";
            let queryParams = [];
            
            if (search || country) {
                let conditions = [];
                if (search) {
                    conditions.push("(UPPER(UNIVERSITY_NAME) LIKE ? OR UPPER(LOCATION) LIKE ?)");
                    const searchPattern = `%${search.toUpperCase()}%`;
                    queryParams.push(searchPattern, searchPattern);
                }
                if (country) {
                    conditions.push("UPPER(COUNTRY) = ?");
                    queryParams.push(country.toUpperCase());
                }
                whereClause = "WHERE " + conditions.join(" AND ");
            }

            const query = `
                SELECT * FROM (
                    SELECT u.*, ROW_NUMBER() OVER (ORDER BY u.CREATED_AT DESC) as rn
                    FROM UNIVERSITIES u ${whereClause}
                ) WHERE rn BETWEEN ? AND ?
            `;
            
            queryParams.push(offset + 1, offset + parseInt(limit));
            
            const result = await db.query(query, queryParams);
            
            // Get total count
            const countQuery = `SELECT COUNT(*) as total FROM UNIVERSITIES ${whereClause}`;
            const countResult = await db.query(countQuery, queryParams.slice(0, -2));
            const totalUniversities = countResult.rows[0].TOTAL;

            await this.logAdminAction(req.user.id, 'VIEW_UNIVERSITIES', `Viewed universities list - Page: ${page}`);

            res.json({
                success: true,
                data: {
                    universities: result.rows,
                    pagination: {
                        currentPage: parseInt(page),
                        totalPages: Math.ceil(totalUniversities / limit),
                        totalUniversities,
                        limit: parseInt(limit)
                    }
                }
            });
        } catch (error) {
            logger.error('Error fetching universities:', error);
            res.status(500).json({ 
                success: false, 
                message: 'Error fetching universities' 
            });
        }
    }

    async createUniversity(req, res) {
        try {
            const { 
                universityName, location, country, universityType, website,
                contactInfo, programs, admissionRequirements, tuitionFees, isActive = 1 
            } = req.body;

            const query = `
                INSERT INTO UNIVERSITIES (
                    UNIVERSITY_NAME, LOCATION, COUNTRY, UNIVERSITY_TYPE, WEBSITE,
                    CONTACT_INFO, PROGRAMS, ADMISSION_REQUIREMENTS, TUITION_FEES,
                    IS_ACTIVE, CREATED_AT, UPDATED_AT
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, SYSTIMESTAMP, SYSTIMESTAMP)
            `;

            await db.query(query, [
                universityName, location, country, universityType, website,
                contactInfo, programs, admissionRequirements, tuitionFees, isActive
            ]);

            await this.logAdminAction(req.user.id, 'CREATE_UNIVERSITY', `Created university: ${universityName}`);

            res.status(201).json({
                success: true,
                message: 'University created successfully'
            });
        } catch (error) {
            logger.error('Error creating university:', error);
            res.status(500).json({ 
                success: false, 
                message: 'Error creating university' 
            });
        }
    }

    async updateUniversity(req, res) {
        try {
            const { id } = req.params;
            const { 
                universityName, location, country, universityType, website,
                contactInfo, programs, admissionRequirements, tuitionFees, isActive 
            } = req.body;

            // Check if university exists
            const universityCheck = await db.query('SELECT UNIVERSITY_ID FROM UNIVERSITIES WHERE UNIVERSITY_ID = ?', [id]);
            if (universityCheck.rows.length === 0) {
                return res.status(404).json({ 
                    success: false, 
                    message: 'University not found' 
                });
            }

            const query = `
                UPDATE UNIVERSITIES SET 
                    UNIVERSITY_NAME = ?, LOCATION = ?, COUNTRY = ?, UNIVERSITY_TYPE = ?,
                    WEBSITE = ?, CONTACT_INFO = ?, PROGRAMS = ?, ADMISSION_REQUIREMENTS = ?,
                    TUITION_FEES = ?, IS_ACTIVE = ?, UPDATED_AT = SYSTIMESTAMP
                WHERE UNIVERSITY_ID = ?
            `;

            await db.query(query, [
                universityName, location, country, universityType, website,
                contactInfo, programs, admissionRequirements, tuitionFees, isActive, id
            ]);

            await this.logAdminAction(req.user.id, 'UPDATE_UNIVERSITY', `Updated university ID: ${id}`);

            res.json({
                success: true,
                message: 'University updated successfully'
            });
        } catch (error) {
            logger.error('Error updating university:', error);
            res.status(500).json({ 
                success: false, 
                message: 'Error updating university' 
            });
        }
    }

    async deleteUniversity(req, res) {
        try {
            const { id } = req.params;

            // Check if university exists
            const universityCheck = await db.query('SELECT UNIVERSITY_NAME FROM UNIVERSITIES WHERE UNIVERSITY_ID = ?', [id]);
            if (universityCheck.rows.length === 0) {
                return res.status(404).json({ 
                    success: false, 
                    message: 'University not found' 
                });
            }

            const universityName = universityCheck.rows[0].UNIVERSITY_NAME;

            await db.query('DELETE FROM UNIVERSITIES WHERE UNIVERSITY_ID = ?', [id]);

            await this.logAdminAction(req.user.id, 'DELETE_UNIVERSITY', `Deleted university: ${universityName} (ID: ${id})`);

            res.json({
                success: true,
                message: 'University deleted successfully'
            });
        } catch (error) {
            logger.error('Error deleting university:', error);
            res.status(500).json({ 
                success: false, 
                message: 'Error deleting university' 
            });
        }
    }

    // Career Management
    async getAllCareers(req, res) {
        try {
            const { page = 1, limit = 20, search = '', category = '' } = req.query;
            const offset = (page - 1) * limit;
            
            let whereClause = "";
            let queryParams = [];
            
            if (search || category) {
                let conditions = [];
                if (search) {
                    conditions.push("UPPER(CAREER_NAME) LIKE ?");
                    queryParams.push(`%${search.toUpperCase()}%`);
                }
                if (category) {
                    conditions.push("UPPER(CATEGORY) = ?");
                    queryParams.push(category.toUpperCase());
                }
                whereClause = "WHERE " + conditions.join(" AND ");
            }

            const query = `
                SELECT * FROM (
                    SELECT c.*, ROW_NUMBER() OVER (ORDER BY c.CREATED_AT DESC) as rn
                    FROM CAREERS c ${whereClause}
                ) WHERE rn BETWEEN ? AND ?
            `;
            
            queryParams.push(offset + 1, offset + parseInt(limit));
            
            const result = await db.query(query, queryParams);
            
            // Get total count
            const countQuery = `SELECT COUNT(*) as total FROM CAREERS ${whereClause}`;
            const countResult = await db.query(countQuery, queryParams.slice(0, -2));
            const totalCareers = countResult.rows[0].TOTAL;

            await this.logAdminAction(req.user.id, 'VIEW_CAREERS', `Viewed careers list - Page: ${page}`);

            res.json({
                success: true,
                data: {
                    careers: result.rows,
                    pagination: {
                        currentPage: parseInt(page),
                        totalPages: Math.ceil(totalCareers / limit),
                        totalCareers,
                        limit: parseInt(limit)
                    }
                }
            });
        } catch (error) {
            logger.error('Error fetching careers:', error);
            res.status(500).json({ 
                success: false, 
                message: 'Error fetching careers' 
            });
        }
    }

    async createCareer(req, res) {
        try {
            const { 
                careerName, careerDescription, category, requiredEducation,
                averageSalary, jobOutlook, skillsRequired, isActive = 1 
            } = req.body;

            const query = `
                INSERT INTO CAREERS (
                    CAREER_NAME, CAREER_DESCRIPTION, CATEGORY, REQUIRED_EDUCATION,
                    AVERAGE_SALARY, JOB_OUTLOOK, SKILLS_REQUIRED, IS_ACTIVE,
                    CREATED_AT, UPDATED_AT
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, SYSTIMESTAMP, SYSTIMESTAMP)
            `;

            await db.query(query, [
                careerName, careerDescription, category, requiredEducation,
                averageSalary, jobOutlook, skillsRequired, isActive
            ]);

            await this.logAdminAction(req.user.id, 'CREATE_CAREER', `Created career: ${careerName}`);

            res.status(201).json({
                success: true,
                message: 'Career created successfully'
            });
        } catch (error) {
            logger.error('Error creating career:', error);
            res.status(500).json({ 
                success: false, 
                message: 'Error creating career' 
            });
        }
    }

    async updateCareer(req, res) {
        try {
            const { id } = req.params;
            const { 
                careerName, careerDescription, category, requiredEducation,
                averageSalary, jobOutlook, skillsRequired, isActive 
            } = req.body;

            // Check if career exists
            const careerCheck = await db.query('SELECT CAREER_ID FROM CAREERS WHERE CAREER_ID = ?', [id]);
            if (careerCheck.rows.length === 0) {
                return res.status(404).json({ 
                    success: false, 
                    message: 'Career not found' 
                });
            }

            const query = `
                UPDATE CAREERS SET 
                    CAREER_NAME = ?, CAREER_DESCRIPTION = ?, CATEGORY = ?,
                    REQUIRED_EDUCATION = ?, AVERAGE_SALARY = ?, JOB_OUTLOOK = ?,
                    SKILLS_REQUIRED = ?, IS_ACTIVE = ?, UPDATED_AT = SYSTIMESTAMP
                WHERE CAREER_ID = ?
            `;

            await db.query(query, [
                careerName, careerDescription, category, requiredEducation,
                averageSalary, jobOutlook, skillsRequired, isActive, id
            ]);

            await this.logAdminAction(req.user.id, 'UPDATE_CAREER', `Updated career ID: ${id}`);

            res.json({
                success: true,
                message: 'Career updated successfully'
            });
        } catch (error) {
            logger.error('Error updating career:', error);
            res.status(500).json({ 
                success: false, 
                message: 'Error updating career' 
            });
        }
    }

    async deleteCareer(req, res) {
        try {
            const { id } = req.params;

            // Check if career exists
            const careerCheck = await db.query('SELECT CAREER_NAME FROM CAREERS WHERE CAREER_ID = ?', [id]);
            if (careerCheck.rows.length === 0) {
                return res.status(404).json({ 
                    success: false, 
                    message: 'Career not found' 
                });
            }

            const careerName = careerCheck.rows[0].CAREER_NAME;

            await db.query('DELETE FROM CAREERS WHERE CAREER_ID = ?', [id]);

            await this.logAdminAction(req.user.id, 'DELETE_CAREER', `Deleted career: ${careerName} (ID: ${id})`);

            res.json({
                success: true,
                message: 'Career deleted successfully'
            });
        } catch (error) {
            logger.error('Error deleting career:', error);
            res.status(500).json({ 
                success: false, 
                message: 'Error deleting career' 
            });
        }
    }

    // Chat Management
    async getAllChatRooms(req, res) {
        try {
            const { page = 1, limit = 20, search = '', type = '' } = req.query;
            const offset = (page - 1) * limit;
            
            let whereClause = "";
            let queryParams = [];
            
            if (search || type) {
                let conditions = [];
                if (search) {
                    conditions.push("UPPER(ROOM_NAME) LIKE ?");
                    queryParams.push(`%${search.toUpperCase()}%`);
                }
                if (type) {
                    conditions.push("ROOM_TYPE = ?");
                    queryParams.push(type);
                }
                whereClause = "WHERE " + conditions.join(" AND ");
            }

            const query = `
                SELECT cr.*, u.EMRI || ' ' || u.SURNAME as CREATED_BY_NAME,
                       (SELECT COUNT(*) FROM CHAT_MESSAGES cm WHERE cm.ROOM_ID = cr.ROOM_ID) as MESSAGE_COUNT
                FROM (
                    SELECT cr.*, ROW_NUMBER() OVER (ORDER BY cr.CREATED_AT DESC) as rn
                    FROM CHAT_ROOMS cr ${whereClause}
                ) cr
                LEFT JOIN USERS u ON cr.CREATED_BY = u.ID
                WHERE cr.rn BETWEEN ? AND ?
            `;
            
            queryParams.push(offset + 1, offset + parseInt(limit));
            
            const result = await db.query(query, queryParams);
            
            // Get total count
            const countQuery = `SELECT COUNT(*) as total FROM CHAT_ROOMS ${whereClause}`;
            const countResult = await db.query(countQuery, queryParams.slice(0, -2));
            const totalRooms = countResult.rows[0].TOTAL;

            await this.logAdminAction(req.user.id, 'VIEW_CHAT_ROOMS', `Viewed chat rooms list - Page: ${page}`);

            res.json({
                success: true,
                data: {
                    chatRooms: result.rows,
                    pagination: {
                        currentPage: parseInt(page),
                        totalPages: Math.ceil(totalRooms / limit),
                        totalRooms,
                        limit: parseInt(limit)
                    }
                }
            });
        } catch (error) {
            logger.error('Error fetching chat rooms:', error);
            res.status(500).json({ 
                success: false,
                message: 'Error fetching chat rooms' 
            });
        }
    }

    async deleteChatRoom(req, res) {
        try {
            const { id } = req.params;

            // Check if chat room exists
            const roomCheck = await db.query('SELECT ROOM_NAME FROM CHAT_ROOMS WHERE ROOM_ID = ?', [id]);
            if (roomCheck.rows.length === 0) {
                return res.status(404).json({ 
                    success: false, 
                    message: 'Chat room not found' 
                });
            }

            const roomName = roomCheck.rows[0].ROOM_NAME;

            // Delete chat room (messages should be deleted via cascade)
            await db.query('DELETE FROM CHAT_ROOMS WHERE ROOM_ID = ?', [id]);

            await this.logAdminAction(req.user.id, 'DELETE_CHAT_ROOM', `Deleted chat room: ${roomName} (ID: ${id})`);

            res.json({
                success: true,
                message: 'Chat room deleted successfully'
            });
        } catch (error) {
            logger.error('Error deleting chat room:', error);
            res.status(500).json({ 
                success: false, 
                message: 'Error deleting chat room' 
            });
        }
    }

    async getChatMessages(req, res) {
        try {
            const { roomId } = req.params;
            const { page = 1, limit = 50 } = req.query;
            const offset = (page - 1) * limit;

            const query = `
                SELECT cm.*, u.EMRI || ' ' || u.SURNAME as SENDER_NAME
                FROM (
                    SELECT cm.*, ROW_NUMBER() OVER (ORDER BY cm.CREATED_AT DESC) as rn
                    FROM CHAT_MESSAGES cm
                    WHERE cm.ROOM_ID = ? AND cm.IS_DELETED = 0
                ) cm
                LEFT JOIN USERS u ON cm.USER_ID = u.ID
                WHERE cm.rn BETWEEN ? AND ?
                ORDER BY cm.CREATED_AT ASC
            `;

            const result = await db.query(query, [roomId, offset + 1, offset + parseInt(limit)]);

            await this.logAdminAction(req.user.id, 'VIEW_CHAT_MESSAGES', `Viewed messages for room ID: ${roomId}`);

            res.json({
                success: true,
                data: {
                    messages: result.rows
                }
            });
        } catch (error) {
            logger.error('Error fetching chat messages:', error);
            res.status(500).json({ 
                success: false, 
                message: 'Error fetching chat messages' 
            });
        }
    }

    async deleteMessage(req, res) {
        try {
            const { messageId } = req.params;

            // Check if message exists
            const messageCheck = await db.query('SELECT MESSAGE_ID FROM CHAT_MESSAGES WHERE MESSAGE_ID = ?', [messageId]);
            if (messageCheck.rows.length === 0) {
                return res.status(404).json({ 
                    success: false, 
                    message: 'Message not found' 
                });
            }

            // Soft delete message
            await db.query('UPDATE CHAT_MESSAGES SET IS_DELETED = 1, UPDATED_AT = SYSTIMESTAMP WHERE MESSAGE_ID = ?', [messageId]);

            await this.logAdminAction(req.user.id, 'DELETE_MESSAGE', `Deleted message ID: ${messageId}`);

            res.json({
                success: true,
                message: 'Message deleted successfully'
            });
        } catch (error) {
            logger.error('Error deleting message:', error);
            res.status(500).json({ 
                success: false, 
                message: 'Error deleting message' 
            });
        }
    }

    // Analytics
    async getAnalytics(req, res) {
        try {
            const { period = '30' } = req.query; // days
            
            // User registration trends
            const userTrendsQuery = `
                SELECT TO_CHAR(CREATED_AT, 'YYYY-MM-DD') as date,
                       COUNT(*) as registrations
                FROM USERS 
                WHERE CREATED_AT >= SYSDATE - ? AND ROLI != 'admin'
                GROUP BY TO_CHAR(CREATED_AT, 'YYYY-MM-DD')
                ORDER BY date
            `;
            const userTrends = await db.query(userTrendsQuery, [period]);

            // Test completion trends
            const testTrendsQuery = `
                SELECT TO_CHAR(COMPLETED_AT, 'YYYY-MM-DD') as date,
                       COUNT(*) as completions,
                       AVG(SCORE) as avg_score
                FROM USER_TEST_RESULTS
                WHERE COMPLETED_AT >= SYSDATE - ?
                GROUP BY TO_CHAR(COMPLETED_AT, 'YYYY-MM-DD')
                ORDER BY date
            `;
            const testTrends = await db.query(testTrendsQuery, [period]);

            // Chat activity
            const chatTrendsQuery = `
                SELECT TO_CHAR(CREATED_AT, 'YYYY-MM-DD') as date,
                       COUNT(*) as messages,
                       COUNT(DISTINCT ROOM_ID) as active_rooms,
                       COUNT(DISTINCT USER_ID) as active_users
                FROM CHAT_MESSAGES
                WHERE CREATED_AT >= SYSDATE - ? AND IS_DELETED = 0
                GROUP BY TO_CHAR(CREATED_AT, 'YYYY-MM-DD')
                ORDER BY date
            `;
            const chatTrends = await db.query(chatTrendsQuery, [period]);

            // Most popular tests
            const popularTestsQuery = `
                SELECT t.TEST_NAME, COUNT(utr.RESULT_ID) as completions,
                       AVG(utr.SCORE) as avg_score
                FROM TESTS t
                LEFT JOIN USER_TEST_RESULTS utr ON t.TEST_ID = utr.TEST_ID
                WHERE utr.COMPLETED_AT >= SYSDATE - ?
                GROUP BY t.TEST_ID, t.TEST_NAME
                ORDER BY completions DESC
                FETCH FIRST 10 ROWS ONLY
            `;
            const popularTests = await db.query(popularTestsQuery, [period]);

            // User roles distribution
            const userRolesQuery = `
                SELECT 
                    CASE 
                        WHEN IS_COUNSELOR = 1 THEN 'Counselor'
                        WHEN ROLI = 'admin' THEN 'Admin'
                        ELSE 'Student'
                    END as role,
                    COUNT(*) as count
                FROM USERS
                GROUP BY 
                    CASE 
                        WHEN IS_COUNSELOR = 1 THEN 'Counselor'
                        WHEN ROLI = 'admin' THEN 'Admin'
                        ELSE 'Student'
                    END
            `;
            const userRoles = await db.query(userRolesQuery);

            await this.logAdminAction(req.user.id, 'VIEW_ANALYTICS', `Viewed analytics for ${period} days`);

            res.json({
                success: true,
                data: {
                    userTrends: userTrends.rows,
                    testTrends: testTrends.rows,
                    chatTrends: chatTrends.rows,
                    popularTests: popularTests.rows,
                    userRoles: userRoles.rows,
                    period: parseInt(period)
                }
            });
        } catch (error) {
            logger.error('Error fetching analytics:', error);
            res.status(500).json({ 
                success: false, 
                message: 'Error fetching analytics' 
            });
        }
    }

    // System Settings
    async getSystemSettings(req, res) {
        try {
            // This would typically come from a settings table, but for now we'll return default values
            const settings = {
                siteName: 'Career Guidance Platform',
                enableRegistration: true,
                enableChatRooms: true,
                maxTestDuration: 120,
                defaultTestQuestions: 20,
                maintenanceMode: false,
                emailNotifications: true,
                allowGuestAccess: false
            };

            await this.logAdminAction(req.user.id, 'VIEW_SETTINGS', 'Viewed system settings');

            res.json({
                success: true,
                data: settings
            });
        } catch (error) {
            logger.error('Error fetching system settings:', error);
            res.status(500).json({ 
                success: false, 
                message: 'Error fetching system settings' 
            });
        }
    }

    async updateSystemSettings(req, res) {
        try {
            const settings = req.body;

            // In a real application, you would save these to a settings table
            // For now, we'll just log the action

            await this.logAdminAction(req.user.id, 'UPDATE_SETTINGS', `Updated system settings: ${JSON.stringify(settings)}`);

            res.json({
                success: true,
                message: 'System settings updated successfully',
                data: settings
            });
        } catch (error) {
            logger.error('Error updating system settings:', error);
            res.status(500).json({ 
                success: false, 
                message: 'Error updating system settings' 
            });
        }
    }

    // Admin Logs
    async getAdminLogs(req, res) {
        try {
            const { page = 1, limit = 50, adminId = '', actionType = '' } = req.query;
            const offset = (page - 1) * limit;
            
            let whereClause = "";
            let queryParams = [];
            
            if (adminId || actionType) {
                let conditions = [];
                if (adminId) {
                    conditions.push("al.ADMIN_ID = ?");
                    queryParams.push(adminId);
                }
                if (actionType) {
                    conditions.push("UPPER(al.ACTION_TYPE) LIKE ?");
                    queryParams.push(`%${actionType.toUpperCase()}%`);
                }
                whereClause = "WHERE " + conditions.join(" AND ");
            }

            const query = `
                SELECT al.*, u.EMRI || ' ' || u.SURNAME as ADMIN_NAME
                FROM (
                    SELECT al.*, ROW_NUMBER() OVER (ORDER BY al.CREATED_AT DESC) as rn
                    FROM ADMIN_LOGS al ${whereClause}
                ) al
                LEFT JOIN USERS u ON al.ADMIN_ID = u.ID
                WHERE al.rn BETWEEN ? AND ?
            `;
            
            queryParams.push(offset + 1, offset + parseInt(limit));
            
            const result = await db.query(query, queryParams);
            
            // Get total count
            const countQuery = `SELECT COUNT(*) as total FROM ADMIN_LOGS al ${whereClause}`;
            const countResult = await db.query(countQuery, queryParams.slice(0, -2));
            const totalLogs = countResult.rows[0].TOTAL;

            res.json({
                success: true,
                data: {
                    logs: result.rows,
                    pagination: {
                        currentPage: parseInt(page),
                        totalPages: Math.ceil(totalLogs / limit),
                        totalLogs,
                        limit: parseInt(limit)
                    }
                }
            });
        } catch (error) {
            logger.error('Error fetching admin logs:', error);
            res.status(500).json({ 
                success: false, 
                message: 'Error fetching admin logs' 
            });
        }
    }

    // Helper method to log admin actions
    async logAdminAction(adminId, actionType, description) {
        try {
            const query = `
                INSERT INTO ADMIN_LOGS (ADMIN_ID, ACTION_TYPE, DESCRIPTION, IP_ADDRESS, CREATED_AT)
                VALUES (?, ?, ?, ?, SYSTIMESTAMP)
            `;
            await db.query(query, [adminId, actionType, description, 'localhost']); // You can get real IP from req
        } catch (error) {
            logger.error('Error logging admin action:', error);
        }
    }

    // Bulk Operations
    async bulkDeleteUsers(req, res) {
        try {
            const { userIds } = req.body;
            
            if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
                return res.status(400).json({ 
                    success: false, 
                    message: 'Invalid user IDs provided' 
                });
            }

            const placeholders = userIds.map(() => '?').join(',');
            const query = `DELETE FROM USERS WHERE ID IN (${placeholders}) AND ROLI != 'admin'`;
            
            const result = await db.query(query, userIds);

            await this.logAdminAction(req.user.id, 'BULK_DELETE_USERS', `Deleted ${userIds.length} users`);

            res.json({
                success: true,
                message: `Successfully deleted users`,
                deletedCount: result.rowsAffected || userIds.length
            });
        } catch (error) {
            logger.error('Error bulk deleting users:', error);
            res.status(500).json({ 
                success: false, 
                message: 'Error deleting users' 
            });
        }
    }

    async exportData(req, res) {
        try {
            const { type, format = 'json' } = req.query;
            
            let data = {};
            
            switch (type) {
                case 'users':
                    const users = await db.query("SELECT * FROM USERS WHERE ROLI != 'admin'");
                    data = users.rows;
                    break;
                case 'tests':
                    const tests = await db.query('SELECT * FROM TESTS');
                    data = tests.rows;
                    break;
                case 'analytics':
                    // Get comprehensive analytics data
                    const analytics = await this.generateAnalyticsExport();
                    data = analytics;
                    break;
                default:
                    return res.status(400).json({ 
                        success: false, 
                        message: 'Invalid export type' 
                    });
            }

            await this.logAdminAction(req.user.id, 'EXPORT_DATA', `Exported ${type} data in ${format} format`);

            if (format === 'csv') {
                // Convert to CSV format
                res.setHeader('Content-Type', 'text/csv');
                res.setHeader('Content-Disposition', `attachment; filename="${type}_export.csv"`);
                // You would implement CSV conversion here
                res.send('CSV export not implemented');
            } else {
                res.setHeader('Content-Type', 'application/json');
                res.setHeader('Content-Disposition', `attachment; filename="${type}_export.json"`);
                res.json({
                    success: true,
                    data: data,
                    exportedAt: new Date().toISOString(),
                    type: type
                });
            }
        } catch (error) {
            logger.error('Error exporting data:', error);
            res.status(500).json({ 
                success: false, 
                message: 'Error exporting data' 
            });
        }
    }

    async generateAnalyticsExport() {
        try {
            const totalUsers = await db.query("SELECT COUNT(*) as count FROM USERS WHERE ROLI != 'admin'");
            const totalTests = await db.query('SELECT COUNT(*) as count FROM TESTS');
            const totalUniversities = await db.query('SELECT COUNT(*) as count FROM UNIVERSITIES');
            const totalCareers = await db.query('SELECT COUNT(*) as count FROM CAREERS');
            const totalChatRooms = await db.query('SELECT COUNT(*) as count FROM CHAT_ROOMS');
            const totalMessages = await db.query('SELECT COUNT(*) as count FROM CHAT_MESSAGES WHERE IS_DELETED = 0');
            
            return {
                summary: {
                    totalUsers: totalUsers.rows[0].COUNT,
                    totalTests: totalTests.rows[0].COUNT,
                    totalUniversities: totalUniversities.rows[0].COUNT,
                    totalCareers: totalCareers.rows[0].COUNT,
                    totalChatRooms: totalChatRooms.rows[0].COUNT,
                    totalMessages: totalMessages.rows[0].COUNT
                },
                exportedAt: new Date().toISOString()
            };
        } catch (error) {
            logger.error('Error generating analytics export:', error);
            throw error;
        }
    }
}

// Create instance and export methods with proper binding
   const adminController = new AdminController();

   module.exports = {
       getDashboardStats: adminController.getDashboardStats.bind(adminController),
       getAllUsers: adminController.getAllUsers.bind(adminController),
       createUser: adminController.createUser.bind(adminController),
       updateUser: adminController.updateUser.bind(adminController),
       deleteUser: adminController.deleteUser.bind(adminController),
       bulkDeleteUsers: adminController.bulkDeleteUsers.bind(adminController),
       getAllTests: adminController.getAllTests.bind(adminController),
       createTest: adminController.createTest.bind(adminController),
       updateTest: adminController.updateTest.bind(adminController),
       deleteTest: adminController.deleteTest.bind(adminController),
       getAllUniversities: adminController.getAllUniversities.bind(adminController),
       createUniversity: adminController.createUniversity.bind(adminController),
       updateUniversity: adminController.updateUniversity.bind(adminController),
       deleteUniversity: adminController.deleteUniversity.bind(adminController),
       getAllCareers: adminController.getAllCareers.bind(adminController),
       createCareer: adminController.createCareer.bind(adminController),
       updateCareer: adminController.updateCareer.bind(adminController),
       deleteCareer: adminController.deleteCareer.bind(adminController),
       getAllChatRooms: adminController.getAllChatRooms.bind(adminController),
       deleteChatRoom: adminController.deleteChatRoom.bind(adminController),
       getChatMessages: adminController.getChatMessages.bind(adminController),
       deleteMessage: adminController.deleteMessage.bind(adminController),
       getAnalytics: adminController.getAnalytics.bind(adminController),
       getSystemSettings: adminController.getSystemSettings.bind(adminController),
       updateSystemSettings: adminController.updateSystemSettings.bind(adminController),
       getAdminLogs: adminController.getAdminLogs.bind(adminController),
       exportData: adminController.exportData.bind(adminController)
   };