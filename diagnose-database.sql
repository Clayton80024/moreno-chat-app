-- Comprehensive Database Diagnostic
-- This will find ALL triggers, constraints, and issues

-- Step 1: Find ALL triggers on auth.users table
SELECT 
    trigger_name,
    event_manipulation,
    action_timing,
    action_statement,
    action_orientation
FROM information_schema.triggers 
WHERE event_object_table = 'users' 
AND event_object_schema = 'auth';

-- Step 2: Find ALL functions that might be related
SELECT 
    routine_name,
    routine_type,
    routine_definition
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND (routine_name LIKE '%user%' OR routine_name LIKE '%auth%' OR routine_name LIKE '%profile%');

-- Step 3: Check for constraints on auth.users table
SELECT 
    tc.constraint_name,
    tc.constraint_type,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
LEFT JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.table_name = 'users' 
AND tc.table_schema = 'auth';

-- Step 4: Check for any custom functions in auth schema
SELECT 
    routine_name,
    routine_type
FROM information_schema.routines 
WHERE routine_schema = 'auth';

-- Step 5: Check if there are any other triggers we missed
SELECT 
    trigger_schema,
    trigger_name,
    event_object_table,
    event_object_schema,
    action_statement
FROM information_schema.triggers 
WHERE action_statement LIKE '%user_profiles%' 
OR action_statement LIKE '%handle_new_user%'
OR action_statement LIKE '%profile%';

-- Step 6: Check for any policies on auth.users (shouldn't exist but let's check)
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE schemaname = 'auth' 
AND tablename = 'users';

-- Step 7: Test if we can manually insert into auth.users (this will help identify the issue)
-- Note: This might fail, but the error message will be helpful
DO $$
DECLARE
    test_email TEXT := 'test_' || extract(epoch from now()) || '@example.com';
BEGIN
    RAISE NOTICE 'Testing manual insert into auth.users...';
    RAISE NOTICE 'Test email: %', test_email;
    
    -- This will likely fail, but we'll see the exact error
    INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, created_at, updated_at, raw_user_meta_data)
    VALUES (
        gen_random_uuid(),
        test_email,
        crypt('password123', gen_salt('bf')),
        NOW(),
        NOW(),
        NOW(),
        '{"full_name": "Test User"}'::jsonb
    );
    
    RAISE NOTICE '✅ Manual insert successful!';
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE WARNING '❌ Manual insert failed: %', SQLERRM;
        RAISE WARNING '❌ Error code: %', SQLSTATE;
END $$;
