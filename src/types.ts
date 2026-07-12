export interface Blog {
  id: string;
  title: string;
  description: string;
  coverImage: string; // Base64 string for local storage
  createdAt: number;
}
