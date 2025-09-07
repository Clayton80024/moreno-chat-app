import { useState, useEffect, useRef } from 'react';
import { TranslationService } from '@/lib/translationService';
import { getLanguageFromCountry } from '@/lib/translation';

interface UseTranslationOptions {
  enabled?: boolean;
  debounceTime?: number;
}

export function useTranslation(
  text: string,
  senderCountry: string,
  receiverCountry: string,
  options?: UseTranslationOptions
) {
  const { enabled = true, debounceTime = 300 } = options || {};
  const [translation, setTranslation] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Check if translation is needed
  const needsTranslation = () => {
    if (!enabled || !text?.trim()) return false;
    
    const senderLang = getLanguageFromCountry(senderCountry);
    const receiverLang = getLanguageFromCountry(receiverCountry);
    
    const shouldTranslate = senderLang !== receiverLang;
    
    console.log('🔍 Translation Hook Debug:', {
      text: text.substring(0, Math.min(text.length, 50)) + (text.length > 50 ? '...' : ''),
      senderCountry,
      receiverCountry,
      senderLang,
      receiverLang,
      shouldTranslate,
      enabled
    });
    
    return shouldTranslate;
  };

  // Translate text
  const translateText = async () => {
    if (!needsTranslation()) {
      setTranslation('');
      setIsLoading(false);
      setError(null);
      return;
    }

    setIsLoading(true);
    setError(null);
    setTranslation(''); // Clear previous translation

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
        // Request was intentionally aborted, no error to report
        return;
      }
      console.error('🔴 Translation hook error:', err);
      setError(err.message || 'Failed to translate message.');
      setTranslation(text); // Fallback to original text on error
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    if (enabled && text?.trim() && needsTranslation()) {
      setIsLoading(true); // Show loading immediately
      debounceRef.current = setTimeout(() => {
        translateText();
      }, debounceTime);
    } else {
      setTranslation('');
      setIsLoading(false);
      setError(null);
    }

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [text, senderCountry, receiverCountry, enabled, debounceTime]);

  return { translation, isLoading, error };
}

