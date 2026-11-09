export interface StudentSurveyRecord {
  id: string;
  name: string;
  surveyVersion: string;
  status: "Terkirim" | "Draf" | "Belum mulai";
  sentDate: string;
  surveyScore: number | null;
  scoreStatus?: string;
  actionText: string;
}

export interface TechnostressStudent {
  id: string;
  name: string;
  post_date: string;
  kalkulasi: number | null;
  rounded_scale: number | null;
  kategori: "Tinggi" | "Sedang" | "Rendah" | string;
  essay_text: string;
}

export interface TopNgram {
  Frasa: string;
  Frekuensi: number;
}

export interface AnalyticsSummary {
  total_records: number;
  can_render_chart: boolean;
  can_render_wordcloud: boolean;
  stress_counts: {
    Tinggi?: number;
    Sedang?: number;
    Rendah?: number;
    [key: string]: number | undefined;
  };
  average_score: number | null;
}

export interface AnalyticsResponse {
  success: boolean;
  summary: AnalyticsSummary;
  students: TechnostressStudent[];
  top_ngrams: {
    high: TopNgram[];
    low: TopNgram[];
  };
  wordclouds: {
    Tinggi?: string | null;
    Rendah?: string | null;
    Sedang?: string | null;
    Semua?: string | null;
  };
}
