
import React, { useState } from 'react';
import { useAppDispatch, useAppSelector } from '../core/store/hooks';
import { selectAllTemplates, deleteTemplate } from '../features/notes/noteSlice';
import { LayoutTemplate, Trash2 } from './icons';
import SearchNotes from './SearchNotes';
import { useLocale } from '../contexts/LocaleContext';

interface TemplateViewProps {
    onUseTemplate: (content: string, title: string) => void;
}

const TemplateView: React.FC<TemplateViewProps> = ({ onUseTemplate }) => {
    const dispatch = useAppDispatch();
    const templates = useAppSelector(selectAllTemplates);
    const { t } = useLocale();
    const [searchQuery, setSearchQuery] = useState('');

    const filteredTemplates = templates.filter(t => t.title.toLowerCase().includes(searchQuery.toLowerCase()));

    return (
        <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-900">
            <div className="p-2 border-b border-slate-200 dark:border-slate-800">
                <SearchNotes query={searchQuery} onQueryChange={setSearchQuery} />
            </div>
             <div className="flex-1 overflow-y-auto">
                {filteredTemplates.length > 0 ? (
                    filteredTemplates.map(template => (
                         <div
                            key={template.id}
                            className="group cursor-pointer p-3 m-2 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors relative"
                        >
                            <div className="flex items-center" onClick={() => onUseTemplate(template.content, template.title)}>
                                <LayoutTemplate className="h-4 w-4 text-slate-500 mr-3" />
                                <span className="font-semibold text-slate-800 dark:text-slate-100 truncate">{template.title}</span>
                            </div>
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    dispatch(deleteTemplate(template.id));
                                }}
                                className="absolute top-1/2 -translate-y-1/2 right-2 p-1 rounded-full text-slate-400 hover:bg-red-100 hover:text-red-500 dark:hover:bg-red-900/50 dark:hover:text-red-400 opacity-0 group-hover:opacity-100"
                                aria-label={t('templates.delete')}
                                title={t('templates.delete')}
                            >
                                <Trash2 className="h-4 w-4" />
                            </button>
                        </div>
                    ))
                ) : (
                    <div className="text-center p-8 text-slate-500">
                         <LayoutTemplate className="mx-auto h-12 w-12 text-slate-400" />
                        <h3 className="mt-2 text-lg font-semibold">{t('templates.empty.title')}</h3>
                        <p className="mt-1 text-sm">{t('templates.empty.description')}</p>
                    </div>
                )}
             </div>
        </div>
    )
}

export default React.memo(TemplateView);
