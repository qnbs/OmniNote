import { Note } from '../types';

// Regular expression to find [[Wiki-Links]] in note content.
export const WIKI_LINK_REGEX = /\[\[([^\]]+)\]\]/g;

/**
 * Finds a note in an array of notes by its title, case-insensitively.
 * @param notes - The array of notes to search through.
 * @param title - The title of the note to find.
 * @returns The found note object or undefined if not found.
 */
export const findNoteByTitle = (notes: Note[], title: string): Note | undefined => {
  const normalizedTitle = title.trim().toLowerCase();
  return notes.find(note => note.title.trim().toLowerCase() === normalizedTitle);
};
