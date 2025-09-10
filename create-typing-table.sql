-- Create typing_indicators table for real-time typing indicators
CREATE TABLE IF NOT EXISTS public.typing_indicators (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  chat_id UUID NOT NULL REFERENCES public.chats(id) ON DELETE CASCADE,
  is_typing BOOLEAN NOT NULL DEFAULT false,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Ensure one typing indicator per user per chat
  UNIQUE(user_id, chat_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_typing_indicators_chat_id ON public.typing_indicators(chat_id);
CREATE INDEX IF NOT EXISTS idx_typing_indicators_user_id ON public.typing_indicators(user_id);
CREATE INDEX IF NOT EXISTS idx_typing_indicators_timestamp ON public.typing_indicators(timestamp);
CREATE INDEX IF NOT EXISTS idx_typing_indicators_is_typing ON public.typing_indicators(is_typing);

-- Enable Row Level Security
ALTER TABLE public.typing_indicators ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Users can insert/update their own typing indicators for chats they participate in
CREATE POLICY "Users can manage their own typing indicators" ON public.typing_indicators
  FOR ALL USING (
    auth.uid() = user_id AND
    EXISTS (
      SELECT 1 FROM public.chat_participants cp
      WHERE cp.chat_id = typing_indicators.chat_id
      AND cp.user_id = auth.uid()
    )
  );

-- Users can view typing indicators for chats they participate in
CREATE POLICY "Users can view typing indicators in their chats" ON public.typing_indicators
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.chat_participants cp
      WHERE cp.chat_id = typing_indicators.chat_id
      AND cp.user_id = auth.uid()
    )
  );

-- Create function to automatically clean up old typing indicators
CREATE OR REPLACE FUNCTION cleanup_old_typing_indicators()
RETURNS void AS $$
BEGIN
  -- Delete typing indicators older than 10 seconds
  DELETE FROM public.typing_indicators 
  WHERE timestamp < NOW() - INTERVAL '10 seconds';
END;
$$ LANGUAGE plpgsql;

-- Create a trigger to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_typing_indicators_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_typing_indicators_updated_at ON public.typing_indicators;
CREATE TRIGGER trigger_update_typing_indicators_updated_at
  BEFORE UPDATE ON public.typing_indicators
  FOR EACH ROW
  EXECUTE FUNCTION update_typing_indicators_updated_at();

-- Optional: Create a scheduled job to clean up old indicators (if using pg_cron)
-- This would run every 30 seconds to clean up old typing indicators
-- CREATE EXTENSION IF NOT EXISTS pg_cron;
-- SELECT cron.schedule('cleanup-typing-indicators', '*/30 * * * * *', 'SELECT cleanup_old_typing_indicators();');

-- Grant necessary permissions
GRANT ALL ON public.typing_indicators TO authenticated;
GRANT ALL ON public.typing_indicators TO service_role;
