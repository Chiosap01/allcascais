// src/types/service.ts
import type { CategoryId } from "../data/categories";

export type Service = {
  id: string | number;
  title: string;
  description: string;
  categoryId: CategoryId;
  subcategoryId?: string;
  location?: string;
  languages?: string[]; // e.g. ["en", "pt", "es"]

  contactName?: string;
  contactEmail?: string;
  contactPhone?: string;

  createdAt?: string;

  // Optional rating fields (for filters / future UI)
  rating?: number;
  ratingCount?: number;
};
