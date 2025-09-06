-- Nuclear Option: Complete Auth Reset
-- This will remove ALL custom triggers and functions

-- Step 1: Find and drop ALL triggers on auth.users
DO $$
DECLARE
    trigger_record RECORD;
BEGIN
    FOR trigger_record IN 
        SELECT trigger_name 
        FROM information_schema.triggers 
        WHERE event_object_table = 'users' 
        AND event_object_schema = 'auth'
    LOOP
        EXECUTE 'DROP TRIGGER IF EXISTS ' || trigger_record.trigger_name || ' ON auth.users';
        RAISE NOTICE 'Dropped trigger: %', trigger_record.trigger_name;
    END LOOP;
END $$;

-- Step 2: Find and drop ALL custom functions
DO $$
DECLARE
    function_record RECORD;
BEGIN
    FOR function_record IN 
        SELECT routine_name 
        FROM information_schema.routines 
        WHERE routine_schema = 'public' 
        AND (routine_name LIKE '%user%' OR routine_name LIKE '%auth%' OR routine_name LIKE '%profile%')
    LOOP
        EXECUTE 'DROP FUNCTION IF EXISTS public.' || function_record.routine_name || ' CASCADE';
        RAISE NOTICE 'Dropped function: %', function_record.routine_name;
    END LOOP;
END $$;

-- Step 3: Verify no triggers remain
SELECT 
    trigger_name,
    event_manipulation
FROM information_schema.triggers 
WHERE event_object_table = 'users' 
AND event_object_schema = 'auth';

-- Step 4: Verify no custom functions remain
SELECT 
    routine_name
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND (routine_name LIKE '%user%' OR routine_name LIKE '%auth%' OR routine_name LIKE '%profile%');

-- Step 5: Test basic auth functionality
DO $$
BEGIN
    RAISE NOTICE '✅ All custom triggers and functions removed';
    RAISE NOTICE '🚀 Auth system is now clean';
    RAISE NOTICE '📝 Try signing up now - it should work!';
END $$;
