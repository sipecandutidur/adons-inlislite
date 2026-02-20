/**
 * Navigation Types
 * TypeScript types for navigation
 */

// Main Tab Navigator
export type MainTabParamList = {
  Home: undefined;
  News: undefined;
  MemberCard: undefined;
  LoanHistory: undefined;
  Profile: undefined;
};

// Catalog Stack (for future nested navigation)
export type CatalogStackParamList = {
  CatalogList: undefined;
  CatalogDetail: { catalogId: number };
};

// News Stack (for future nested navigation)
export type NewsStackParamList = {
  NewsList: undefined;
  NewsDetail: { newsId: number };
};
