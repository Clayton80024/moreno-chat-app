import { useState, useEffect, useRef, useCallback } from 'react';
import { TranslationService } from '@/lib/translationService';
import { TranslationCommandParser, TranslationSettingsManager, MessageProcessor } from '@/lib/translationCommands';
import { getLanguageFromCountry } from '@/lib/translation';

interface UseOptimizedTranslationOptions {
  enabled?: boolean;
  senderCountry: string;
  receiverCountry: string;
}

interface TranslationResult {
  translation: string;
  isLoading: boolean;
  error: string | null;
  isCommand: boolean;
  commandResult?: string;
}

export function useOptimizedTranslation(
  text: string,
  options: UseOptimizedTranslationOptions
): TranslationResult {
  const { enabled = true, senderCountry, receiverCountry } = options;
  const [translation, setTranslation] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [commandResult, setCommandResult] = useState<string | undefined>();
  
  const abortControllerRef = useRef<AbortController | null>(null);
  const settings = TranslationSettingsManager.getSettings();

  // Check if message is a command
  const isCommand = TranslationCommandParser.isCommand(text);
  
  // Process command if it's a translation command
  const processCommand = useCallback(async (commandText: string) => {
    const command = TranslationCommandParser.parseCommand(commandText);
    
    if (!command) return;
    
    switch (command.type) {
      case 'translate':
        if (command.text && command.targetLanguage) {
          setIsLoading(true);
          setError(null);
          
          try {
            const translated = await TranslationService.translate(
              command.text,
              command.targetLanguage
            );
            setCommandResult(`🌐 Translation: "${translated}"`);
          } catch (err: any) {
            setError(err.message || 'Failed to translate');
            setCommandResult(`❌ Translation failed: ${err.message}`);
          } finally {
            setIsLoading(false);
          }
        }
        break;
        
      case 'help':
        setCommandResult(TranslationCommandParser.getHelpText());
        break;
    }
  }, []);

  // Translate text based on settings
  const translateText = useCallback(async () => {
    if (!enabled || !text?.trim() || isCommand) {
      setTranslation('');
      setIsLoading(false);
      setError(null);
      return;
    }

    // Check if translation should happen based on settings
    const shouldTranslate = MessageProcessor.shouldTranslate(
      text,
      senderCountry,
      receiverCountry,
      settings
    );

    if (!shouldTranslate) {
      setTranslation('');
      setIsLoading(false);
      setError(null);
      return;
    }

    setIsLoading(true);
    setError(null);
    setTranslation('');

    // Abort any ongoing request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;

    try {
      const senderLang = getLanguageFromCountry(senderCountry);
      const receiverLang = getLanguageFromCountry(receiverCountry);

      if (!senderLang || !receiverLang) {
        throw new Error('Could not determine sender or receiver language from country.');
      }

      const translated = await TranslationService.translate(
        text,
        receiverLang,
        senderLang,
        signal
      );
      setTranslation(translated);
    } catch (err: any) {
      if (err.name === 'AbortError') {
        return;
      }
      console.error('🔴 Translation hook error:', err);
      setError(err.message || 'Failed to translate message.');
      setTranslation(text);
    } finally {
      setIsLoading(false);
    }
  }, [text, senderCountry, receiverCountry, enabled, isCommand, settings]);

  // Handle command processing
  useEffect(() => {
    if (isCommand) {
      processCommand(text);
    } else {
      setCommandResult(undefined);
    }
  }, [isCommand, text, processCommand]);

  // Handle translation
  useEffect(() => {
    if (!isCommand) {
      translateText();
    }
  }, [isCommand, translateText]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  return {
    translation,
    isLoading,
    error,
    isCommand,
    commandResult
  };
}

// Hook for managing translation settings - simplified
export function useTranslationSettings() {
  const [settings, setSettings] = useState(TranslationSettingsManager.getSettings());

  const updateSettings = useCallback((newSettings: Partial<typeof settings>) => {
    TranslationSettingsManager.updateSettings(newSettings);
    setSettings(TranslationSettingsManager.getSettings());
  }, []);

  const resetSettings = useCallback(() => {
    TranslationSettingsManager.resetSettings();
    setSettings(TranslationSettingsManager.getSettings());
  }, []);

  return {
    settings,
    updateSettings,
    resetSettings
  };
}
