// Translation Command System for Real-time Chat
// This system allows users to control when translations happen, making chat faster

export interface TranslationCommand {
  type: 'translate' | 'help';
  text?: string;
  targetLanguage?: string;
  sourceLanguage?: string;
}

export interface TranslationSettings {
  // Simplified - no auto-translate or mode settings needed
  defaultTargetLanguage?: string;
}

// Command patterns
const COMMAND_PATTERNS = {
  // #translate "text" to language
  translate: /^#translate\s+"([^"]+)"\s+to\s+(\w+)$/i,
  
  // #t "text" to language (short form)
  translateShort: /^#t\s+"([^"]+)"\s+to\s+(\w+)$/i,
  
  // #help
  help: /^#help$/i,
};

// Language name to code mapping
const LANGUAGE_MAP: Record<string, string> = {
  'english': 'en',
  'spanish': 'es', 
  'portuguese': 'pt',
  'french': 'fr',
  'german': 'de',
  'italian': 'it',
  'chinese': 'zh',
  'japanese': 'ja',
  'korean': 'ko',
  'arabic': 'ar',
  'hindi': 'hi',
  'russian': 'ru',
  'dutch': 'nl',
  'polish': 'pl',
  'thai': 'th',
  'vietnamese': 'vi',
};

export class TranslationCommandParser {
  /**
   * Parse a message to check if it's a translation command
   */
  static parseCommand(message: string): TranslationCommand | null {
    const trimmedMessage = message.trim();
    
    // Check each pattern
    for (const [type, pattern] of Object.entries(COMMAND_PATTERNS)) {
      const match = trimmedMessage.match(pattern);
      if (match) {
        switch (type) {
          case 'translate':
          case 'translateShort':
            return {
              type: 'translate',
              text: match[1],
              targetLanguage: this.normalizeLanguage(match[2])
            };
            
          case 'help':
            return {
              type: 'help'
            };
        }
      }
    }
    
    return null;
  }
  
  /**
   * Check if a message is a translation command
   */
  static isCommand(message: string): boolean {
    return this.parseCommand(message) !== null;
  }
  
  /**
   * Normalize language name to language code
   */
  private static normalizeLanguage(language: string): string {
    const normalized = language.toLowerCase();
    return LANGUAGE_MAP[normalized] || normalized;
  }
  
  /**
   * Get help text for translation commands
   */
  static getHelpText(): string {
    return `
🌐 Translation Commands:

#translate "text" to language
#t "text" to language
  • Translate specific text to a language
  • Example: #translate "Hello" to Spanish

#help
  • Show this help message

Supported languages: English, Spanish, Portuguese, French, German, Italian, Chinese, Japanese, Korean, Arabic, Hindi, Russian, Dutch, Polish, Thai, Vietnamese
    `.trim();
  }
}

// Translation settings management
export class TranslationSettingsManager {
  private static readonly STORAGE_KEY = 'translation_settings';
  
  /**
   * Get current translation settings
   */
  static getSettings(): TranslationSettings {
    if (typeof window === 'undefined') {
      return {};
    }
    
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (error) {
      console.error('Error loading translation settings:', error);
    }
    
    return {};
  }
  
  /**
   * Update translation settings
   */
  static updateSettings(settings: Partial<TranslationSettings>): void {
    if (typeof window === 'undefined') return;
    
    try {
      const current = this.getSettings();
      const updated = { ...current, ...settings };
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(updated));
    } catch (error) {
      console.error('Error saving translation settings:', error);
    }
  }
  
  /**
   * Reset settings to default
   */
  static resetSettings(): void {
    if (typeof window === 'undefined') return;
    
    try {
      localStorage.removeItem(this.STORAGE_KEY);
    } catch (error) {
      console.error('Error resetting translation settings:', error);
    }
  }
}

// Message processing utilities
export class MessageProcessor {
  /**
   * Process a message and determine if it should be translated
   * Simplified: Only translate via commands, no automatic translation
   */
  static shouldTranslate(
    message: string,
    senderCountry: string,
    receiverCountry: string,
    settings: TranslationSettings
  ): boolean {
    // Check if it's a command first
    if (TranslationCommandParser.isCommand(message)) {
      return false; // Commands shouldn't be translated
    }
    
    // Simplified: No automatic translation, only manual commands
    return false;
  }
  
  /**
   * Check if translation is needed based on countries
   */
  private static needsTranslation(senderCountry: string, receiverCountry: string): boolean {
    const senderLang = this.getLanguageFromCountry(senderCountry);
    const receiverLang = this.getLanguageFromCountry(receiverCountry);
    return senderLang !== receiverLang;
  }
  
  /**
   * Get language code from country
   */
  private static getLanguageFromCountry(country: string): string {
    // This should match your existing country-to-language mapping
    const countryLanguageMap: Record<string, string> = {
      'Canada': 'en',
      'United States': 'en',
      'Mexico': 'es',
      'Brazil': 'pt',
      'Argentina': 'es',
      'Chile': 'es',
      'Colombia': 'es',
      'Peru': 'es',
      'Venezuela': 'es',
      'France': 'fr',
      'Germany': 'de',
      'Italy': 'it',
      'Spain': 'es',
      'United Kingdom': 'en',
      'Netherlands': 'nl',
      'Poland': 'pl',
      'Russia': 'ru',
      'China': 'zh',
      'Japan': 'ja',
      'South Korea': 'ko',
      'India': 'hi',
      'Thailand': 'th',
      'Vietnam': 'vi',
      'Saudi Arabia': 'ar',
      'Egypt': 'ar',
      'South Africa': 'en',
      'Nigeria': 'en',
      'Australia': 'en',
      'New Zealand': 'en',
    };
    
    return countryLanguageMap[country] || 'en';
  }
}

export { LANGUAGE_MAP };
