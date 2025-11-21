
import { Note, Template } from '../types';
import { toDateTimeString } from '../core/types/common';

type Locale = 'en' | 'de';

export const getInitialNotes = (locale: Locale): Note[] => {
  const isDe = locale === 'de';
  return [
    {
      id: '1',
      title: isDe ? 'Willkommen bei OmniNote' : 'Welcome to OmniNote',
      content: isDe ? `
# Willkommen bei OmniNote!

Dies ist Ihr intelligenter Notizbegleiter, jetzt mit neuen Funktionen aufgeladen.

## Was ist neu?
- **Vorlagen**: Schauen Sie sich den neuen Tab **Vorlagen** links an! Sie können aus jeder Notiz mit der Schaltfläche 'Als Vorlage speichern' im Editor Ihre eigenen erstellen.
- **Notiz-Icons**: Verleihen Sie Ihren Notizen Persönlichkeit! Klicken Sie auf das Smiley-Gesicht links neben dem Titel, um ein Symbol zuzuweisen.
- **KI-Rezepte**: Entdecken Sie in der KI-Seitenleiste "Rezepte", die komplexe Aufgaben wie das Entwerfen eines Blogbeitrags oder das Zusammenfassen von Meeting-Protokollen mit einem Klick erledigen.
- **Aufgaben-Fälligkeitsdaten**: Fügen Sie einer Aufgabe mit \`- [ ] Meine Aufgabe @{JJJJ-MM-TT}\` ein Fälligkeitsdatum hinzu. Sie werden in der **Aufgaben**-Ansicht automatisch sortiert.

## Kernfunktionen:
- **KI-Agenten-Schwarm**: Verwenden Sie das Panel rechts, um zu analysieren, zusammenzufassen und kreative Ideen zu erhalten.
- **Wissensgraph**: Visualisieren Sie die Verbindungen zwischen Ihren Notizen.
- **Markdown-Unterstützung**: Schreiben Sie mit Markdown für umfangreiche Formatierungen.

## Wie man anfängt:
1. Klicken Sie auf das 'Neue Notiz'-Dropdown, um eine Notiz aus einer Vorlage zu erstellen.
2. Schreiben Sie Ihre Gedanken auf.
3. Erkunden Sie die KI-Agenten und den Wissensgraphen in der rechten Seitenleiste.
      ` : `
# Welcome to OmniNote!

This is your intelligent note-taking companion, now supercharged with new features.

## What's New?
- **Templates**: Check the new **Templates** tab on the left! You can create your own from any note using the 'Save as Template' button in the editor.
- **Note Icons**: Give your notes some personality! Click the smiley face to the left of the title to assign an icon.
- **AI Recipes**: In the AI sidebar, discover "Recipes" that perform complex tasks like drafting a blog post or summarizing meeting minutes in one click.
- **Task Due Dates**: Add a due date to any task with \`- [ ] My Task @{YYYY-MM-DD}\`. They'll be automatically sorted in the **Tasks** view.

## Core Features:
- **AI Agent Swarm**: Use the panel on the right to analyze, summarize, and get creative ideas.
- **Knowledge Graph**: Visualize the connections between your notes.
- **Markdown Support**: Write using Markdown for rich formatting.

## How to start:
1. Click the 'New Note' dropdown to create a note from a template.
2. Write down your thoughts.
3. Explore the AI Agents and Knowledge Graph in the right sidebar.
      `,
      tags: ['welcome', 'guide'],
      createdAt: toDateTimeString(new Date()),
      updatedAt: toDateTimeString(new Date()),
      pinned: true,
      history: [],
      icon: 'Sparkles',
    },
  ];
};

export const getInitialTemplates = (locale: Locale): Template[] => {
    const isDe = locale === 'de';
    const today = new Date().toLocaleDateString(locale);

    return [
    {
        id: 'template-1',
        title: isDe ? 'Besprechungsnotizen' : 'Meeting Notes',
        icon: 'Users',
        content: isDe ? `
# Besprechung: [Thema]

**Datum:** 
**Teilnehmer:** 

## Agenda
1. 
2. 
3. 

## Diskussionsnotizen
- 

## Aktionspunkte
- [ ] 
- [ ] 
        ` : `
# Meeting: [Topic]

**Date:** 
**Attendees:** 

## Agenda
1. 
2. 
3. 

## Discussion Notes
- 

## Action Items
- [ ] 
- [ ] 
        `,
    },
    {
        id: 'template-2',
        title: isDe ? 'Tagebuch' : 'Daily Journal',
        icon: 'BookHeart',
        content: isDe ? `
# Tägliches Journal - ${today}

## Drei Dinge, für die ich dankbar bin:
1. 
2. 
3. 

## Wie ich mich heute fühle:
- 

## Heutige Highlights:
- 

## Ziele für morgen:
- [ ] 
        ` : `
# Daily Journal - ${today}

## Three things I'm grateful for:
1. 
2. 
3. 

## How I'm feeling today:
- 

## Today's highlights:
- 

## Goals for tomorrow:
- [ ] 
        `
    },
    {
        id: 'template-3',
        title: isDe ? 'Projektplan' : 'Project Plan',
        icon: 'Rocket',
        content: isDe ? `
# Projekt: [Name]

## 1. Projektziele
- 

## 2. Wichtige Ergebnisse
- 

## 3. Zeitplan & Meilensteine
| Meilenstein | Fälligkeitsdatum | Status |
|-------------|------------------|--------|
| Phase 1     |                  | Zu tun |
| Phase 2     |                  | Zu tun |
| Start       |                  | Zu tun |

## 4. Aufgaben
- [ ] 
- [ ] 
        ` : `
# Project: [Name]

## 1. Project Goals
- 

## 2. Key Deliverables
- 

## 3. Timeline & Milestones
| Milestone | Due Date | Status |
|-----------|----------|--------|
| Phase 1   |          | To Do  |
| Phase 2   |          | To Do  |
| Launch    |          | To Do  |

## 4. Tasks
- [ ] 
- [ ] 
        `
    }
];
}
