# Translation API Setup Guide

## 🔑 Getting Your Google Translate API Key

### Step 1: Create Google Cloud Project
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable the "Cloud Translation API"

### Step 2: Create API Credentials
1. Go to "APIs & Services" → "Credentials"
2. Click "Create Credentials" → "API Key"
3. Copy your API key
4. (Optional) Restrict the API key to only Cloud Translation API

### Step 3: Configure Environment Variables
Create a `.env.local` file in your project root:

```bash
# Google Translate API Key
NEXT_PUBLIC_GOOGLE_TRANSLATE_API_KEY=your_api_key_here
```

### Step 4: Test the Setup
The translation will work automatically once the API key is configured.

## 💰 Cost Information

- **Google Translate API**: $20 per 1M characters
- **Average message**: ~50 characters
- **Cost per message**: ~$0.001 (less than 1 cent)
- **100 users, 50 messages/day**: ~$150/month

## 🔒 Security Features

✅ **Client-side translation**: No server storage of translations  
✅ **Local caching**: Reduces API calls and costs  
✅ **Error handling**: Graceful fallback to original text  
✅ **Input validation**: Prevents invalid API calls  
✅ **Rate limiting**: Built-in debouncing and caching  

## 🌍 Supported Languages

The system supports 30+ countries with automatic language detection:

- **English**: Canada, USA, UK, Australia, etc.
- **Spanish**: Mexico, Argentina, Chile, Colombia, etc.
- **Portuguese**: Brazil
- **French**: France
- **German**: Germany
- **Chinese**: China
- **Japanese**: Japan
- **Korean**: South Korea
- **Arabic**: Saudi Arabia, Egypt
- **And many more...**

## 🚀 How It Works

1. **User sends message** in their native language
2. **System detects** sender's country from profile
3. **System detects** receiver's country from profile
4. **If different languages**: Automatically translates
5. **Shows both** original and translated text
6. **Caches translation** to reduce API calls

## 🎨 UI Features

- **Original message**: Normal display
- **Translation**: Highlighted with border and background
- **Loading state**: Shows "Translating..." with spinner
- **Error handling**: Shows warning icon if translation fails
- **Language indicator**: Shows "Translated from [Language]"
- **Country flags**: Display sender's country flag

## 🔧 Troubleshooting

### Translation not working?
1. Check if API key is set in `.env.local`
2. Verify API key has Cloud Translation API enabled
3. Check browser console for errors
4. Ensure users have country set in their profiles

### High API costs?
1. Translation is cached for 24 hours
2. Only translates when languages are different
3. Only translates incoming messages (not your own)
4. Consider adding translation toggle for users

### Performance issues?
1. Translations are debounced (300ms delay)
2. Cached translations load instantly
3. Failed translations show original text
4. Batch processing available for multiple messages
