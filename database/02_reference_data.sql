-- ============================================================
-- SmartDesk IT Service — reference data
-- Lookup values the application logic depends on (categories,
-- impact/urgency levels, the priority matrix, SLA targets).
-- Run this in every environment, including production — nothing
-- here is demo content.
-- ============================================================


-- categories

INSERT INTO "categories" ("name", "bg_color", "accent_color") VALUES
('เครือข่าย', '#DCEBFF', '#2F5FD1'),
('บัญชีผู้ใช้', '#F1E3FF', '#7C3AED'),
('อุปกรณ์', '#FFE8D6', '#D96A1B'),
('อีเมล', '#DFF6E9', '#178A4C'),
('ซอฟต์แวร์', '#E4E7FF', '#4F46E5'),
('พื้นที่จัดเก็บ', '#FDE3EC', '#C22B62');


-- impact_levels

INSERT INTO "impact_levels" ("id", "label") VALUES
(1, 'กระทบคนเดียว'),
(2, 'กระทบทีม'),
(3, 'กระทบทั้งองค์กร');


-- urgency_levels

INSERT INTO "urgency_levels" ("id", "label") VALUES
(1, 'ไม่เร่งด่วน'),
(2, 'เร่งด่วนปานกลาง'),
(3, 'เร่งด่วนมาก');


-- priority_matrix (impact x urgency -> priority)

INSERT INTO "priority_matrix" ("impact_id", "urgency_id", "priority") VALUES
(1, 1, 'low'),
(1, 2, 'low'),
(1, 3, 'medium'),
(2, 1, 'low'),
(2, 2, 'medium'),
(2, 3, 'high'),
(3, 1, 'medium'),
(3, 2, 'high'),
(3, 3, 'critical');


-- sla_policies

INSERT INTO "sla_policies" ("priority", "resolve_within_hours") VALUES
('critical', 0.5),
('high', 4),
('medium', 24),
('low', 72);
