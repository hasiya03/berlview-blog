export interface Blog {
  id: string;
  title: string;
  description: string;
  coverImage: string;
  markdownUrl?: string;
  is_active?: boolean;
  tags?: string[];
  createdAt: number;
}
