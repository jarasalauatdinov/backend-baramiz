import categoriesData from "../data/categories.json";
import type { Category } from "../types/tourism.types";

const categories = categoriesData as Category[];

class CategoriesService {
  getCategories(): Category[] {
    return categories;
  }
}

export const categoriesService = new CategoriesService();
