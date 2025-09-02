
import React, { useState, useEffect, useRef } from 'react';
import * as Icons from './icons';

interface IconPickerProps {
    onSelect: (iconName: string) => void;
    onClose: () => void;
}

const iconList = [
    'NotebookPen', 'Sparkles', 'Lightbulb', 'BrainCircuit', 'BookOpenCheck',
    'CheckSquare', 'GanttChartSquare', 'Rocket', 'Target', 'Goal', 'Flag',
    'Award', 'Trophy', 'Medal', 'Gift', 'Heart', 'Star', 'Home', 'Users',
    'User', 'Briefcase', 'Folder', 'FileText', 'Calendar', 'Clock',
    'Code', 'TerminalSquare', 'Database', 'Server', 'Cloud', 'Globe',
    'MapPin', 'Compass', 'Coffee', 'Pizza', 'CookingPot', 'BookHeart',
    'Music', 'Film', 'Camera', 'Palette', 'GraduationCap', 'FlaskConical',
    'Atom', 'Bug', 'Construction', 'Plane', 'Ship', 'Car', 'Bike',
    'Megaphone', 'MessageSquare', 'Mail', 'Link', 'Shield', 'Key', 'Lock'
];

const IconPicker: React.FC<IconPickerProps> = ({ onSelect, onClose }) => {
    const [search, setSearch] = useState('');
    const pickerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (pickerRef.current && !pickerRef.current.contains(event.target as Node)) {
                onClose();
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [onClose]);

    const filteredIcons = iconList.filter(name => name.toLowerCase().includes(search.toLowerCase()));
    
    return (
        <div ref={pickerRef} className="absolute z-20 -left-4 top-14 w-64 bg-white dark:bg-slate-800 rounded-lg shadow-xl border dark:border-slate-700 p-2">
            <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search icons..."
                className="w-full px-2 py-1 mb-2 text-sm bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-1 focus:ring-primary-500"
                autoFocus
            />
            <div className="grid grid-cols-6 gap-1 max-h-48 overflow-y-auto">
                {filteredIcons.map(iconName => {
                    const IconComponent = (Icons as any)[iconName];
                    return (
                        <button
                            key={iconName}
                            onClick={() => onSelect(iconName)}
                            title={iconName}
                            className="p-2 rounded-md hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 flex items-center justify-center"
                        >
                            <IconComponent className="h-5 w-5" />
                        </button>
                    )
                })}
            </div>
        </div>
    )
}

export default IconPicker;