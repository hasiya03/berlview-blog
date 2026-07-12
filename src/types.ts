export interface Blog {
  id: string;
  title: string;
  description: string;
  coverImage: string;
  markdownUrl?: string;
  createdAt: number;
}
