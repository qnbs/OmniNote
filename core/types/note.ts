
import { DateTimeString } from './common';

export interface NoteHistory {
  content: string;
  updatedAt: DateTimeString;
}

export interface Note {
  id: string;
  title: string;
  content: string;
  tags: string[];
  createdAt: DateTimeString;
  updatedAt: DateTimeString;
  pinned: boolean;
  history: NoteHistory[];
  icon?: string;
}

export interface Template {
  id: string;
  title: string;
  content: string;
  icon?: string;
}

export interface Task {
  id: string;
  text: string;
  done: boolean;
  noteId: string;
  noteTitle: string;
  rawLine: string;
  lineIndex: number;
  dueDate?: string;
}
