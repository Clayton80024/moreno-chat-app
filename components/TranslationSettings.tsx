import React, { useState } from 'react';
import { TranslationCommandParser } from '@/lib/translationCommands';
import { 
  LanguageIcon, 
  XMarkIcon,
  CheckIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';

interface TranslationSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function TranslationSettingsModal({ isOpen, onClose }: TranslationSettingsModalProps) {
  const [showHelp, setShowHelp] = useState(false);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-2">
            <LanguageIcon className="w-6 h-6 text-primary-600" />
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              Translation Commands
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <XMarkIcon className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Commands Help */}
          <div>
            <button
              onClick={() => setShowHelp(!showHelp)}
              className="flex items-center space-x-2 text-sm font-medium text-primary-600 hover:text-primary-700 transition-colors"
            >
              <span>View Translation Commands</span>
            </button>
            
            {showHelp && (
              <div className="mt-3 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <pre className="text-xs text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                  {TranslationCommandParser.getHelpText()}
                </pre>
              </div>
            )}
          </div>

          {/* Performance Notice */}
          <div className="flex items-start space-x-3 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <ExclamationTriangleIcon className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-800 dark:text-blue-200">
              <div className="font-medium mb-1">How Translation Works</div>
              <div>
                Translation is manual only for maximum performance. Use commands like{' '}
                <code className="bg-blue-100 dark:bg-blue-800 px-1 rounded">#translate "text" to Spanish</code>{' '}
                when you need translation.
              </div>
            </div>
          </div>

          {/* Status */}
          <div className="flex items-center space-x-2 text-xs text-gray-500 dark:text-gray-400 pt-4 border-t border-gray-200 dark:border-gray-700">
            <CheckIcon className="w-4 h-4" />
            <span>Manual translation mode - Fastest performance</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// Quick translation command input component
interface QuickTranslateProps {
  onSendMessage: (message: string) => void;
  disabled?: boolean;
}

export function QuickTranslate({ onSendMessage, disabled }: QuickTranslateProps) {
  const [text, setText] = useState('');
  const [targetLang, setTargetLang] = useState('es');

  const handleTranslate = () => {
    if (text.trim()) {
      const command = `#translate "${text.trim()}" to ${targetLang}`;
      onSendMessage(command);
      setText('');
    }
  };

  const languages = [
    { code: 'es', name: 'Spanish' },
    { code: 'pt', name: 'Portuguese' },
    { code: 'fr', name: 'French' },
    { code: 'de', name: 'German' },
    { code: 'it', name: 'Italian' },
    { code: 'zh', name: 'Chinese' },
    { code: 'ja', name: 'Japanese' },
    { code: 'ko', name: 'Korean' },
    { code: 'ar', name: 'Arabic' },
    { code: 'hi', name: 'Hindi' },
    { code: 'ru', name: 'Russian' },
  ];

  return (
    <div className="p-3 bg-gray-50 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
      <div className="flex items-center space-x-2">
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Text to translate..."
          className="flex-1 px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
          disabled={disabled}
        />
        
        <select
          value={targetLang}
          onChange={(e) => setTargetLang(e.target.value)}
          className="px-2 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
          disabled={disabled}
        >
          {languages.map(lang => (
            <option key={lang.code} value={lang.code}>
              {lang.name}
            </option>
          ))}
        </select>
        
        <button
          onClick={handleTranslate}
          disabled={disabled || !text.trim()}
          className="px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          Translate
        </button>
      </div>
      
      <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
        💡 Tip: Use <code className="bg-gray-200 dark:bg-gray-600 px-1 rounded">#help</code> to see all translation commands
      </div>
    </div>
  );
}