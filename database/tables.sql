
-- USERS TABLE
CREATE SEQUENCE users_seq START WITH 1 INCREMENT BY 1 NOCACHE NOCYCLE;
CREATE TABLE users (
    id NUMBER PRIMARY KEY,
    emri VARCHAR2(50) NOT NULL,
    surname VARCHAR2(50) NOT NULL,
    emaili VARCHAR2(255) UNIQUE NOT NULL,
    passwordi VARCHAR2(255) NOT NULL,
    roli VARCHAR2(20),
    remember_token VARCHAR2(100),
    verification_token VARCHAR2(100),
    is_verified NUMBER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- USER PROFILES
CREATE SEQUENCE user_profiles_seq START WITH 1 INCREMENT BY 1 NOCACHE NOCYCLE;
CREATE TABLE user_profiles (
    profile_id NUMBER PRIMARY KEY,
    user_account_id NUMBER NOT NULL,
    education_level VARCHAR2(50),
    current_school VARCHAR2(255),
    interests CLOB,
    goals CLOB,
    strengths CLOB,
    skills CLOB,
    personality_type VARCHAR2(50),
    completed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_account_id) REFERENCES users(id)
);

-- USER GRADES
CREATE SEQUENCE user_grades_seq START WITH 1 INCREMENT BY 1 NOCACHE NOCYCLE;
CREATE TABLE user_grades (
    grade_id NUMBER PRIMARY KEY,
    user_account_id NUMBER NOT NULL,
    subject_name VARCHAR2(100) NOT NULL,
    grade NUMBER NOT NULL,
    year_taken NUMBER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_account_id) REFERENCES users(id)
);

-- TESTS
CREATE SEQUENCE tests_seq START WITH 1 INCREMENT BY 1 NOCACHE NOCYCLE;
CREATE TABLE tests (
    test_id NUMBER PRIMARY KEY,
    test_name VARCHAR2(100) NOT NULL,
    test_description CLOB,
    test_type VARCHAR2(50) NOT NULL,
    duration_minutes NUMBER,
    total_questions NUMBER,
    is_active NUMBER(1) DEFAULT 1 CHECK (is_active IN (0,1)),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- TEST QUESTIONS
CREATE SEQUENCE test_questions_seq START WITH 1 INCREMENT BY 1 NOCACHE NOCYCLE;
CREATE TABLE test_questions (
    question_id NUMBER PRIMARY KEY,
    test_id NUMBER NOT NULL,
    question_text CLOB NOT NULL,
    question_type VARCHAR2(20) DEFAULT 'multiple_choice',
    question_order NUMBER NOT NULL,
    options CLOB,
    is_active NUMBER(1) DEFAULT 1 CHECK (is_active IN (0,1)),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (test_id) REFERENCES tests(test_id) ON DELETE CASCADE
);

-- USER TEST ATTEMPTS
CREATE SEQUENCE user_test_attempts_seq START WITH 1 INCREMENT BY 1 NOCACHE NOCYCLE;
CREATE TABLE user_test_attempts (
    attempt_id NUMBER PRIMARY KEY,
    user_account_id NUMBER NOT NULL,
    test_id NUMBER NOT NULL,
    status VARCHAR2(20),
    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    time_spent NUMBER,
    current_question NUMBER,
    total_score NUMBER,
    percentage_score NUMBER,
    results CLOB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_account_id) REFERENCES users(id),
    FOREIGN KEY (test_id) REFERENCES tests(test_id)
);

-- USER TEST ANSWERS
CREATE SEQUENCE user_test_answers_seq START WITH 1 INCREMENT BY 1 NOCACHE NOCYCLE;
CREATE TABLE user_test_answers (
    answer_id NUMBER PRIMARY KEY,
    attempt_id NUMBER NOT NULL,
    question_id NUMBER NOT NULL,
    answer CLOB NOT NULL,
    score NUMBER,
    time_spent NUMBER,
    answered_at TIMESTAMP,
    FOREIGN KEY (attempt_id) REFERENCES user_test_attempts(attempt_id),
    FOREIGN KEY (question_id) REFERENCES test_questions(question_id)
);

-- USER TEST RESULTS
CREATE SEQUENCE user_test_results_seq START WITH 1 INCREMENT BY 1 NOCACHE NOCYCLE;
CREATE TABLE user_test_results (
    result_id NUMBER PRIMARY KEY,
    user_account_id NUMBER NOT NULL,
    test_id NUMBER NOT NULL,
    score NUMBER,
    result_details CLOB,
    completed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_account_id) REFERENCES users(id),
    FOREIGN KEY (test_id) REFERENCES tests(test_id)
);

-- CAREERS
CREATE SEQUENCE careers_seq START WITH 1 INCREMENT BY 1 NOCACHE NOCYCLE;
CREATE TABLE careers (
    career_id NUMBER PRIMARY KEY,
    career_name VARCHAR2(100) NOT NULL,
    career_description CLOB,
    category VARCHAR2(50),
    required_education VARCHAR2(100),
    average_salary NUMBER(10,2),
    job_outlook VARCHAR2(50),
    skills_required CLOB,
    is_active NUMBER(1) DEFAULT 1 CHECK (is_active IN (0,1)),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- UNIVERSITIES
CREATE SEQUENCE universities_seq START WITH 1 INCREMENT BY 1 NOCACHE NOCYCLE;
CREATE TABLE universities (
    university_id NUMBER PRIMARY KEY,
    university_name VARCHAR2(200) NOT NULL,
    location VARCHAR2(100),
    country VARCHAR2(50) DEFAULT 'Albania',
    university_type VARCHAR2(20),
    website VARCHAR2(255),
    contact_info CLOB,
    programs CLOB,
    admission_requirements CLOB,
    tuition_fees NUMBER(10,2),
    is_active NUMBER(1) DEFAULT 1 CHECK (is_active IN (0,1)),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- RECOMMENDATIONS
CREATE SEQUENCE recommendations_seq START WITH 1 INCREMENT BY 1 NOCACHE NOCYCLE;
CREATE TABLE recommendations (
    recommendation_id NUMBER PRIMARY KEY,
    user_account_id NUMBER NOT NULL,
    recommendation_type VARCHAR2(20) NOT NULL,
    item_id NUMBER NOT NULL,
    match_score NUMBER NOT NULL,
    match_reason CLOB,
    ranking NUMBER,
    is_bookmarked NUMBER DEFAULT 0,
    view_count NUMBER DEFAULT 0,
    generated_at TIMESTAMP,
    FOREIGN KEY (user_account_id) REFERENCES users(id)
);

-- TRIGGERS FOR UPDATED_AT
CREATE OR REPLACE TRIGGER trg_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
BEGIN
    :NEW.updated_at := CURRENT_TIMESTAMP;
END;
/

CREATE OR REPLACE TRIGGER trg_tests_updated_at
    BEFORE UPDATE ON tests
    FOR EACH ROW
BEGIN
    :NEW.updated_at := CURRENT_TIMESTAMP;
END;
/

CREATE OR REPLACE TRIGGER trg_careers_updated_at
    BEFORE UPDATE ON careers
    FOR EACH ROW
BEGIN
    :NEW.updated_at := CURRENT_TIMESTAMP;
END;
/

CREATE OR REPLACE TRIGGER trg_universities_updated_at
    BEFORE UPDATE ON universities
    FOR EACH ROW
BEGIN
    :NEW.updated_at := CURRENT_TIMESTAMP;
END;
/

-- KOMENTE
COMMENT ON TABLE users IS 'Stores user account information';
COMMENT ON TABLE user_profiles IS 'Extended profile data for users';
COMMENT ON TABLE user_grades IS 'Stores user academic grades';
COMMENT ON TABLE tests IS 'Career assessment tests';
COMMENT ON TABLE test_questions IS 'Questions for each test';
COMMENT ON TABLE user_test_attempts IS 'User attempts of tests';
COMMENT ON TABLE user_test_answers IS 'Answers per question per attempt';
COMMENT ON TABLE user_test_results IS 'Final summarized results of tests';
COMMENT ON TABLE careers IS 'Career paths information';
COMMENT ON TABLE universities IS 'University and education options';
COMMENT ON TABLE recommendations IS 'System-generated user recommendations';

-- COMMIT CHANGES
COMMIT;
