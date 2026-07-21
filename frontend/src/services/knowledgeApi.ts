import axios from 'axios';
import { api, MediaItem } from '../api';

export interface BookItem {
    key: string;
    title: string;
    author: string;
    firstPublishYear?: number;
    coverUrl?: string;
    editionCount?: number;
}

export interface WikiArticle {
    title: string;
    extract: string;
    fullurl: string;
    thumbnail?: string;
    sections: { heading: string; body: string }[];
    infoboxProps: { key: string; value: string }[];
}

export interface DictEntry {
    word: string;
    phonetic?: string;
    audioUrl?: string;
    meanings: {
        partOfSpeech: string;
        definitions: { definition: string; example?: string }[];
    }[];
}

// Extract headings and sections from raw Wikipedia text
function parseWikiSections(extract: string): { heading: string; body: string }[] {
    const sections: { heading: string; body: string }[] = [];
    const lines = extract.split('\n');
    let currentHeading = 'Overview';
    let currentLines: string[] = [];

    for (const line of lines) {
        if (line.startsWith('== ') && line.endsWith(' ==')) {
            if (currentLines.some(l => l.trim())) {
                sections.push({ heading: currentHeading, body: currentLines.join('\n').trim() });
            }
            currentHeading = line.replace(/==/g, '').trim();
            currentLines = [];
        } else {
            currentLines.push(line);
        }
    }
    if (currentLines.some(l => l.trim())) {
        sections.push({ heading: currentHeading, body: currentLines.join('\n').trim() });
    }
    return sections;
}

export const knowledgeApi = {
    // Wikipedia Detailed Article
    fetchWikipedia: async (query: string): Promise<WikiArticle | null> => {
        try {
            const params = new URLSearchParams({
                action: 'query',
                format: 'json',
                prop: 'extracts|pageimages|info',
                exintro: '0',
                explaintext: '1',
                inprop: 'url',
                piprop: 'thumbnail',
                pithumbsize: '800',
                titles: query,
                redirects: '1',
                origin: '*',
            });
            const res = await axios.get(`https://en.wikipedia.org/w/api.php?${params}`);
            const pages = res.data?.query?.pages || {};
            const page = Object.values(pages)[0] as any;
            if (!page || page.missing !== undefined) return null;

            const extract = (page.extract || '') as string;
            const sections = parseWikiSections(extract);

            return {
                title: page.title,
                extract,
                fullurl: page.fullurl,
                thumbnail: page.thumbnail?.source,
                sections,
                infoboxProps: [
                    { key: 'Page ID', value: String(page.pageid) },
                    { key: 'Language', value: 'English (en)' },
                    { key: 'Source', value: 'Wikipedia Encyclopedia' },
                ],
            };
        } catch {
            return null;
        }
    },

    // Free Dictionary API
    fetchDictionary: async (word: string): Promise<DictEntry | null> => {
        try {
            const res = await axios.get(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word)}`);
            const entry = res.data?.[0];
            if (!entry) return null;

            const audioObj = entry.phonetics?.find((p: any) => p.audio && p.audio.trim().length > 0);
            return {
                word: entry.word,
                phonetic: entry.phonetic || entry.phonetics?.find((p: any) => p.text)?.text,
                audioUrl: audioObj?.audio,
                meanings: (entry.meanings || []).map((m: any) => ({
                    partOfSpeech: m.partOfSpeech,
                    definitions: (m.definitions || []).map((d: any) => ({
                        definition: d.definition,
                        example: d.example,
                    })),
                })),
            };
        } catch {
            return null;
        }
    },

    // Open Library Books API
    fetchBooks: async (query: string): Promise<BookItem[]> => {
        try {
            const res = await axios.get(`https://openlibrary.org/search.json?q=${encodeURIComponent(query)}&limit=6`);
            const docs = res.data?.docs || [];
            return docs.map((doc: any) => ({
                key: doc.key,
                title: doc.title,
                author: doc.author_name ? doc.author_name.join(', ') : 'Unknown Author',
                firstPublishYear: doc.first_publish_year,
                coverUrl: doc.cover_i ? `https://covers.openlibrary.org/b/id/${doc.cover_i}-M.jpg` : undefined,
                editionCount: doc.edition_count,
            }));
        } catch {
            return [];
        }
    },

    // TMDB Related Media
    fetchRelatedMedia: async (query: string): Promise<MediaItem[]> => {
        try {
            const results = await api.search(query);
            return (results || []).slice(0, 12);
        } catch {
            return [];
        }
    },
};
