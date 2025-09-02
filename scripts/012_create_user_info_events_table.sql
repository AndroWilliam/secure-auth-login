-- Create user_info_events table for centralized user data storage
-- This table stores all user information events with proper hashing for sensitive data

CREATE TABLE IF NOT EXISTS user_info_events (
  event_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  event_type VARCHAR(50) NOT NULL, -- 'signup', 'login', 'profile_update', etc.
  event_data JSONB NOT NULL, -- Non-sensitive data (email, display_name, etc.)
  hashed_data JSONB, -- Hashed sensitive data (password_hash, otp_hash, etc.)
  ip_address INET,
  user_agent TEXT,
  location_data JSONB, -- Geolocation, country, city, etc.
  device_info JSONB, -- Device fingerprint, browser info, etc.
  security_score INTEGER DEFAULT 0, -- Security assessment score
  risk_factors JSONB, -- Array of risk factors identified
  metadata JSONB, -- Additional metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_user_info_events_user_id ON user_info_events(user_id);
CREATE INDEX IF NOT EXISTS idx_user_info_events_event_type ON user_info_events(event_type);
CREATE INDEX IF NOT EXISTS idx_user_info_events_created_at ON user_info_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_info_events_user_event ON user_info_events(user_id, event_type);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_user_info_events_updated_at 
    BEFORE UPDATE ON user_info_events 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS (Row Level Security)
ALTER TABLE user_info_events ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Users can only access their own events
CREATE POLICY "Users can view own events" ON user_info_events
    FOR SELECT USING (auth.uid() = user_id);

-- Service role can access all events (for admin/system operations)
CREATE POLICY "Service role full access" ON user_info_events
    FOR ALL USING (auth.role() = 'service_role');

-- Insert policy for authenticated users
CREATE POLICY "Users can insert own events" ON user_info_events
    FOR INSERT WITH CHECK (auth.uid() = user_id);
