// Language helpers. Students are Uzbek speakers, so Uzbek is the default for the interface
// and for word translations. Both can be switched to English only in Settings.
import { getSettings } from './store.js';
import { UZ } from './data/uz.js';

export const uiLang = () => getSettings().ui || 'uz';
export const trLang = () => getSettings().tr || 'uz';

// t('Lessons') -> "Darslar" when the interface is Uzbek; unknown text stays in English.
export const t = (s) => (uiLang() === 'uz' ? (UZ[s] ?? s) : s);

// Short clue for games: Uzbek translation when available, otherwise the English meaning.
export const clue = (w) => (trLang() === 'uz' && w.uz ? w.uz : w.def);
// Text that should be shown next to the English word (the Uzbek translation, or '' when off).
export const uzOf = (w) => (trLang() === 'uz' && w.uz ? w.uz : '');
