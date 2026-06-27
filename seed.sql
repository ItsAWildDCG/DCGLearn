drop table if exists "Progress";
drop table if exists "SubmissionAnswer";
drop table if exists "Submission";
drop table if exists "Option";
drop table if exists "Question";
drop table if exists "Assessment";
drop table if exists "Lesson";
drop table if exists "Enrollment";
drop table if exists "Course";
drop table if exists "User";
drop table if exists "Role";

CREATE TABLE IF NOT EXISTS public."Role"
(
    role_id integer GENERATED ALWAYS AS IDENTITY,
    name character varying(128) COLLATE pg_catalog."default" NOT NULL,
    CONSTRAINT "Role_pkey" PRIMARY KEY (role_id),
    CONSTRAINT "validRoles" CHECK (name::text = ANY (ARRAY['Admin'::character varying, 'Teacher'::character varying, 'Student'::character varying]::text[]))
)

TABLESPACE pg_default;

ALTER TABLE IF EXISTS public."Role"
    OWNER to postgres;

CREATE TABLE IF NOT EXISTS public."User"
(
    user_id integer GENERATED ALWAYS AS IDENTITY,
    name character varying(50) COLLATE pg_catalog."default",
    email character varying(100) COLLATE pg_catalog."default",
    password_hash character varying(128) COLLATE pg_catalog."default",
    role_id integer,
    created_at date,
    CONSTRAINT "User_pkey" PRIMARY KEY (user_id),
    CONSTRAINT "isA" FOREIGN KEY (role_id)
        REFERENCES public."Role" (role_id) MATCH SIMPLE
        ON UPDATE SET NULL
        ON DELETE SET NULL
        NOT VALID
)

TABLESPACE pg_default;

ALTER TABLE IF EXISTS public."User"
    OWNER to postgres;

CREATE TABLE IF NOT EXISTS public."Course"
(
    course_id integer GENERATED ALWAYS AS IDENTITY,
    title character varying(128) COLLATE pg_catalog."default" NOT NULL,
    description character varying(1028) COLLATE pg_catalog."default",
    instructor_id integer NOT NULL,
    CONSTRAINT "Course_pkey" PRIMARY KEY (course_id),
    CONSTRAINT "createdBy" FOREIGN KEY (instructor_id)
        REFERENCES public."User" (user_id) MATCH SIMPLE
        ON UPDATE SET NULL
        ON DELETE SET NULL
)

TABLESPACE pg_default;

ALTER TABLE IF EXISTS public."Course"
    OWNER to postgres;

CREATE TABLE IF NOT EXISTS public."Enrollment"
(
    enrollment_id integer GENERATED ALWAYS AS IDENTITY,
    student_id integer NOT NULL,
    course_id integer NOT NULL,
    enrolled_at date NOT NULL,
    CONSTRAINT "Enrollment_pkey" PRIMARY KEY (enrollment_id),
    CONSTRAINT "enrollingStudent" FOREIGN KEY (student_id)
        REFERENCES public."User" (user_id) MATCH SIMPLE
        ON UPDATE SET NULL
        ON DELETE SET NULL,
    CONSTRAINT "enrollingTo" FOREIGN KEY (course_id)
        REFERENCES public."Course" (course_id) MATCH SIMPLE
        ON UPDATE SET NULL
        ON DELETE SET NULL
)

TABLESPACE pg_default;

ALTER TABLE IF EXISTS public."Enrollment"
    OWNER to postgres;

CREATE TABLE IF NOT EXISTS public."Lesson"
(
    lesson_id integer GENERATED ALWAYS AS IDENTITY,
    course_id integer NOT NULL,
    order_index integer NOT NULL,
    title character varying(200) COLLATE pg_catalog."default" NOT NULL,
    description character varying(250) COLLATE pg_catalog."default",
    content_type character varying(5) COLLATE pg_catalog."default" NOT NULL,
    content_text character varying(10000) COLLATE pg_catalog."default",
    content_url character varying(250) COLLATE pg_catalog."default",
    CONSTRAINT "Lesson_pkey" PRIMARY KEY (lesson_id),
    CONSTRAINT "uniqueIndex" UNIQUE (course_id, order_index),
    CONSTRAINT "isFrom" FOREIGN KEY (course_id)
        REFERENCES public."Course" (course_id) MATCH SIMPLE
        ON UPDATE SET NULL
        ON DELETE SET NULL,
    CONSTRAINT "validFormat" CHECK (content_type::text = ANY (ARRAY['Text'::character varying, 'Video'::character varying, 'PDF'::character varying]::text[])) NOT VALID
)

TABLESPACE pg_default;

ALTER TABLE IF EXISTS public."Lesson"
    OWNER to postgres;

CREATE TABLE IF NOT EXISTS public."Assessment"
(
    assessment_id integer GENERATED ALWAYS AS IDENTITY,
    course_id integer NOT NULL,
    title character varying(200) COLLATE pg_catalog."default" NOT NULL,
    description character varying(250) COLLATE pg_catalog."default",
    time_limit integer NOT NULL,
    created_at date NOT NULL,
    CONSTRAINT "Assessment_pkey" PRIMARY KEY (assessment_id),
    CONSTRAINT "assessmentOf" FOREIGN KEY (course_id)
        REFERENCES public."Course" (course_id) MATCH SIMPLE
        ON UPDATE SET NULL
        ON DELETE SET NULL
)

TABLESPACE pg_default;

ALTER TABLE IF EXISTS public."Assessment"
    OWNER to postgres;

CREATE TABLE IF NOT EXISTS public."Question"
(
    question_id integer GENERATED ALWAYS AS IDENTITY,
    assessment_id integer NOT NULL,
    question_text character varying(300) COLLATE pg_catalog."default" NOT NULL,
    question_type character varying(30) COLLATE pg_catalog."default" NOT NULL,
    CONSTRAINT "Question_pkey" PRIMARY KEY (question_id),
    CONSTRAINT "fromAssessment" FOREIGN KEY (assessment_id)
        REFERENCES public."Assessment" (assessment_id) MATCH SIMPLE
        ON UPDATE SET NULL
        ON DELETE SET NULL,
    CONSTRAINT "validQuestionType" CHECK (question_type::text = ANY (ARRAY['Single Correct'::character varying, 'Multiple Correct'::character varying, 'True-False'::character varying]::text[])) NOT VALID
)

TABLESPACE pg_default;

ALTER TABLE IF EXISTS public."Question"
    OWNER to postgres;

CREATE TABLE IF NOT EXISTS public."Option"
(
    option_id integer GENERATED ALWAYS AS IDENTITY,
    question_id integer NOT NULL,
    option_text character varying(250) COLLATE pg_catalog."default" NOT NULL,
    is_correct boolean NOT NULL,
    CONSTRAINT "Option_pkey" PRIMARY KEY (option_id),
    CONSTRAINT "fromQuestion" FOREIGN KEY (question_id)
        REFERENCES public."Question" (question_id) MATCH SIMPLE
        ON UPDATE SET NULL
        ON DELETE SET NULL
)

TABLESPACE pg_default;

ALTER TABLE IF EXISTS public."Option"
    OWNER to postgres;

CREATE TABLE IF NOT EXISTS public."Submission"
(
    submission_id integer GENERATED ALWAYS AS IDENTITY,
    assessment_id integer NOT NULL,
    score double precision NOT NULL,
    student_id integer NOT NULL,
    submitted_at date NOT NULL,
    CONSTRAINT "Submission_pkey" PRIMARY KEY (submission_id),
    CONSTRAINT submitted FOREIGN KEY (assessment_id)
        REFERENCES public."Assessment" (assessment_id) MATCH SIMPLE
        ON UPDATE SET NULL
        ON DELETE SET NULL
)

TABLESPACE pg_default;

ALTER TABLE IF EXISTS public."Submission"
    OWNER to postgres;

CREATE TABLE IF NOT EXISTS public."SubmissionAnswer"
(
    answer_id integer GENERATED ALWAYS AS IDENTITY,
    submission_id integer NOT NULL,
    question_id integer NOT NULL,
    option_id integer NOT NULL,
    CONSTRAINT "SubmissionAnswer_pkey" PRIMARY KEY (answer_id),
    CONSTRAINT "fromSubmission" FOREIGN KEY (submission_id)
        REFERENCES public."Submission" (submission_id) MATCH SIMPLE
        ON UPDATE SET NULL
        ON DELETE SET NULL
        NOT VALID,
    CONSTRAINT "ofQuestion" FOREIGN KEY (question_id)
        REFERENCES public."Question" (question_id) MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE NO ACTION
        NOT VALID,
    CONSTRAINT "pickedOption" FOREIGN KEY (option_id)
        REFERENCES public."Option" (option_id) MATCH SIMPLE
        ON UPDATE SET NULL
        ON DELETE SET NULL
        NOT VALID
)

TABLESPACE pg_default;

ALTER TABLE IF EXISTS public."SubmissionAnswer"
    OWNER to postgres;

-- ========================
-- CLEAN RESET
-- ========================
TRUNCATE "SubmissionAnswer", "Submission", "Option", "Question", "Assessment", "User", "Role", "Course", "Enrollment", "Lesson"
RESTART IDENTITY CASCADE;

-- ========================
-- ROLES
-- ========================
INSERT INTO "Role" (name) VALUES
('Admin'),
('Teacher'),
('Student');

-- ========================
-- USERS
-- ========================
INSERT INTO "User" (name, email, password_hash, role_id, created_at) VALUES
('Admin User', 'admin@mail.com', 'hash1', 1, CURRENT_DATE),
('Teacher A', 'teacher@mail.com', 'hash2', 2, CURRENT_DATE),
('Student One', 'student1@mail.com', 'hash3', 3, CURRENT_DATE),
('Student Two', 'student2@mail.com', 'hash4', 3, CURRENT_DATE);

-- ========================
-- COURSE
-- ========================
INSERT INTO "Course" (title, description, instructor_id) VALUES
('Math 101', 'Basic Mathematics', 2);

-- ========================
-- ENROLLMENT
-- ========================
INSERT INTO "Enrollment" (student_id, course_id, enrolled_at) VALUES
(3, 1, CURRENT_DATE),
(4, 1, CURRENT_DATE);

-- ========================
-- LESSONS
-- ========================
INSERT INTO "Lesson" 
(course_id, order_index, title, description, content_type, content_text, content_url) 
VALUES
-- Lesson 1 (Text)
(1, 1, 'Introduction to Math', 'Basic concepts overview', 'Text',
 'This lesson introduces basic arithmetic concepts like addition and multiplication.',
 NULL),

-- Lesson 2 (Video)
(1, 2, 'Multiplication Video', 'Learn multiplication visually', 'Video',
 NULL,
 'https://example.com/video/multiplication'),

-- Lesson 3 (PDF)
(1, 3, 'Practice Worksheet', 'Downloadable exercises', 'PDF',
 NULL,
 'https://example.com/pdf/math-worksheet.pdf');

-- ========================
-- ASSESSMENT
-- ========================
INSERT INTO "Assessment" (course_id, title, description, time_limit, created_at) VALUES
(1, 'Math Basics Test', 'Simple math evaluation', 30, CURRENT_DATE);

-- ========================
-- QUESTIONS + OPTIONS
-- ========================

-- Q1: True/False
WITH q1 AS (
    INSERT INTO "Question" (assessment_id, question_text, question_type)
    VALUES (1, '2 + 2 = 4?', 'True-False')
    RETURNING question_id
)
INSERT INTO "Option" (question_id, option_text, is_correct)
SELECT question_id, 'True', true FROM q1
UNION ALL
SELECT question_id, 'False', false FROM q1;

-- Q2: Single Correct
WITH q2 AS (
    INSERT INTO "Question" (assessment_id, question_text, question_type)
    VALUES (1, '5 * 3 = ?', 'Single Correct')
    RETURNING question_id
)
INSERT INTO "Option" (question_id, option_text, is_correct)
SELECT question_id, '10', false FROM q2
UNION ALL
SELECT question_id, '15', true FROM q2
UNION ALL
SELECT question_id, '20', false FROM q2;

-- Q3: Multiple Correct
WITH q3 AS (
    INSERT INTO "Question" (assessment_id, question_text, question_type)
    VALUES (1, 'Select prime numbers', 'Multiple Correct')
    RETURNING question_id
)
INSERT INTO "Option" (question_id, option_text, is_correct)
SELECT question_id, '2', true FROM q3
UNION ALL
SELECT question_id, '3', true FROM q3
UNION ALL
SELECT question_id, '4', false FROM q3
UNION ALL
SELECT question_id, '5', true FROM q3;

-- ========================
-- SUBMISSION (student takes test)
-- ========================
INSERT INTO "Submission" (assessment_id, score, student_id, submitted_at) VALUES
(1, 3, 3, CURRENT_DATE); -- Student One

-- ========================
-- ANSWERS
-- ========================

-- Insert answers (simulate student answers)
WITH sub AS (
    SELECT submission_id FROM "Submission" WHERE student_id = 3 LIMIT 1
)

INSERT INTO "SubmissionAnswer" (submission_id, question_id, option_id)
SELECT 
    sub.submission_id,
    q.question_id,
    o.option_id
FROM sub
JOIN "Question" q ON q.assessment_id = 1
JOIN "Option" o ON o.question_id = q.question_id
WHERE o.is_correct = true;