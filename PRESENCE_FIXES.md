# User Presence System Fixes

## 🐛 Issues Fixed

### 1. **Missing Initial Online Friends Loading**
- **Problem**: App never loaded who was already online when starting up
- **Fix**: Added `loadOnlineFriends()` function that fetches current online friends from database
- **Impact**: Users now see friends who are already online immediately upon login

### 1.1. **Database Relationship Error (Fixed)**
- **Problem**: `getOnlineFriends()` was using complex foreign key relationships that didn't exist
- **Error**: "Could not find a relationship between 'friends' and 'user_profiles' in the schema cache"
- **Fix**: Rewrote the function to use separate queries instead of complex joins
- **Impact**: Function now works reliably without database relationship dependencies

### 2. **Incorrect Initialization Order**
- **Problem**: Presence tracking started before friends were loaded
- **Fix**: Reordered initialization to load friends first, then online friends, then set up subscriptions
- **Impact**: Presence system now has friend data available when subscriptions start

### 3. **Unfiltered Real-time Subscriptions**
- **Problem**: Presence subscription listened to ALL users, not just friends
- **Fix**: Added friend validation in presence update callback
- **Impact**: Only processes presence updates for actual friends, improving performance

### 4. **Missing Friend Validation**
- **Problem**: Any user's presence change would update online friends list
- **Fix**: Added `isFriend` check before updating online friends list
- **Impact**: Prevents non-friends from appearing in online friends list

### 5. **No Refresh Mechanism**
- **Problem**: No way to manually refresh online friends if needed
- **Fix**: Added `refreshOnlineFriends()` function to context
- **Impact**: Provides manual refresh capability for debugging/recovery

## 🔧 Changes Made

### RealtimeContext.tsx

1. **Added `loadOnlineFriends()` function**:
   ```typescript
   const loadOnlineFriends = async () => {
     if (!user) return;
     
     try {
       console.log('🔵 Loading initial online friends...');
       const onlineFriends = await PresenceService.getOnlineFriends(user.id);
       const friendIds = onlineFriends.map(friend => friend.id);
       setOnlineFriends(friendIds);
       console.log('✅ Loaded online friends:', friendIds.length, 'friends online');
     } catch (error) {
       console.error('🔴 Error loading online friends:', error);
       console.log('🔵 Falling back to empty online friends list');
       setOnlineFriends([]);
       // Don't throw the error - let the app continue without online friends
       // The real-time subscription will still work for future updates
     }
   };
   ```

1.1. **Fixed `PresenceService.getOnlineFriends()` function**:
   ```typescript
   // OLD: Complex foreign key relationship (caused errors)
   .select(`
     friend_id,
     friend_profile:user_profiles!friends_friend_id_fkey(...),
     presence:user_presence!friends_friend_id_fkey(...)
   `)

   // NEW: Separate queries (reliable)
   // 1. Get friends
   const { data: friends } = await supabase
     .from('friends')
     .select('friend_id')
     .eq('user_id', userId)
     .eq('status', 'accepted');

   // 2. Get presence data
   const { data: presenceData } = await supabase
     .from('user_presence')
     .select('user_id, status, last_seen')
     .in('user_id', friendIds)
     .eq('status', 'online');

   // 3. Get profiles
   const { data: profiles } = await supabase
     .from('user_profiles')
     .select('id, full_name, username, avatar_url, is_online, last_seen')
     .in('id', onlineFriendIds);
   ```

2. **Fixed initialization order**:
   ```typescript
   const initializeRealtime = async () => {
     // 1. Load friends first (needed for presence filtering)
     await loadFriends();
     
     // 2. Load other data in parallel
     await Promise.all([
       loadChats(),
       loadFriendRequests(),
       loadUserPresence()
     ]);
     
     // 3. Load online friends after friends are loaded
     await loadOnlineFriends();

     // 4. Set up subscriptions (now with friend data available)
     await setupSubscriptions();
   };
   ```

3. **Added friend validation in presence updates**:
   ```typescript
   const presenceChannel = supabase
     .channel('friends_presence')
     .on('postgres_changes', {
       event: '*',
       schema: 'public',
       table: 'user_presence'
     }, async (payload) => {
       const presence = payload.new as UserPresence;
       
       // Validate that this user is actually a friend before updating
       const isFriend = friends.some(friend => friend.friend_id === presence.user_id);
       
       if (isFriend) {
         // Update online friends list
         if (presence.status === 'online') {
           setOnlineFriends(prev => [...new Set([...prev, presence.user_id])]);
         } else {
           setOnlineFriends(prev => prev.filter(id => id !== presence.user_id));
         }
       }
     })
   ```

4. **Added refresh function**:
   ```typescript
   const refreshOnlineFriends = useCallback(async () => {
     if (!user) return;
     console.log('🔵 Refreshing online friends...');
     await loadOnlineFriends();
   }, [user]);
   ```

5. **Enhanced friends subscription**:
   ```typescript
   // Refresh online friends when friends list changes
   await Promise.all([
     loadChats(),
     loadFriends(),
     loadOnlineFriends() // ← Added this
   ]);
   ```

## 🎯 Expected Results

After these fixes, the presence system should:

1. ✅ **Show online friends immediately** when logging in
2. ✅ **Update in real-time** when friends come online/offline
3. ✅ **Work bidirectionally** - both users see each other's status
4. ✅ **Not require page refresh** to see online status
5. ✅ **Only show actual friends** in online list
6. ✅ **Handle friend additions/removals** properly

## 🧪 Testing

To test the fixes:

1. **Login with two different users** in separate browsers/tabs
2. **Add each other as friends**
3. **Check that both see each other as online** immediately
4. **Close one tab** and verify the other user sees them go offline
5. **Reopen the tab** and verify they appear online again
6. **No page refresh should be needed** for any of these changes

## 📝 Debugging

The fixes include extensive console logging:
- `🔵 Loading friends...` - When friends are being loaded
- `🔵 Loading initial online friends...` - When online friends are being loaded
- `🔵 Friend presence update:` - When a friend's status changes
- `✅ Added friend to online list:` - When a friend comes online
- `✅ Removed friend from online list:` - When a friend goes offline
- `🔵 Ignoring presence update for non-friend:` - When non-friend status changes

Check browser console for these messages to debug any issues.
