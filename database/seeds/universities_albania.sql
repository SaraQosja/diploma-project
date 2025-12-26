-- database/seeds/universities_albania.sql 


DELETE FROM PROGRAMS WHERE UNIVERSITY_ID > 0;
DELETE FROM UNIVERSITIES WHERE UNIVERSITY_ID > 0;



INSERT INTO UNIVERSITIES (UNIVERSITY_ID, UNIVERSITY_NAME, LOCATION, COUNTRY, UNIVERSITY_TYPE, WEBSITE, CONTACT_INFO, TUITION_FEES, IS_ACTIVE, CREATED_AT, UPDATED_AT) VALUES
(1, 'Universiteti i Tiranës', 'Tiranë', 'Albania', 'public', 'https://www.unitir.edu.al', '{"phone": "+355 4 2232021", "email": "info@unitir.edu.al", "address": "Bulevardi Zogu I, Tiranë"}', 150, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

INSERT INTO UNIVERSITIES (UNIVERSITY_ID, UNIVERSITY_NAME, LOCATION, COUNTRY, UNIVERSITY_TYPE, WEBSITE, CONTACT_INFO, TUITION_FEES, IS_ACTIVE, CREATED_AT, UPDATED_AT) VALUES
(2, 'Universiteti Politeknik i Tiranës', 'Tiranë', 'Albania', 'public', 'https://www.upt.al', '{"phone": "+355 4 2362043", "email": "info@upt.al", "address": "Sheshi Nënë Tereza, Tiranë"}', 200, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

INSERT INTO UNIVERSITIES (UNIVERSITY_ID, UNIVERSITY_NAME, LOCATION, COUNTRY, UNIVERSITY_TYPE, WEBSITE, CONTACT_INFO, TUITION_FEES, IS_ACTIVE, CREATED_AT, UPDATED_AT) VALUES
(3, 'Universiteti i Shkodrës', 'Shkodër', 'Albania', 'public', 'https://www.unishk.edu.al', '{"phone": "+355 22 243152", "email": "info@unishk.edu.al", "address": "Rruga L. Gurakuqi, Shkodër"}', 150, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

INSERT INTO UNIVERSITIES (UNIVERSITY_ID, UNIVERSITY_NAME, LOCATION, COUNTRY, UNIVERSITY_TYPE, WEBSITE, CONTACT_INFO, TUITION_FEES, IS_ACTIVE, CREATED_AT, UPDATED_AT) VALUES
(4, 'Universiteti i Elbasanit', 'Elbasan', 'Albania', 'public', 'https://www.uniel.edu.al', '{"phone": "+355 54 244307", "email": "info@uniel.edu.al", "address": "Rruga Rinia, Elbasan"}', 140, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

INSERT INTO UNIVERSITIES (UNIVERSITY_ID, UNIVERSITY_NAME, LOCATION, COUNTRY, UNIVERSITY_TYPE, WEBSITE, CONTACT_INFO, TUITION_FEES, IS_ACTIVE, CREATED_AT, UPDATED_AT) VALUES
(5, 'Universiteti i Vlorës', 'Vlorë', 'Albania', 'public', 'https://www.univlora.edu.al', '{"phone": "+355 33 232323", "email": "info@univlora.edu.al", "address": "Rruga Kosova, Vlorë"}', 145, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

INSERT INTO UNIVERSITIES (UNIVERSITY_ID, UNIVERSITY_NAME, LOCATION, COUNTRY, UNIVERSITY_TYPE, WEBSITE, CONTACT_INFO, TUITION_FEES, IS_ACTIVE, CREATED_AT, UPDATED_AT) VALUES
(6, 'Universiteti European i Tiranës', 'Tiranë', 'Albania', 'private', 'https://www.uet.edu.al', '{"phone": "+355 4 2273067", "email": "info@uet.edu.al", "address": "Bulevardi Gjergj Fishta, Tiranë"}', 1200, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

INSERT INTO UNIVERSITIES (UNIVERSITY_ID, UNIVERSITY_NAME, LOCATION, COUNTRY, UNIVERSITY_TYPE, WEBSITE, CONTACT_INFO, TUITION_FEES, IS_ACTIVE, CREATED_AT, UPDATED_AT) VALUES
(7, 'Universiteti New York Tirana', 'Tiranë', 'Albania', 'private', 'https://www.unyt.edu.al', '{"phone": "+355 4 2258686", "email": "info@unyt.edu.al", "address": "Rruga M. Gjollesha, Tiranë"}', 1800, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

INSERT INTO UNIVERSITIES (UNIVERSITY_ID, UNIVERSITY_NAME, LOCATION, COUNTRY, UNIVERSITY_TYPE, WEBSITE, CONTACT_INFO, TUITION_FEES, IS_ACTIVE, CREATED_AT, UPDATED_AT) VALUES
(8, 'Universiteti Epoka', 'Tiranë', 'Albania', 'private', 'https://www.epoka.edu.al', '{"phone": "+355 4 2232086", "email": "info@epoka.edu.al", "address": "Bulevardi Tiranë-Rinas, Tiranë"}', 1500, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

INSERT INTO UNIVERSITIES (UNIVERSITY_ID, UNIVERSITY_NAME, LOCATION, COUNTRY, UNIVERSITY_TYPE, WEBSITE, CONTACT_INFO, TUITION_FEES, IS_ACTIVE, CREATED_AT, UPDATED_AT) VALUES
(9, 'Universiteti Bujqësor i Tiranës', 'Tiranë', 'Albania', 'public', 'https://www.ubt.edu.al', '{"phone": "+355 4 2358945", "email": "info@ubt.edu.al", "address": "Rruga Pajsi Vodica, Tiranë"}', 180, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

INSERT INTO UNIVERSITIES (UNIVERSITY_ID, UNIVERSITY_NAME, LOCATION, COUNTRY, UNIVERSITY_TYPE, WEBSITE, CONTACT_INFO, TUITION_FEES, IS_ACTIVE, CREATED_AT, UPDATED_AT) VALUES
(10, 'Universiteti i Arteve', 'Tiranë', 'Albania', 'public', 'https://www.uart.edu.al', '{"phone": "+355 4 2248832", "email": "info@uart.edu.al", "address": "Rruga e Kavajës, Tiranë"}', 160, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

INSERT INTO PROGRAMS (PROGRAM_ID, UNIVERSITY_ID, PROGRAM_NAME, FACULTY, DURATION_YEARS, MIN_GRADE, REQUIRED_SUBJECTS, TUITION_FEE, LANGUAGE, CAREER_PATHS, DESCRIPTION, ADMISSION_REQUIREMENTS, FACILITIES, IS_ACTIVE, CREATED_AT, UPDATED_AT) VALUES
(1, 1, 'Drejtësi', 'Fakulteti Juridik', 4, 8.5, '["Gjuhë dhe Letërsi Shqipe", "Historia", "Filosofia"]', 150, 'Shqip', '["Avokat", "Gjyqtar", "Prokuror", "Konsulent Ligjor"]', 'Program 4-vjeçar për përgatitjen e juristëve të nivelit të lartë. Fokus në të drejtën civile, penale, administrative dhe ndërkombëtare.', 'Diplomë e shkollës së mesme me notë mesatare minimum 8.5. Provim pranues me shkrim dhe gojore.', '["Biblioteka Juridike", "Salla Gjyqësore Simuluese", "Qendër Kërkimore"]', 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

INSERT INTO PROGRAMS (PROGRAM_ID, UNIVERSITY_ID, PROGRAM_NAME, FACULTY, DURATION_YEARS, MIN_GRADE, REQUIRED_SUBJECTS, TUITION_FEE, LANGUAGE, CAREER_PATHS, DESCRIPTION, ADMISSION_REQUIREMENTS, FACILITIES, IS_ACTIVE, CREATED_AT, UPDATED_AT) VALUES
(2, 1, 'Mjekësi e Përgjithshme', 'Fakulteti i Mjekësisë', 6, 9.0, '["Matematika", "Fizika", "Kimi", "Biologjia"]', 150, 'Shqip', '["Mjek i Përgjithshëm", "Specialist", "Kërkim Mjekësor"]', 'Program 6-vjeçar për përgatitjen e mjekëve. Përfshin praktikë klinike dhe stazhim në spitalin universitar.', 'Diplomë e shkollës së mesme me notë mesatare minimum 9.0. Provim pranues në shkencat natyrore.', '["Spitali Universitar", "Laboratorë të Avancuar", "Biblioteka Mjekësore"]', 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

INSERT INTO PROGRAMS (PROGRAM_ID, UNIVERSITY_ID, PROGRAM_NAME, FACULTY, DURATION_YEARS, MIN_GRADE, REQUIRED_SUBJECTS, TUITION_FEE, LANGUAGE, CAREER_PATHS, DESCRIPTION, ADMISSION_REQUIREMENTS, FACILITIES, IS_ACTIVE, CREATED_AT, UPDATED_AT) VALUES
(3, 1, 'Psikologji', 'Fakulteti i Shkencave Shoqërore', 3, 7.5, '["Matematika", "Gjuhë dhe Letërsi", "Historia"]', 150, 'Shqip', '["Psikolog Klinik", "Psikolog Shkollor", "Këshilltar", "Terapeut"]', 'Program që trajton psikologjinë klinike, sociale dhe zhvillimore. Përgatit profesionistë për punë me individë dhe grupe.', 'Diplomë e shkollës së mesme me notë mesatare minimum 7.5. Intervistë psikologjike.', '["Laboratori i Psikologjisë", "Kabina për Këshillim", "Qendër Hulumtimi"]', 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
  
INSERT INTO PROGRAMS (PROGRAM_ID, UNIVERSITY_ID, PROGRAM_NAME, FACULTY, DURATION_YEARS, MIN_GRADE, REQUIRED_SUBJECTS, TUITION_FEE, LANGUAGE, CAREER_PATHS, DESCRIPTION, ADMISSION_REQUIREMENTS, FACILITIES, IS_ACTIVE, CREATED_AT, UPDATED_AT) VALUES
(4, 2, 'Inxhinieri Informatike', 'Fakulteti i Teknologjisë së Informacionit', 4, 8.0, '["Matematika", "Fizika", "TIK"]', 200, 'Shqip', '["Zhvillues Software", "Arkitekt Sistemesh", "Analist Sistemesh", "Project Manager"]', 'Program modern që përgatit inxhinierë softuer me njohuri të thella në programim, databaza dhe sigurinë kibernetike.', 'Diplomë e shkollës së mesme me notë mesatare minimum 8.0. Provim pranues në matematikë.', '["Laboratorë Kompjuterik", "Servera të Avancuar", "Qendër Inovacioni"]', 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

INSERT INTO PROGRAMS (PROGRAM_ID, UNIVERSITY_ID, PROGRAM_NAME, FACULTY, DURATION_YEARS, MIN_GRADE, REQUIRED_SUBJECTS, TUITION_FEE, LANGUAGE, CAREER_PATHS, DESCRIPTION, ADMISSION_REQUIREMENTS, FACILITIES, IS_ACTIVE, CREATED_AT, UPDATED_AT) VALUES
(5, 2, 'Inxhinieri Civile', 'Fakulteti i Ndërtimit', 5, 7.8, '["Matematika", "Fizika", "Kimia"]', 200, 'Shqip', '["Inxhinier Ndërtimi", "Projektues", "Mbikëqyrës Punimesh", "Konsulent Teknik"]', 'Program që përgatit inxhinierë civilë për projektimin dhe ndërtimin e infrastrukturës. Fokus në teknologjitë moderne.', 'Diplomë e shkollës së mesme me notë mesatare minimum 7.8. Provim pranues në matematikë dhe fizikë.', '["Laboratori i Materialeve", "Software CAD", "Makete Ndërtimi"]', 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

INSERT INTO PROGRAMS (PROGRAM_ID, UNIVERSITY_ID, PROGRAM_NAME, FACULTY, DURATION_YEARS, MIN_GRADE, REQUIRED_SUBJECTS, TUITION_FEE, LANGUAGE, CAREER_PATHS, DESCRIPTION, ADMISSION_REQUIREMENTS, FACILITIES, IS_ACTIVE, CREATED_AT, UPDATED_AT) VALUES
(6, 2, 'Inxhinieri e Energjisë', 'Fakulteti i Inxhinierisë së Energjisë', 4, 7.5, '["Matematika", "Fizika"]', 200, 'Shqip', '["Specialist Energjie", "Projektues Sistemesh", "Konsulent Efiçience"]', 'Program që fokusohet në energjitë e rinovueshme dhe efiçiencën energjetike. Përgatitje për tregun modern të energjisë.', 'Diplomë e shkollës së mesme me notë mesatare minimum 7.5.', '["Laboratori Solar", "Simulues Sistemesh", "Qendër Kërkimi"]', 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

INSERT INTO PROGRAMS (PROGRAM_ID, UNIVERSITY_ID, PROGRAM_NAME, FACULTY, DURATION_YEARS, MIN_GRADE, REQUIRED_SUBJECTS, TUITION_FEE, LANGUAGE, CAREER_PATHS, DESCRIPTION, ADMISSION_REQUIREMENTS, FACILITIES, IS_ACTIVE, CREATED_AT, UPDATED_AT) VALUES
(7, 6, 'Administrim Biznesi', 'Fakulteti i Biznesit', 3, 7.0, '["Matematika", "Gjuhët e Huaja"]', 1200, 'Anglisht/Shqip', '["Manager", "Analist Financiar", "Konsulent Biznesi", "Sipërmarrës"]', 'Program ndërkombëtar që përgatit liderë të biznesit me fokus në menaxhimin modern dhe strategjitë e tregut global.', 'Diplomë e shkollës së mesme me notë mesatare minimum 7.0. Certifikatë gjuhe angleze.', '["Laboratori Biznes", "Incubatori Startupesh", "Qendër Karriere"]', 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

INSERT INTO PROGRAMS (PROGRAM_ID, UNIVERSITY_ID, PROGRAM_NAME, FACULTY, DURATION_YEARS, MIN_GRADE, REQUIRED_SUBJECTS, TUITION_FEE, LANGUAGE, CAREER_PATHS, DESCRIPTION, ADMISSION_REQUIREMENTS, FACILITIES, IS_ACTIVE, CREATED_AT, UPDATED_AT) VALUES
(8, 6, 'Marketing dhe Komunikim', 'Fakulteti i Komunikimit', 3, 6.8, '["Gjuhët e Huaja", "Gjuhë dhe Letërsi"]', 1200, 'Anglisht/Shqip', '["Marketing Manager", "PR Specialist", "Content Creator", "Brand Manager"]', 'Program që kombinon marketingun traditional me marketingun dixhital. Fokus në rrjetet sociale dhe komunikimin e markës.', 'Diplomë e shkollës së mesme me notë mesatare minimum 6.8.', '["Studio Produksioni", "Laboratori Dixhital", "Agjensi Marketing"]', 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

INSERT INTO PROGRAMS (PROGRAM_ID, UNIVERSITY_ID, PROGRAM_NAME, FACULTY, DURATION_YEARS, MIN_GRADE, REQUIRED_SUBJECTS, TUITION_FEE, LANGUAGE, CAREER_PATHS, DESCRIPTION, ADMISSION_REQUIREMENTS, FACILITIES, IS_ACTIVE, CREATED_AT, UPDATED_AT) VALUES
(9, 7, 'Financë dhe Kontabilitet', 'Fakulteti i Ekonomisë', 3, 7.2, '["Matematika", "Ekonomi"]', 1800, 'Anglisht', '["Analist Financiar", "Kontabilist", "Auditor", "Konsulent Takse"]', 'Program që përgatit profesionistë të financave me standardet amerikane. Fokus në analizën financiare dhe tregtinë ndërkombëtare.', 'Diplomë e shkollës së mesme me notë mesatare minimum 7.2. IELTS 6.5 ose TOEFL 90.', '["Trading Room", "Bloomberg Terminal", "Qendër Kërkimi Financiar"]', 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

INSERT INTO PROGRAMS (PROGRAM_ID, UNIVERSITY_ID, PROGRAM_NAME, FACULTY, DURATION_YEARS, MIN_GRADE, REQUIRED_SUBJECTS, TUITION_FEE, LANGUAGE, CAREER_PATHS, DESCRIPTION, ADMISSION_REQUIREMENTS, FACILITIES, IS_ACTIVE, CREATED_AT, UPDATED_AT) VALUES
(10, 7, 'Shkenca Kompjuterike', 'Fakulteti i Teknologjisë', 4, 8.2, '["Matematika", "Fizika", "TIK"]', 1800, 'Anglisht', '["Software Engineer", "Data Scientist", "AI Specialist", "Cybersecurity Expert"]', 'Program i avancuar në shkencën e kompjuterëve me fokus në inteligjencën artificiale dhe big data.', 'Diplomë e shkollës së mesme me notë mesatare minimum 8.2. IELTS 7.0.', '["AI Lab", "Supercomputer", "VR/AR Studio"]', 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

INSERT INTO PROGRAMS (PROGRAM_ID, UNIVERSITY_ID, PROGRAM_NAME, FACULTY, DURATION_YEARS, MIN_GRADE, REQUIRED_SUBJECTS, TUITION_FEE, LANGUAGE, CAREER_PATHS, DESCRIPTION, ADMISSION_REQUIREMENTS, FACILITIES, IS_ACTIVE, CREATED_AT, UPDATED_AT) VALUES
(11, 8, 'Arkitekturë', 'Fakulteti i Arkitekturës dhe Inxhinierisë', 5, 7.8, '["Matematika", "Fizika", "Arte"]', 1500, 'Anglisht/Shqip', '["Arkitekt", "Urbanist", "Dizajner Interior", "Project Manager"]', 'Program 5-vjeçar që kombinon traditën me inovacionin. Fokus në arkitekturën e qëndrueshme dhe urbanistikën moderne.', 'Diplomë e shkollës së mesme me notë mesatare minimum 7.8. Portfolio artistik dhe intervistë.', '["Studio Design", "3D Printing Lab", "Model Workshop"]', 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

INSERT INTO PROGRAMS (PROGRAM_ID, UNIVERSITY_ID, PROGRAM_NAME, FACULTY, DURATION_YEARS, MIN_GRADE, REQUIRED_SUBJECTS, TUITION_FEE, LANGUAGE, CAREER_PATHS, DESCRIPTION, ADMISSION_REQUIREMENTS, FACILITIES, IS_ACTIVE, CREATED_AT, UPDATED_AT) VALUES
(12, 8, 'Inxhinieri Industriale', 'Fakulteti i Arkitekturës dhe Inxhinierisë', 4, 7.5, '["Matematika", "Fizika"]', 1500, 'Anglisht/Shqip', '["Process Engineer", "Quality Manager", "Operations Manager", "Consultant"]', 'Program që përgatit inxhinierë për optimizimin e proceseve industriale dhe menaxhimin e cilësisë.', 'Diplomë e shkollës së mesme me notë mesatare minimum 7.5.', '["Laboratori Simulimi", "Software Industrial", "Qendër Inovacioni"]', 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

INSERT INTO PROGRAMS (PROGRAM_ID, UNIVERSITY_ID, PROGRAM_NAME, FACULTY, DURATION_YEARS, MIN_GRADE, REQUIRED_SUBJECTS, TUITION_FEE, LANGUAGE, CAREER_PATHS, DESCRIPTION, ADMISSION_REQUIREMENTS, FACILITIES, IS_ACTIVE, CREATED_AT, UPDATED_AT) VALUES
(13, 9, 'Agronomì', 'Fakulteti i Bujqësisë dhe Mjedisit', 4, 7.0, '["Biologjia", "Kimia", "Matematika"]', 180, 'Shqip', '["Agronom", "Konsulent Bujqësor", "Specialist Mjedisi", "Inspector Cilësie"]', 'Program që trajton bujqësinë moderne dhe teknologjitë e reja. Fokus në bujqësinë organike dhe të qëndrueshme.', 'Diplomë e shkollës së mesme me notë mesatare minimum 7.0.', '["Ferma Eksperimentale", "Laboratori Analitik", "Sera Moderne"]', 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

INSERT INTO PROGRAMS (PROGRAM_ID, UNIVERSITY_ID, PROGRAM_NAME, FACULTY, DURATION_YEARS, MIN_GRADE, REQUIRED_SUBJECTS, TUITION_FEE, LANGUAGE, CAREER_PATHS, DESCRIPTION, ADMISSION_REQUIREMENTS, FACILITIES, IS_ACTIVE, CREATED_AT, UPDATED_AT) VALUES
(14, 9, 'Veterinari', 'Fakulteti i Veterinarisë', 5, 8.5, '["Biologjia", "Kimia", "Fizika"]', 180, 'Shqip', '["Veteriner", "Inspector Higjiene", "Kërkimtar", "Konsulent"]', 'Program 5-vjeçar për përgatitjen e veterinerëve. Përfshin praktikë në klinika dhe ferma.', 'Diplomë e shkollës së mesme me notë mesatare minimum 8.5. Provim pranues në shkencat natyrore.', '["Klinika Veterinare", "Laboratori Patologjik", "Ferma Eksperimentale"]', 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

INSERT INTO PROGRAMS (PROGRAM_ID, UNIVERSITY_ID, PROGRAM_NAME, FACULTY, DURATION_YEARS, MIN_GRADE, REQUIRED_SUBJECTS, TUITION_FEE, LANGUAGE, CAREER_PATHS, DESCRIPTION, ADMISSION_REQUIREMENTS, FACILITIES, IS_ACTIVE, CREATED_AT, UPDATED_AT) VALUES
(15, 10, 'Arte Pamrore', 'Fakulteti i Arteve Pamrore', 4, 6.5, '["Arte", "Historia e Artit"]', 160, 'Shqip', '["Piktor", "Skulptor", "Artist Dixhital", "Kurator"]', 'Program që zhvillon talentin artistik dhe njohjen e traditave kulturore shqiptare dhe europiane.', 'Diplomë e shkollës së mesme me notë mesatare minimum 6.5. Portfolio artistik dhe provim praktik.', '["Atelier Pikture", "Studio Skulpture", "Galeria Arti"]', 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

INSERT INTO PROGRAMS (PROGRAM_ID, UNIVERSITY_ID, PROGRAM_NAME, FACULTY, DURATION_YEARS, MIN_GRADE, REQUIRED_SUBJECTS, TUITION_FEE, LANGUAGE, CAREER_PATHS, DESCRIPTION, ADMISSION_REQUIREMENTS, FACILITIES, IS_ACTIVE, CREATED_AT, UPDATED_AT) VALUES
(16, 10, 'Muzikë', 'Fakulteti i Muzikës', 4, 6.8, '["Muzika", "Matematika"]', 160, 'Shqip', '["Muzikant", "Kompozitor", "Mësues Muzike", "Drejtor Artistik"]', 'Program që përgatit instrumentistë dhe kompozitorë profesionalë. Fokus në muzikën klasike dhe tradicionale shqiptare.', 'Diplomë e shkollës së mesme me notë mesatare minimum 6.8. Provim instrumenti dhe teori muzikore.', '["Studio Incizimi", "Sale Koncertesh", "Instrumenta të Shumtë"]', 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

INSERT INTO PROGRAMS (PROGRAM_ID, UNIVERSITY_ID, PROGRAM_NAME, FACULTY, DURATION_YEARS, MIN_GRADE, REQUIRED_SUBJECTS, TUITION_FEE, LANGUAGE, CAREER_PATHS, DESCRIPTION, ADMISSION_REQUIREMENTS, FACILITIES, IS_ACTIVE, CREATED_AT, UPDATED_AT) VALUES
(17, 3, 'Mësuesi për Arsimin Fillor', 'Fakulteti i Shkencave Edukative', 3, 7.5, '["Gjuhë dhe Letërsi", "Matematika", "Historia"]', 150, 'Shqip', '["Mësues Fillor", "Koordinator Arsimor", "Specialist Kurrikuli"]', 'Program që përgatit mësues të kualifikuar për arsimin fillor me metodat më të reja të mësimdhënies.', 'Diplomë e shkollës së mesme me notë mesatare minimum 7.5. Intervistë motivuese.', '["Laboratori Mësimdhënie", "Biblioteka Pedagogjike", "Sale Moderne"]', 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

INSERT INTO PROGRAMS (PROGRAM_ID, UNIVERSITY_ID, PROGRAM_NAME, FACULTY, DURATION_YEARS, MIN_GRADE, REQUIRED_SUBJECTS, TUITION_FEE, LANGUAGE, CAREER_PATHS, DESCRIPTION, ADMISSION_REQUIREMENTS, FACILITIES, IS_ACTIVE, CREATED_AT, UPDATED_AT) VALUES
(18, 3, 'Gjuhë-Letërsi', 'Fakulteti i Gjuhës dhe Letërsisë', 3, 7.0, '["Gjuhë dhe Letërsi Shqipe", "Historia", "Filozofia"]', 150, 'Shqip', '["Mësues Gjuhe", "Translator", "Gazetar", "Editor"]', 'Program që thellëson njohuritë për gjuhën dhe letërsinë shqipe dhe të huaj. Përgatit specialistë të komunikimit.', 'Diplomë e shkollës së mesme me notë mesatare minimum 7.0.', '["Biblioteka e Specializuar", "Laboratori Gjuhësor", "Media Center"]', 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
 
INSERT INTO PROGRAMS (PROGRAM_ID, UNIVERSITY_ID, PROGRAM_NAME, FACULTY, DURATION_YEARS, MIN_GRADE, REQUIRED_SUBJECTS, TUITION_FEE, LANGUAGE, CAREER_PATHS, DESCRIPTION, ADMISSION_REQUIREMENTS, FACILITIES, IS_ACTIVE, CREATED_AT, UPDATED_AT) VALUES
(19, 4, 'Infermieri', 'Fakulteti i Shkencave Mjekësore', 3, 7.8, '["Biologjia", "Kimia", "Matematika"]', 140, 'Shqip', '["Infermier", "Supervisor Shëndetësor", "Specialist Kujdesi"]', 'Program që përgatit infermiern profesionalë për sistemin shëndetësor. Fokus në kujdesin cilësor dhe menaxhimin e pacientëve.', 'Diplomë e shkollës së mesme me notë mesatare minimum 7.8. Kontroll mjekësor.', '["Laboratori Simulimi", "Spital i Praktikës", "Klinikat Moderne"]', 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

INSERT INTO PROGRAMS (PROGRAM_ID, UNIVERSITY_ID, PROGRAM_NAME, FACULTY, DURATION_YEARS, MIN_GRADE, REQUIRED_SUBJECTS, TUITION_FEE, LANGUAGE, CAREER_PATHS, DESCRIPTION, ADMISSION_REQUIREMENTS, FACILITIES, IS_ACTIVE, CREATED_AT, UPDATED_AT) VALUES
(20, 4, 'Teknologji Informacioni', 'Fakulteti i Shkencave të Natyrës', 3, 7.5, '["Matematika", "TIK", "Fizika"]', 140, 'Shqip', '["Administrator Sistemesh", "Web Developer", "IT Support", "Database Administrator"]', 'Program që përgatit specialistë TI për tregun vendor. Fokus në teknologjitë praktike dhe zgjidhjet e biznesit.', 'Diplomë e shkollës së mesme me notë mesatare minimum 7.5.', '["Rrjeti Kompjuterik", "Server Room", "Software Labs"]', 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);


INSERT INTO PROGRAMS (PROGRAM_ID, UNIVERSITY_ID, PROGRAM_NAME, FACULTY, DURATION_YEARS, MIN_GRADE, REQUIRED_SUBJECTS, TUITION_FEE, LANGUAGE, CAREER_PATHS, DESCRIPTION, ADMISSION_REQUIREMENTS, FACILITIES, IS_ACTIVE, CREATED_AT, UPDATED_AT) VALUES
(21, 5, 'Ekonomi dhe Financë', 'Fakulteti i Ekonomisë', 3, 7.3, '["Matematika", "Ekonomi", "Gjuhët e Huaja"]', 145, 'Shqip', '["Ekonomist", "Analist Tregut", "Specialist Banke", "Konsulent Financiar"]', 'Program që trajton ekonominë moderne dhe analizën financiare. Fokus në tregjet vendore dhe ndërkombëtare.', 'Diplomë e shkollës së mesme me notë mesatare minimum 7.3.', '["Laboratori Ekonomik", "Simulues Tregtie", "Qendër Hulumtimi"]', 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

INSERT INTO PROGRAMS (PROGRAM_ID, UNIVERSITY_ID, PROGRAM_NAME, FACULTY, DURATION_YEARS, MIN_GRADE, REQUIRED_SUBJECTS, TUITION_FEE, LANGUAGE, CAREER_PATHS, DESCRIPTION, ADMISSION_REQUIREMENTS, FACILITIES, IS_ACTIVE, CREATED_AT, UPDATED_AT) VALUES
(22, 5, 'Turizëm dhe Hoteleri', 'Fakulteti i Ekonomisë', 3, 6.8, '["Gjuhët e Huaja", "Gjeografia", "Historia"]', 145, 'Shqip/Anglisht', '["Manager Hoteli", "Gid Turistik", "Event Manager", "Travel Agent"]', 'Program që përgatit profesionistë për industrinë e turizmit, duke përfituar nga pozita strategjike e Vlorës.', 'Diplomë e shkollës së mesme me notë mesatare minimum 6.8. Njohja e dy gjuhëve të huaja.', '["Hotel Stërvitje", "Agjenci Udhëtimi", "Laboratori Gastronomie"]', 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

COMMIT;