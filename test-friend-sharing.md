# Friend Sharing Feature Test Guide

## How to Test the Friend Sharing Feature

### Prerequisites
1. Make sure you have friends in your account (accepted friend requests)
2. Make sure you're in a chat conversation

### Testing Steps

#### Step 1: Trigger Friend Suggestions
1. In the chat input field, type: `@friends`
2. You should see a dropdown appear with your friends list
3. The dropdown should show:
   - Friend avatars (or initials if no avatar)
   - Friend names
   - Usernames (if different from full name)
   - "Share a friend:" header

#### Step 2: Select a Friend
1. Click on any friend from the dropdown
2. The `@friends` should be replaced with `@[friendname]`
3. The dropdown should disappear
4. You can continue typing your message

#### Step 3: Send the Message
1. Complete your message (e.g., "Hey, you should meet @john!")
2. Press Enter or click Send
3. The message should appear in the chat

#### Step 4: Verify Message Rendering
1. The friend mention should be highlighted differently
2. For your own messages: mentions should have light purple background
3. For received messages: mentions should have purple text with light background
4. Mentions should be clickable (future enhancement)

### Expected Behavior

#### Input Handling
- ✅ Typing `@friends` shows friend suggestions
- ✅ Typing `#food` still shows emoji suggestions (should work alongside)
- ✅ Only one suggestion type shows at a time
- ✅ Suggestions disappear when you delete the trigger

#### Friend Selection
- ✅ Clicking a friend replaces `@friends` with `@[friendname]`
- ✅ Friend name uses username if available, otherwise full name
- ✅ Dropdown closes after selection
- ✅ Cursor position is maintained correctly

#### Message Rendering
- ✅ Friend mentions are visually distinct
- ✅ Mentions work in both sent and received messages
- ✅ Multiple mentions in one message work
- ✅ Regular text and mentions render together properly

### Troubleshooting

#### If friend suggestions don't appear:
1. Check if you have accepted friends
2. Check browser console for errors
3. Verify the `useFriends` hook is working

#### If mentions don't render properly:
1. Check if the message contains `@` symbols
2. Verify the regex pattern is working
3. Check browser console for errors

#### If dropdown doesn't close:
1. Check if `handleFriendSelect` is being called
2. Verify state updates are working
3. Check for JavaScript errors

### Test Cases

#### Basic Functionality
- [ ] Type `@friends` → see dropdown
- [ ] Click friend → see mention inserted
- [ ] Send message → see highlighted mention

#### Edge Cases
- [ ] No friends → no dropdown appears
- [ ] Empty friend list → no dropdown appears
- [ ] Multiple mentions in one message
- [ ] Mentions at beginning/end of message
- [ ] Very long friend names

#### Integration
- [ ] Works with emoji suggestions
- [ ] Works with existing chat features
- [ ] Works in different chat types (direct/group)
- [ ] Works on mobile and desktop

### Success Criteria
✅ All basic functionality works
✅ No JavaScript errors in console
✅ UI is responsive and intuitive
✅ Mentions are visually clear
✅ Performance is acceptable
