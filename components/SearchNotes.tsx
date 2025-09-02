
import React, { useState, useEffect } from 'react';
import { Search } from './icons';
import { useLocale } from '../contexts/LocaleContext';

interface SearchNotesProps {
  query: string;
  onQueryChange: (query: string) => void;
}

const SearchNotes: React.FC<SearchNotesProps> = ({ query, onQueryChange }) => {
  const { t } = useLocale();
  // We use a local state for the input value to provide immediate feedback to the user.
  const [inputValue, setInputValue] = useState(query);

  // When the external query changes (e.g., cleared programmatically), update the local state.
  useEffect(() => {
    setInputValue(query);
  }, [query]);

  // Debounce the call to the parent's onQueryChange function.
  useEffect(() => {
    const identifier = setTimeout(() => {
      if (query !== inputValue) {
        onQueryChange(inputValue);
      }
    }, 300); // 300ms delay
    return () => clearTimeout(identifier);
  }, [inputValue, onQueryChange, query]);


  return (
    <div className="relative">
      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
        <Search className="h-5 w-5 text-slate-400" />
      </div>
      <input
        type="text"
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        placeholder={t('searchPlaceholder')}
        aria-label={t('searchPlaceholder')}
        className="w-full pl-10 pr-4 py-2 text-sm bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
      />
    </div>
  );
};

export default SearchNotes;
