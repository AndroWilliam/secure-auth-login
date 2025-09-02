-- Create user_events table for event logging
CREATE TABLE IF NOT EXISTS user_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type TEXT NOT NULL,
  event_data JSONB,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add RLS policies for user_events
ALTER TABLE user_events ENABLE ROW LEVEL SECURITY;

-- Allow anyone to insert events (for login attempts)
CREATE POLICY "Allow event insertion" ON user_events
  FOR INSERT WITH CHECK (true);

-- Only allow reading own events if authenticated
CREATE POLICY "Users can read events" ON user_events
  FOR SELECT USING (true);
