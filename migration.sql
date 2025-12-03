-- Migration to Normalized Schema

-- 1. Create Lookup Table for Activity Types (Optional but good for FKs, or just use Enum/Text)
-- We will use text for simplicity as per diagram implies 'Activity' table but we can just link via ID.
-- Let's create the Activity Master table as requested.
CREATE TABLE IF NOT EXISTS "Activity" (
    "id" uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    "description" text NOT NULL, -- e.g. 'Book Summary', 'Check-in'
    "created_at" timestamp with time zone DEFAULT timezone('utc'::text, now())
);

-- Insert default types
INSERT INTO "Activity" ("description") VALUES 
('Check-in'), ('Book Summary'), ('Clip Summary'), ('Coaching'), ('Sale Slip')
ON CONFLICT DO NOTHING;

-- 2. Create ScoreMember Table
CREATE TABLE IF NOT EXISTS "ScoreMember" (
    "id" uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    "member_id" uuid REFERENCES profiles(id) NOT NULL,
    "total_point" integer DEFAULT 0,
    "current_streak" integer DEFAULT 0,
    "create_on" timestamp with time zone DEFAULT timezone('utc'::text, now()),
    "create_by" uuid REFERENCES auth.users(id),
    "update_on" timestamp with time zone DEFAULT timezone('utc'::text, now()),
    "update_by" uuid REFERENCES auth.users(id),
    CONSTRAINT unique_member_score UNIQUE ("member_id")
);

-- 3. Create Detail Tables

-- CheckinCenter
CREATE TABLE IF NOT EXISTS "CheckinCenter" (
    "id" uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    "checkin_type" text NOT NULL, -- 'onsite', 'online'
    "location" jsonb, -- {lat, lng}
    "image_file" text,
    "create_on" timestamp with time zone DEFAULT timezone('utc'::text, now()),
    "create_by" uuid REFERENCES auth.users(id)
);

-- BookSummary
CREATE TABLE IF NOT EXISTS "BookSummary" (
    "id" uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    "book_title" text NOT NULL,
    "key_takeaway" text,
    "image_file" text,
    "create_on" timestamp with time zone DEFAULT timezone('utc'::text, now()),
    "create_by" uuid REFERENCES auth.users(id)
);

-- ClipSummary
CREATE TABLE IF NOT EXISTS "ClipSummary" (
    "id" uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    "clip_link" text,
    "key_takeaway" text,
    "image_file" text,
    "create_on" timestamp with time zone DEFAULT timezone('utc'::text, now()),
    "create_by" uuid REFERENCES auth.users(id)
);

-- Coaching
CREATE TABLE IF NOT EXISTS "Coaching" (
    "id" uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    "coachee_id" uuid REFERENCES profiles(id), -- Assuming coachee is a member
    "coachee_name" text, -- Fallback if not a member or just name
    "key_takeaway" text,
    "image_file" text,
    "create_on" timestamp with time zone DEFAULT timezone('utc'::text, now()),
    "create_by" uuid REFERENCES auth.users(id)
);

-- SaleSlip
CREATE TABLE IF NOT EXISTS "SaleSlip" (
    "id" uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    "amount" numeric,
    "note" text,
    "image_file" text,
    "create_on" timestamp with time zone DEFAULT timezone('utc'::text, now()),
    "create_by" uuid REFERENCES auth.users(id)
);

-- 4. Create Central Transaction Table: RecordActivity
CREATE TABLE IF NOT EXISTS "RecordActivity" (
    "id" uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    "activity_type" text NOT NULL, -- 'checkin', 'book', 'clip', 'coaching', 'sale'
    "member_id" uuid REFERENCES profiles(id) NOT NULL,
    "ref_id" uuid NOT NULL, -- ID of the record in the detail table
    "create_on" timestamp with time zone DEFAULT timezone('utc'::text, now()),
    "date_string" text NOT NULL -- For easy querying by date (YYYY-MM-DD)
);

-- 5. Enable RLS
ALTER TABLE "ScoreMember" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "CheckinCenter" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "BookSummary" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ClipSummary" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Coaching" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "SaleSlip" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "RecordActivity" ENABLE ROW LEVEL SECURITY;

-- 6. RLS Policies (Simplified: Everyone can view, Users can insert own)

-- ScoreMember
CREATE POLICY "Public view scores" ON "ScoreMember" FOR SELECT USING (true);
CREATE POLICY "Users update own score" ON "ScoreMember" FOR UPDATE USING (auth.uid() = member_id);
CREATE POLICY "Users insert own score" ON "ScoreMember" FOR INSERT WITH CHECK (auth.uid() = member_id);

-- RecordActivity
CREATE POLICY "Public view records" ON "RecordActivity" FOR SELECT USING (true);
CREATE POLICY "Users insert own records" ON "RecordActivity" FOR INSERT WITH CHECK (auth.uid() = member_id);

-- Detail Tables (Generic Policy Generator would be nice, but manual for safety)
-- CheckinCenter
CREATE POLICY "Public view checkins" ON "CheckinCenter" FOR SELECT USING (true);
CREATE POLICY "Users insert checkins" ON "CheckinCenter" FOR INSERT WITH CHECK (auth.uid() = create_by);

-- BookSummary
CREATE POLICY "Public view books" ON "BookSummary" FOR SELECT USING (true);
CREATE POLICY "Users insert books" ON "BookSummary" FOR INSERT WITH CHECK (auth.uid() = create_by);

-- ClipSummary
CREATE POLICY "Public view clips" ON "ClipSummary" FOR SELECT USING (true);
CREATE POLICY "Users insert clips" ON "ClipSummary" FOR INSERT WITH CHECK (auth.uid() = create_by);

-- Coaching
CREATE POLICY "Public view coaching" ON "Coaching" FOR SELECT USING (true);
CREATE POLICY "Users insert coaching" ON "Coaching" FOR INSERT WITH CHECK (auth.uid() = create_by);

-- SaleSlip
CREATE POLICY "Public view sales" ON "SaleSlip" FOR SELECT USING (true);
CREATE POLICY "Users insert sales" ON "SaleSlip" FOR INSERT WITH CHECK (auth.uid() = create_by);


-- 7. Create Unified View for Frontend
-- This view mimics the old 'activities' table structure so the frontend is easier to adapt
CREATE OR REPLACE VIEW "activity_history_view" AS
SELECT 
    r.id,
    r.member_id as user_id,
    r.activity_type as type,
    r.create_on as created_at,
    r.date_string,
    -- Construct the 'data' JSON object dynamically based on type
    CASE 
        WHEN r.activity_type = 'checkin' THEN 
            jsonb_build_object(
                'checkinType', c.checkin_type, 
                'location', c.location, 
                'image', c.image_file
            )
        WHEN r.activity_type = 'book' THEN 
            jsonb_build_object(
                'bookTitle', b.book_title, 
                'summary', b.key_takeaway, 
                'image', b.image_file
            )
        WHEN r.activity_type = 'clip' THEN 
            jsonb_build_object(
                'clipLink', cl.clip_link, 
                'summary', cl.key_takeaway, 
                'image', cl.image_file
            )
        WHEN r.activity_type = 'coaching' THEN 
            jsonb_build_object(
                'coachee', co.coachee_name, 
                'notes', co.key_takeaway, 
                'image', co.image_file
            )
        WHEN r.activity_type = 'sale' THEN 
            jsonb_build_object(
                'amount', s.amount, 
                'notes', s.note, 
                'image', s.image_file
            )
        ELSE '{}'::jsonb
    END as data,
    -- Image URL helper
    COALESCE(c.image_file, b.image_file, cl.image_file, co.image_file, s.image_file) as image_url
FROM "RecordActivity" r
LEFT JOIN "CheckinCenter" c ON r.ref_id = c.id AND r.activity_type = 'checkin'
LEFT JOIN "BookSummary" b ON r.ref_id = b.id AND r.activity_type = 'book'
LEFT JOIN "ClipSummary" cl ON r.ref_id = cl.id AND r.activity_type = 'clip'
LEFT JOIN "Coaching" co ON r.ref_id = co.id AND r.activity_type = 'coaching'
LEFT JOIN "SaleSlip" s ON r.ref_id = s.id AND r.activity_type = 'sale';

-- Grant access to view
GRANT SELECT ON "activity_history_view" TO anon, authenticated, service_role;
