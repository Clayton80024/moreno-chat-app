// Country to language mapping for translation
export interface CountryLanguage {
  country: string;
  language: string;
  languageCode: string;
  flag: string;
}

export const countryLanguageMap: CountryLanguage[] = [
  // North America
  { country: "Canada", language: "English", languageCode: "en", flag: "🇨🇦" },
  { country: "United States", language: "English", languageCode: "en", flag: "🇺🇸" },
  { country: "Mexico", language: "Spanish", languageCode: "es", flag: "🇲🇽" },
  
  // South America
  { country: "Brazil", language: "Portuguese", languageCode: "pt", flag: "🇧🇷" },
  { country: "Argentina", language: "Spanish", languageCode: "es", flag: "🇦🇷" },
  { country: "Chile", language: "Spanish", languageCode: "es", flag: "🇨🇱" },
  { country: "Colombia", language: "Spanish", languageCode: "es", flag: "🇨🇴" },
  { country: "Peru", language: "Spanish", languageCode: "es", flag: "🇵🇪" },
  { country: "Venezuela", language: "Spanish", languageCode: "es", flag: "🇻🇪" },
  
  // Europe
  { country: "France", language: "French", languageCode: "fr", flag: "🇫🇷" },
  { country: "Germany", language: "German", languageCode: "de", flag: "🇩🇪" },
  { country: "Italy", language: "Italian", languageCode: "it", flag: "🇮🇹" },
  { country: "Spain", language: "Spanish", languageCode: "es", flag: "🇪🇸" },
  { country: "United Kingdom", language: "English", languageCode: "en", flag: "🇬🇧" },
  { country: "Netherlands", language: "Dutch", languageCode: "nl", flag: "🇳🇱" },
  { country: "Poland", language: "Polish", languageCode: "pl", flag: "🇵🇱" },
  { country: "Russia", language: "Russian", languageCode: "ru", flag: "🇷🇺" },
  
  // Asia
  { country: "China", language: "Chinese", languageCode: "zh", flag: "🇨🇳" },
  { country: "Japan", language: "Japanese", languageCode: "ja", flag: "🇯🇵" },
  { country: "South Korea", language: "Korean", languageCode: "ko", flag: "🇰🇷" },
  { country: "India", language: "Hindi", languageCode: "hi", flag: "🇮🇳" },
  { country: "Thailand", language: "Thai", languageCode: "th", flag: "🇹🇭" },
  { country: "Vietnam", language: "Vietnamese", languageCode: "vi", flag: "🇻🇳" },
  
  // Middle East & Africa
  { country: "Saudi Arabia", language: "Arabic", languageCode: "ar", flag: "🇸🇦" },
  { country: "Egypt", language: "Arabic", languageCode: "ar", flag: "🇪🇬" },
  { country: "South Africa", language: "English", languageCode: "en", flag: "🇿🇦" },
  { country: "Nigeria", language: "English", languageCode: "en", flag: "🇳🇬" },
  
  // Oceania
  { country: "Australia", language: "English", languageCode: "en", flag: "🇦🇺" },
  { country: "New Zealand", language: "English", languageCode: "en", flag: "🇳🇿" },
];

// Helper function to get language code from country
export function getLanguageFromCountry(country: string): string {
  const mapping = countryLanguageMap.find(item => 
    item.country.toLowerCase() === country.toLowerCase()
  );
  return mapping?.languageCode || 'en'; // Default to English
}

// Helper function to get country info
export function getCountryInfo(country: string): CountryLanguage | null {
  return countryLanguageMap.find(item => 
    item.country.toLowerCase() === country.toLowerCase()
  ) || null;
}

// Helper function to check if translation is needed
export function needsTranslation(senderCountry: string, receiverCountry: string): boolean {
  const senderLang = getLanguageFromCountry(senderCountry);
  const receiverLang = getLanguageFromCountry(receiverCountry);
  return senderLang !== receiverLang;
}
