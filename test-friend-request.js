// Simple test script to check friend request creation
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

// Load environment variables from .env.local
let envContent = '';
try {
  envContent = fs.readFileSync('.env.local', 'utf8');
} catch (err) {
  console.error('❌ Cannot read .env.local file');
  process.exit(1);
}

// Parse environment variables
const envVars = {};
envContent.split('\n').forEach(line => {
  const [key, value] = line.split('=');
  if (key && value) {
    envVars[key.trim()] = value.trim();
  }
});

const supabaseUrl = envVars.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = envVars.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables');
  console.error('URL:', supabaseUrl);
  console.error('Key:', supabaseKey ? 'Present' : 'Missing');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testFriendRequestCreation() {
  console.log('🧪 Testing friend request creation...');
  
  try {
    // Test 1: Check if we can access the friend_requests table
    console.log('📋 Testing table access...');
    const { data: testData, error: testError } = await supabase
      .from('friend_requests')
      .select('*')
      .limit(1);
    
    if (testError) {
      console.error('❌ Cannot access friend_requests table:', testError);
      return;
    }
    
    console.log('✅ Can access friend_requests table');
    
    // Test 2: Try to create a test friend request
    console.log('📝 Testing friend request creation...');
    const testSenderId = 'test-sender-123';
    const testReceiverId = 'test-receiver-456';
    
    const { data, error } = await supabase
      .from('friend_requests')
      .insert({
        sender_id: testSenderId,
        receiver_id: testReceiverId,
        message: 'Test friend request',
        status: 'pending'
      })
      .select()
      .single();
    
    if (error) {
      console.error('❌ Failed to create friend request:', error);
      console.error('Error details:', {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint
      });
    } else {
      console.log('✅ Successfully created friend request:', data);
      
      // Clean up test data
      await supabase
        .from('friend_requests')
        .delete()
        .eq('id', data.id);
      console.log('🧹 Cleaned up test data');
    }
    
  } catch (err) {
    console.error('❌ Test failed with error:', err);
  }
}

testFriendRequestCreation();
