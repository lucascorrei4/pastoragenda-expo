-- Create pastor_sharing_settings table
CREATE TABLE IF NOT EXISTS pastor_sharing_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  user_email TEXT,
  sharing_enabled BOOLEAN DEFAULT true,
  share_sermons BOOLEAN DEFAULT true,
  share_events BOOLEAN DEFAULT true,
  share_prayer_requests BOOLEAN DEFAULT true,
  share_announcements BOOLEAN DEFAULT true,
  share_media BOOLEAN DEFAULT true,
  allow_public_sharing BOOLEAN DEFAULT false,
  share_with_contacts BOOLEAN DEFAULT true,
  share_with_groups BOOLEAN DEFAULT true,
  custom_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_pastor_sharing_settings_user_id ON pastor_sharing_settings(user_id);
CREATE INDEX IF NOT EXISTS idx_pastor_sharing_settings_user_email ON pastor_sharing_settings(user_email);

-- Enable Row Level Security
ALTER TABLE pastor_sharing_settings ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Users can view their own sharing settings
CREATE POLICY "Users can view own sharing settings" ON pastor_sharing_settings
  FOR SELECT USING (
    auth.uid() = user_id OR 
    auth.jwt() ->> 'email' = user_email
  );

-- Users can insert their own sharing settings
CREATE POLICY "Users can insert own sharing settings" ON pastor_sharing_settings
  FOR INSERT WITH CHECK (
    auth.uid() = user_id OR 
    auth.jwt() ->> 'email' = user_email
  );

-- Users can update their own sharing settings
CREATE POLICY "Users can update own sharing settings" ON pastor_sharing_settings
  FOR UPDATE USING (
    auth.uid() = user_id OR 
    auth.jwt() ->> 'email' = user_email
  ) WITH CHECK (
    auth.uid() = user_id OR 
    auth.jwt() ->> 'email' = user_email
  );

-- Users can delete their own sharing settings
CREATE POLICY "Users can delete own sharing settings" ON pastor_sharing_settings
  FOR DELETE USING (
    auth.uid() = user_id OR 
    auth.jwt() ->> 'email' = user_email
  );

-- Service role can do everything (for Edge Functions)
CREATE POLICY "Service role full access" ON pastor_sharing_settings
  FOR ALL USING (auth.role() = 'service_role');

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_pastor_sharing_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_pastor_sharing_settings_updated_at
  BEFORE UPDATE ON pastor_sharing_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_pastor_sharing_settings_updated_at();
