
import React, { useCallback, useMemo } from 'react';
import { Note, NoteHistory } from '../types';
import { History } from './icons';
import { useToast } from '../contexts/ToastContext';
import { useLocale } from '../contexts/LocaleContext';

interface VersionHistoryProps {
  activeNote: Note | null;
  onRestore: (content: string) => void;
}

interface VersionItemProps {
    version: NoteHistory;
    onRestore: (content: string) => void;
}

const VersionItem: React.FC<VersionItemProps> = React.memo(({ version, onRestore }) => {
    const { t, locale } = useLocale();

    const formattedDate = useMemo(() => {
        try {
            return new Date(version.updatedAt).toLocaleString(locale);
        } catch (e) {
            return 'Invalid Date';
        }
    }, [version.updatedAt, locale]);

    return (
        <li className="group p-3 rounded-md bg-slate-100 dark:bg-slate-900 border border-transparent hover:border-primary-500/30 transition-colors">
            <div className="flex justify-between items-center">
                <div>
                    <p className="text-sm font-medium text-slate-800 dark:text-slate-200">
                        {t('history.versionFrom', { date: formattedDate })}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                        {version.content.substring(0, 50).replace(/\s+/g, ' ')}...
                    </p>
                </div>
                <button
                    onClick={() => onRestore(version.content)}
                    className="px-3 py-1 text-sm bg-primary-50 dark:bg-primary-900/50 text-primary-600 dark:text-primary-300 rounded-md hover:bg-primary-100 dark:hover:bg-primary-900 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                    {t('history.restore')}
                </button>
            </div>
        </li>
    )
});

const VersionHistory: React.FC<VersionHistoryProps> = ({ activeNote, onRestore }) => {
    const { addToast } = useToast();
    const { t } = useLocale();

    if (!activeNote) {
        return <div className="p-4 text-center text-slate-500">{t('history.selectNote')}</div>;
    }

    const handleRestore = useCallback((content: string) => {
        onRestore(content);
        addToast(t('toast.noteRestored'), 'success');
    }, [onRestore, addToast, t]);

    const history = activeNote.history || [];

    return (
        <div className="p-4 space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
                <History className="h-5 w-5" /> {t('history.title')}
            </h3>

            {history.length > 0 ? (
                <ul className="space-y-2">
                    {history.map((version, index) => (
                        <VersionItem 
                            key={version.updatedAt + index} 
                            version={version}
                            onRestore={handleRestore}
                        />
                    ))}
                </ul>
            ) : (
                <div className="text-center p-8 text-slate-500">
                    <History className="mx-auto h-12 w-12 text-slate-400" />
                    <h3 className="mt-2 text-lg font-semibold">{t('history.empty.title')}</h3>
                    <p className="mt-1 text-sm">{t('history.empty.description')}</p>
                </div>
            )}
        </div>
    );
};

export default VersionHistory;
