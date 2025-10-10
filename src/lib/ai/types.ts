export type SentimentKind = 'positivo' | 'neutral' | 'negativo';

export interface SentimentItem {
  index: number;
  text: string;
  sentiment: SentimentKind;
  score_hint: number | null;
  reasons: string;
  palabras_clave: string[];
}

export interface SentimentBatchResponse {
  provider: 'apilayer';
  results: SentimentItem[];
}