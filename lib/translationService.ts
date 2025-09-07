// Secure translation service with error handling and caching
interface TranslationResponse {
  translatedText: string;
  detectedSourceLanguage?: string;
}

interface TranslationCache {
  [key: string]: {
    translation: string;
    timestamp: number;
    expiresAt: number;
  };
}

class TranslationService {
  private static cache: TranslationCache = {};
  private static readonly CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours
  private static readonly MAX_CACHE_SIZE = 1000; // Prevent memory leaks
  
  // Secure API key - in production, this should be in environment variables
  private static readonly API_KEY = process.env.NEXT_PUBLIC_GOOGLE_TRANSLATE_API_KEY || '';
  private static readonly API_URL = 'https://translation.googleapis.com/language/translate/v2';

  /**
   * Translate text from source language to target language
   * @param text - Text to translate
   * @param targetLanguage - Target language code (e.g., 'pt', 'es', 'fr')
   * @param sourceLanguage - Source language code (optional, auto-detect if not provided)
   * @param signal - AbortSignal for cancelling the request
   * @returns Promise<string> - Translated text
   */
  static async translate(
    text: string, 
    targetLanguage: string, 
    sourceLanguage?: string,
    signal?: AbortSignal
  ): Promise<string> {
    try {
      // Input validation
      if (!text || !text.trim()) {
        throw new Error('Text to translate cannot be empty');
      }
      
      if (!targetLanguage) {
        throw new Error('Target language is required');
      }

      // Check cache first
      const cacheKey = TranslationService.getCacheKey(text, targetLanguage, sourceLanguage);
      const cachedTranslation = TranslationService.getCachedTranslation(cacheKey);
      
      if (cachedTranslation) {
        console.log('🌐 Translation served from cache');
        return cachedTranslation;
      }

      // Validate API key
      if (!TranslationService.API_KEY) {
        console.warn('⚠️ Google Translate API key not configured');
        console.log('🔍 API Key Debug:', {
          hasKey: !!TranslationService.API_KEY,
          keyLength: TranslationService.API_KEY?.length || 0,
          keyStart: TranslationService.API_KEY?.substring(0, 10) || 'none'
        });
        return text; // Return original text if no API key
      }

      // Prepare API request
      const requestBody = {
        q: text,
        target: targetLanguage,
        format: 'text',
        ...(sourceLanguage && { source: sourceLanguage })
      };

      console.log('🌐 Translating text:', { text: text.substring(0, 50) + '...', targetLanguage });

      // Make API call
      const response = await fetch(`${TranslationService.API_URL}?key=${TranslationService.API_KEY}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
        signal,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`Translation API error: ${response.status} - ${errorData.error?.message || 'Unknown error'}`);
      }

      const data = await response.json();
      
      if (!data.data?.translations?.[0]?.translatedText) {
        throw new Error('Invalid translation response');
      }

      const translatedText = data.data.translations[0].translatedText;
      
      // Cache the translation
      TranslationService.cacheTranslation(cacheKey, translatedText);
      
      console.log('✅ Translation successful:', translatedText.substring(0, 50) + '...');
      return translatedText;

    } catch (error) {
      console.error('🔴 Translation error:', error);
      
      // Return original text on error (graceful degradation)
      return text;
    }
  }

  /**
   * Batch translate multiple texts
   * @param texts - Array of texts to translate
   * @param targetLanguage - Target language code
   * @param sourceLanguage - Source language code (optional)
   * @returns Promise<string[]> - Array of translated texts
   */
  async translateBatch(
    texts: string[], 
    targetLanguage: string, 
    sourceLanguage?: string
  ): Promise<string[]> {
    try {
      const promises = texts.map(text => 
        TranslationService.translate(text, targetLanguage, sourceLanguage)
      );
      
      return await Promise.all(promises);
    } catch (error) {
      console.error('🔴 Batch translation error:', error);
      return texts; // Return original texts on error
    }
  }

  /**
   * Detect the language of the given text
   * @param text - Text to analyze
   * @returns Promise<string> - Detected language code
   */
  async detectLanguage(text: string): Promise<string> {
    try {
      if (!TranslationService.API_KEY) {
        return 'en'; // Default to English if no API key
      }

      const response = await fetch(`${TranslationService.API_URL}/detect?key=${TranslationService.API_KEY}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ q: text }),
      });

      if (!response.ok) {
        throw new Error(`Language detection API error: ${response.status}`);
      }

      const data = await response.json();
      return data.data?.detections?.[0]?.[0]?.language || 'en';
      
    } catch (error) {
      console.error('🔴 Language detection error:', error);
      return 'en'; // Default to English on error
    }
  }

  /**
   * Get cached translation if available and not expired
   */
  private static getCachedTranslation(cacheKey: string): string | null {
    const cached = TranslationService.cache[cacheKey];
    
    if (cached && Date.now() < cached.expiresAt) {
      return cached.translation;
    }
    
    // Remove expired entry
    if (cached) {
      delete TranslationService.cache[cacheKey];
    }
    
    return null;
  }

  /**
   * Cache translation result
   */
  private static cacheTranslation(cacheKey: string, translation: string): void {
    // Prevent cache from growing too large
    if (Object.keys(TranslationService.cache).length >= TranslationService.MAX_CACHE_SIZE) {
      TranslationService.cleanExpiredCache();
      
      // If still too large, remove oldest entries
      if (Object.keys(TranslationService.cache).length >= TranslationService.MAX_CACHE_SIZE) {
        const entries = Object.entries(TranslationService.cache);
        entries.sort((a, b) => a[1].timestamp - b[1].timestamp);
        
        // Remove oldest 20% of entries
        const toRemove = Math.floor(entries.length * 0.2);
        for (let i = 0; i < toRemove; i++) {
          delete TranslationService.cache[entries[i][0]];
        }
      }
    }

    TranslationService.cache[cacheKey] = {
      translation,
      timestamp: Date.now(),
      expiresAt: Date.now() + TranslationService.CACHE_DURATION
    };
  }

  /**
   * Generate cache key for translation
   */
  private static getCacheKey(text: string, targetLanguage: string, sourceLanguage?: string): string {
    return `${text.toLowerCase()}_${targetLanguage}_${sourceLanguage || 'auto'}`;
  }

  /**
   * Clean expired cache entries
   */
  private static cleanExpiredCache(): void {
    const now = Date.now();
    Object.keys(TranslationService.cache).forEach(key => {
      if (TranslationService.cache[key].expiresAt < now) {
        delete TranslationService.cache[key];
      }
    });
  }

  /**
   * Get cache statistics (for debugging)
   */
  static getCacheStats(): { size: number; entries: string[] } {
    return {
      size: Object.keys(TranslationService.cache).length,
      entries: Object.keys(TranslationService.cache)
    };
  }

  /**
   * Clear all cached translations
   */
  static clearCache(): void {
    TranslationService.cache = {};
  }
}

// Export the TranslationService class
export { TranslationService };

// Export types for use in components
export type { TranslationResponse };
