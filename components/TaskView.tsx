
import React, { useMemo, useState, useCallback } from 'react';
import { Task } from '../core/types/note';
import { CheckSquare, ChevronLeft, Notebook } from './icons';
import { useLocale } from '../contexts/LocaleContext';
import { useAppSelector, useAppDispatch } from '../core/store/hooks';
import { selectAllTasks, updateNote } from '../features/notes/noteSlice';
import { toDateTimeString } from '../core/types/common';

interface TaskViewProps {
  onSelectNote: (id: string) => void;
}

interface TaskItemProps {
    task: Task;
    onToggle: (task: Task) => void;
    onSelect: (noteId: string) => void;
    locale: string;
}

const TaskItem: React.FC<TaskItemProps> = React.memo(({ task, onToggle, onSelect, locale }) => {
    const formattedDate = task.dueDate ? new Date(task.dueDate).toLocaleDateString(locale, { month: 'short', day: 'numeric', timeZone: 'UTC' }) : null;

    const handleToggle = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        onToggle(task);
    }, [onToggle, task]);

    const handleSelect = useCallback(() => {
        onSelect(task.noteId);
    }, [onSelect, task.noteId]);

    const stopPropagation = useCallback((e: React.MouseEvent) => {
        e.stopPropagation();
    }, []);

    return (
      <li className="group flex items-start p-2 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800/50 transition-colors">
        <div className="flex-shrink-0 pt-0.5">
            <input
                type="checkbox"
                checked={task.done}
                onChange={handleToggle}
                onClick={stopPropagation} 
                className="h-4 w-4 rounded border-slate-300 dark:border-slate-600 text-primary-600 focus:ring-primary-500 bg-transparent cursor-pointer"
                aria-label={task.text}
            />
        </div>
        <div 
            className="ml-3 flex-grow cursor-pointer"
            onClick={handleSelect}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleSelect(); }}
        >
            <div className="flex justify-between items-center">
                <span className={`text-sm ${task.done ? 'line-through text-slate-500' : 'text-slate-800 dark:text-slate-200'}`}>
                    {task.text}
                </span>
                {formattedDate && (
                     <span className={`ml-2 text-xs text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-700/50 px-2 py-0.5 rounded-full whitespace-nowrap ${task.done ? 'opacity-60' : ''}`}>
                        {formattedDate}
                    </span>
                )}
            </div>
            <div className="text-xs text-slate-400 group-hover:text-primary-500 transition-colors flex items-center gap-1.5 mt-0.5">
                <Notebook className="h-3 w-3" />
                <span className="truncate" title={task.noteTitle}>{task.noteTitle}</span>
            </div>
        </div>
      </li>
    );
});

const TaskView: React.FC<TaskViewProps> = ({ onSelectNote }) => {
  const dispatch = useAppDispatch();
  const allTasks = useAppSelector(selectAllTasks);
  const notes = useAppSelector(state => state.notes.notes.entities); 
  const { t, locale } = useLocale();
  const [showCompleted, setShowCompleted] = useState(false);
  
  const updateTaskInNote = useCallback((taskToUpdate: Task) => {
      const note = notes[taskToUpdate.noteId];
      if (!note) return;

      const lines = note.content.split('\n');
      const { lineIndex, rawLine } = taskToUpdate;

      // Guard against stale index
      let realIndex = lineIndex;
      if (lineIndex >= lines.length || lines[lineIndex] !== rawLine) {
          realIndex = lines.findIndex(l => l === rawLine);
      }
      if (realIndex === -1) return;

      const newDoneState = !taskToUpdate.done;
      const newCheckbox = newDoneState ? '[x]' : '[ ]';
      const newLine = rawLine.replace(/\[( |x)\]/, newCheckbox);
      lines[realIndex] = newLine;

      const newContent = lines.join('\n');
      if (note.content !== newContent) {
          dispatch(updateNote({ ...note, content: newContent }));
      }
  }, [dispatch, notes]);

  const completedTasks = useMemo(() => allTasks.filter(t => t.done), [allTasks]);

  const groupedTasks = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const groups: { [key: string]: Task[] } = {
        [t('tasks.groups.overdue')]: [],
        [t('tasks.groups.today')]: [],
        [t('tasks.groups.upcoming')]: [],
        [t('tasks.groups.noDate')]: [],
    };

    allTasks.forEach(task => {
        if(task.done) return;

        if (task.dueDate) {
            try {
                const dueDate = new Date(task.dueDate);
                dueDate.setMinutes(dueDate.getMinutes() + dueDate.getTimezoneOffset());
                dueDate.setHours(0,0,0,0);
                if (dueDate < today) {
                    groups[t('tasks.groups.overdue')].push(task);
                } else if (dueDate.getTime() === today.getTime()) {
                    groups[t('tasks.groups.today')].push(task);
                } else {
                    groups[t('tasks.groups.upcoming')].push(task);
                }
            } catch(e) {
                 groups[t('tasks.groups.noDate')].push(task);
            }
        } else {
            groups[t('tasks.groups.noDate')].push(task);
        }
    });

    groups[t('tasks.groups.overdue')].sort((a,b) => new Date(a.dueDate!).getTime() - new Date(b.dueDate!).getTime());
    groups[t('tasks.groups.upcoming')].sort((a,b) => new Date(a.dueDate!).getTime() - new Date(b.dueDate!).getTime());

    return groups;
  }, [allTasks, t]);

  if (allTasks.length === 0) {
    return (
      <div className="text-center p-8 text-slate-500 flex-1">
        <CheckSquare className="mx-auto h-12 w-12 text-slate-400" />
        <h3 className="mt-2 text-lg font-semibold">{t('tasks.empty.title')}</h3>
        <p className="mt-1 text-sm">{t('tasks.empty.description1')}</p>
        <p className="mt-1 text-sm">{t('tasks.empty.description2')}</p>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-2">
      {Object.entries(groupedTasks).map(([groupName, tasks]: [string, Task[]]) => (
        tasks.length > 0 && (
            <div key={groupName} className="mb-4">
                <h3 className="font-semibold text-sm text-slate-500 dark:text-slate-400 px-2 py-1 uppercase tracking-wider">{groupName}</h3>
                <ul className="space-y-0.5">
                    {tasks.map(task => (
                        <TaskItem 
                            key={task.id} 
                            task={task} 
                            onToggle={updateTaskInNote} 
                            onSelect={onSelectNote} 
                            locale={locale}
                        />
                    ))}
                </ul>
            </div>
        )
      ))}
      {completedTasks.length > 0 && (
        <div className="mt-4">
            <button 
                onClick={() => setShowCompleted(!showCompleted)} 
                className="w-full flex justify-between items-center px-2 py-1 text-left rounded-md hover:bg-slate-200 dark:hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-primary-500"
                aria-expanded={showCompleted}
            >
                <h3 className="font-semibold text-sm text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    {t('tasks.groups.completed')} ({completedTasks.length})
                </h3>
                <ChevronLeft className={`h-4 w-4 text-slate-400 transition-transform ${showCompleted ? '-rotate-90' : 'rotate-0'}`} />
            </button>
            {showCompleted && (
                <ul className="space-y-0.5 mt-2">
                    {completedTasks.map(task => (
                        <TaskItem 
                            key={task.id} 
                            task={task} 
                            onToggle={updateTaskInNote} 
                            onSelect={onSelectNote} 
                            locale={locale}
                        />
                    ))}
                </ul>
            )}
        </div>
    )}
    </div>
  );
};

export default React.memo(TaskView);
