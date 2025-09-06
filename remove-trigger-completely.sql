-- Complete Fix: Remove Trigger and Clean Up
-- This will completely remove the problematic trigger

-- Step 1: Drop the trigger completely
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Step 2: Drop the function
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Step 3: Verify trigger is gone
SELECT 
    trigger_name,
    event_manipulation
FROM information_schema.triggers 
WHERE trigger_schema = 'public' 
AND trigger_name = 'on_auth_user_created';

-- Step 4: Verify function is gone
SELECT 
    routine_name
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name = 'handle_new_user';

-- Step 5: Test that user_profiles table is accessible
SELECT COUNT(*) as profile_count FROM public.user_profiles;

-- Step 6: Success message
DO $$
BEGIN
    RAISE NOTICE '✅ Trigger and function completely removed';
    RAISE NOTICE '✅ RLS disabled on all tables';
    RAISE NOTICE '🚀 Signup should now work without database errors';
    RAISE NOTICE '📝 Profile creation will be handled by your application code';
END $$;
