-- Fix RLS policy for typing_indicators table
-- This script updates the existing policy to include chat participation check

-- Drop the existing policy
DROP POLICY IF EXISTS "Users can manage their own typing indicators" ON public.typing_indicators;

-- Create the updated policy with chat participation check
CREATE POLICY "Users can manage their own typing indicators" ON public.typing_indicators
  FOR ALL USING (
    auth.uid() = user_id AND
    EXISTS (
      SELECT 1 FROM public.chat_participants cp
      WHERE cp.chat_id = typing_indicators.chat_id
      AND cp.user_id = auth.uid()
    )
  );

-- Verify the policy was created
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies 
WHERE tablename = 'typing_indicators';
