-- ============================================================================
-- Dawah Department (ASSDI) seed data — campuses, master course list, sample
-- batches, syllabus, assessments, resources and website feedback.
-- Safe to re-run. (Demo login accounts live in seed_demo_users.sql.)
-- ============================================================================

-- Campuses ------------------------------------------------------------------
insert into public.campuses (name, slug, address) values
  ('Kazi Bari Campus',           'kazibari', 'Kazi Bari, Dhaka'),
  ('Satarkul Campus',            'satarkul', 'Satarkul, Badda, Dhaka'),
  ('50 Katha Technical Campus',  '50-katha', '50 Katha, Dhaka')
on conflict (slug) do nothing;

-- Master course list (with abbreviations) -----------------------------------
insert into public.courses (name, abbreviation, category, duration_label, default_total_classes, campus_id)
select v.name, v.abbr, v.cat::course_category, v.dur, v.total,
       (select id from public.campuses where slug = v.campus_slug)
from (values
  ('Sail to Success English Language Program',          'SSELP',          'general', '3 months', 90,  'satarkul'),
  ('The Art of Creation',                               'AOC',            'general', '1 month',  30,  'kazibari'),
  ('Small Business Management Course',                  'SBMC',           'general', '2 months', 60,  'kazibari'),
  ('The Art of Sales & Marketing',                      'SM',             'general', '2 months', 60,  'kazibari'),
  ('As-Sunnah Gul-Jahara Bahar Khanam Driving School',  'Driving School', 'general', '1 month',  30,  '50-katha'),
  ('Mobile Repairing Course',                           'MRC',            'general', '3 months', 90,  '50-katha'),
  ('Refrigeration & Air Conditioning',                  'RAC',            'general', '3 months', 90,  '50-katha'),
  ('Welding & Fabrication',                             'W&F',            'general', '3 months', 90,  '50-katha'),
  ('Professional Cooking & Catering Management',        'PCCM',           'general', '3 months', 90,  '50-katha'),
  ('Professional Motor-Bike Technician Training',       'PMTT',           'general', '4 months', 120, '50-katha'),
  ('Dawah Class (Scholars & General)',                  'DAWAH',          'common',  '3 months', 75,  'satarkul'),
  ('Quran Academy (Tajweed & Recitation)',              'QURAN',          'common',  '3 months', 60,  'satarkul')
) as v(name, abbr, cat, dur, total, campus_slug)
where not exists (select 1 from public.courses c where c.abbreviation = v.abbr);

-- Sample syllabus for the Dawah course --------------------------------------
insert into public.syllabus_topics (course_id, sequence, title)
select (select id from public.courses where abbreviation = 'DAWAH'), s.seq, s.title
from (values
  (1,  'Month 1: Character & manners of the Da''i'),
  (2,  'Month 1: Wisdom (hikmah) & gentleness'),
  (3,  'Month 1: Strategies for family Dawah'),
  (4,  'Month 1: Methods of Dawah to non-Muslims'),
  (5,  'Month 2: Western culture & Muslim youth'),
  (6,  'Month 2: Answering atheism & skepticism'),
  (7,  'Month 2: Refuting propaganda against Islam'),
  (8,  'Month 2: Using media & technology'),
  (9,  'Month 3: Public speaking & body language'),
  (10, 'Month 3: Dawah through writing'),
  (11, 'Month 3: Field work & direct Dawah'),
  (12, 'Month 3: Organisation & management')
) as s(seq, title)
where exists (select 1 from public.courses where abbreviation = 'DAWAH')
  and not exists (
    select 1 from public.syllabus_topics t
    join public.courses c on c.id = t.course_id
    where c.abbreviation = 'DAWAH' and t.sequence = s.seq);

-- Sample syllabus for the Quran Academy --------------------------------------
insert into public.syllabus_topics (course_id, sequence, title)
select (select id from public.courses where abbreviation = 'QURAN'), s.seq, s.title
from (values
  (1, 'Makharij: the points of articulation'),
  (2, 'Noon Sakinah & Tanween rules'),
  (3, 'Meem Sakinah rules'),
  (4, 'Rules of Madd (elongation)'),
  (5, 'Qalqalah & heavy/light letters'),
  (6, 'Fluency & melodious recitation practice')
) as s(seq, title)
where exists (select 1 from public.courses where abbreviation = 'QURAN')
  and not exists (
    select 1 from public.syllabus_topics t
    join public.courses c on c.id = t.course_id
    where c.abbreviation = 'QURAN' and t.sequence = s.seq);

-- Sample batches ------------------------------------------------------------
insert into public.batches
  (course_id, batch_no, duration_label, start_date, farewell_date,
   total_classes, completed_classes, midterm_status, final_status, status)
select c.id, v.batch_no, v.dur, v.start::date, v.farewell::date,
       v.total, v.done, v.mid::exam_status, v.fin::exam_status, v.st::batch_status
from (values
  ('SSELP', '01', '3 months', '2026-04-01', '2026-06-30', 90,  52, 'done',    'none',    'ongoing'),
  ('AOC',   '02', '1 month',  '2026-04-10', '2026-05-10', 30,  30, 'done',    'done',    'completed'),
  ('PMTT',  '01', '4 months', '2026-03-15', '2026-07-15', 120, 38, 'pending', 'none',    'ongoing'),
  ('DAWAH', '03', '3 months', '2026-05-01', '2026-07-30', 75,  18, 'none',    'none',    'ongoing'),
  ('QURAN', '02', '3 months', '2026-05-05', '2026-08-05', 60,  6,  'none',    'none',    'ongoing'),
  ('MRC',   '04', '3 months', '2026-07-01', '2026-09-30', 90,  0,  'none',    'none',    'will_start'),
  ('RAC',   '02', '3 months', '2026-02-01', '2026-04-30', 90,  90, 'done',    'done',    'completed')
) as v(abbr, batch_no, dur, start, farewell, total, done, mid, fin, st)
join public.courses c on c.abbreviation = v.abbr
where not exists (
  select 1 from public.batches b
  where b.course_id = c.id and b.batch_no = v.batch_no);

-- Entry/peer/exit assessments for the ongoing/completed batches -------------
insert into public.assessments (batch_id, type, is_done)
select b.id, a.type::assessment_type, a.done
from (values
  ('SSELP', '01', 'entry', true),
  ('SSELP', '01', 'peer',  true),
  ('SSELP', '01', 'exit',  false),
  ('AOC',   '02', 'entry', true),
  ('AOC',   '02', 'peer',  true),
  ('AOC',   '02', 'exit',  true),
  ('PMTT',  '01', 'entry', true),
  ('PMTT',  '01', 'peer',  false),
  ('PMTT',  '01', 'exit',  false)
) as a(abbr, batch_no, type, done)
join public.courses c on c.abbreviation = a.abbr
join public.batches b on b.course_id = c.id and b.batch_no = a.batch_no
on conflict (batch_id, type) do nothing;

-- Resource center (no uploader — public/admin library) -----------------------
insert into public.resources (title, type, url, course_id)
select v.title, v.type::resource_type, v.url,
       (select id from public.courses where abbreviation = v.abbr)
from (values
  ('Dawah Field Handbook (PDF)',          'pdf',   'https://example.com/dawah-handbook.pdf', 'DAWAH'),
  ('Public Speaking Slides',              'slide', 'https://example.com/speaking.pdf',       'DAWAH'),
  ('Tajweed Rules — Quick Reference',     'pdf',   'https://example.com/tajweed.pdf',        'QURAN'),
  ('Recitation Demo (Video)',             'video', 'https://example.com/recitation',         'QURAN'),
  ('Riyad as-Salihin (Book)',             'book',  'https://example.com/riyad',              NULL),
  ('As-Sunnah Foundation — Website',      'link',  'https://assunnahfoundation.org',         NULL)
) as v(title, type, url, abbr)
where not exists (select 1 from public.resources r where r.title = v.title);

-- Website feedback / complaints ---------------------------------------------
insert into public.feedback (name, phone, message, is_read)
select v.name, v.phone, v.message, v.is_read
from (values
  ('Rahim Uddin',   '01711-000001', 'Jazakum Allahu khairan. The English program changed my career, alhamdulillah.', false),
  ('Anonymous',     null,           'Please add an evening batch for the Quran Academy.', false),
  ('Fatima Akter',  '01822-000002', 'The driving school instructors are very professional and patient.', true),
  ('Yusuf Islam',   '01933-000003', 'Requesting a Dawah class in the Mirpur area as well, in sha Allah.', false)
) as v(name, phone, message, is_read)
where not exists (select 1 from public.feedback f where f.message = v.message);
