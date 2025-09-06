-- Disable RLS for Development/Testing
-- Run this to remove Row Level Security from all tables

-- Disable RLS on user_profiles
ALTER TABLE public.user_profiles DISABLE ROW LEVEL SECURITY;

-- Disable RLS on user_presence  
ALTER TABLE public.user_presence DISABLE ROW LEVEL SECURITY;

-- Disable RLS on friends
ALTER TABLE public.friends DISABLE ROW LEVEL SECURITY;

-- Disable RLS on friend_requests
ALTER TABLE public.friend_requests DISABLE ROW LEVEL SECURITY;

-- Disable RLS on chats
ALTER TABLE public.chats DISABLE ROW LEVEL SECURITY;

-- Disable RLS on chat_participants
ALTER TABLE public.chat_participants DISABLE ROW LEVEL SECURITY;

-- Disable RLS on messages
ALTER TABLE public.messages DISABLE ROW LEVEL SECURITY;

-- Disable RLS on message_status
ALTER TABLE public.message_status DISABLE ROW LEVEL SECURITY;

-- Verify RLS is disabled
SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('user_profiles', 'user_presence', 'friends', 'friend_requests', 'chats', 'chat_participants', 'messages', 'message_status')
ORDER BY tablename;

-- Success message
DO $$
BEGIN
    RAISE NOTICE '✅ RLS disabled on all tables';
    RAISE NOTICE '🚀 You can now test signup without permission issues';
    RAISE NOTICE '⚠️ Remember to re-enable RLS before production!';
END $$;
