
-- Add category column to notes table
ALTER TABLE notes ADD COLUMN IF NOT EXISTS category VARCHAR(50) DEFAULT 'general';

-- Update RLS policies for notes if they don't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'notes' AND policyname = 'Users can view their own notes'
    ) THEN
        CREATE POLICY "Users can view their own notes" ON notes
            FOR SELECT USING (auth.uid() = user_id);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'notes' AND policyname = 'Users can insert their own notes'
    ) THEN
        CREATE POLICY "Users can insert their own notes" ON notes
            FOR INSERT WITH CHECK (auth.uid() = user_id);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'notes' AND policyname = 'Users can update their own notes'
    ) THEN
        CREATE POLICY "Users can update their own notes" ON notes
            FOR UPDATE USING (auth.uid() = user_id);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'notes' AND policyname = 'Users can delete their own notes'
    ) THEN
        CREATE POLICY "Users can delete their own notes" ON notes
            FOR DELETE USING (auth.uid() = user_id);
    END IF;
END $$;
