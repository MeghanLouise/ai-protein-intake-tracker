// Shapes of the data exchanged with the Express API.

export interface Entry {
  date: string;
  time: string;
  description: string;
  protein_g: number;
}

export interface TodayResponse {
  date: string;
  total: number;
  goal: number;
  entries: Entry[];
}

export interface Estimate {
  protein_g: number;
  description: string;
  breakdown: string;
}

export interface ImagePayload {
  mimeType: string;
  data: string;
}
