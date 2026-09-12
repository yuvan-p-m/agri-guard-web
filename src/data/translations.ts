import type { Language } from '../types';
import en from '../locales/en.json';
import hi from '../locales/hi.json';
import ta from '../locales/ta.json';

export const translations: Record<Language, Record<string, string>> = {
  en,
  hi,
  ta,
};

export default translations;
