-- Temporarily simplify RLS policies for typing_indicators to debug the issue

-- Drop existing policies
DROP POLICY IF EXISTS "Users can manage their own typing indicators" ON public.typing_indicators;
DROP POLICY IF EXISTS "Users can view typing indicators in their chats" ON public.typing_indicators;

-- Create simpler, more permissive policies for debugging
-- Allow users to manage their own typing indicators (no chat_participants check)
CREATE POLICY "Simple: Users can manage their own typing indicators" ON public.typing_indicators
  FOR ALL USING (auth.uid() = user_id);

-- Allow users to view all typing indicators they have access to
CREATE POLICY "Simple: Users can view typing indicators" ON public.typing_indicators
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- Grant permissions
GRANT ALL ON public.typing_indicators TO authenticated;
GRANT ALL ON public.typing_indicators TO service_role;