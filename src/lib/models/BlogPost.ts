import mongoose, { Schema, Model, Types } from 'mongoose';

export interface IBlogPost {
  _id: Types.ObjectId;
  title: string;
  slug: string;
  content: string;
  excerpt?: string;
  coverImage?: string;
  author: string;
  tags: string[];
  isPublished: boolean;
  publishedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const blogPostSchema = new Schema<IBlogPost>(
  {
    title: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true },
    content: { type: String, required: true },
    excerpt: { type: String, default: '' },
    coverImage: { type: String, default: '' },
    author: { type: String, required: true },
    tags: [{ type: String }],
    isPublished: { type: Boolean, default: false },
    publishedAt: { type: Date },
  },
  { timestamps: true },
);

blogPostSchema.index({ slug: 1 });

const BlogPost: Model<IBlogPost> =
  mongoose.models.BlogPost ||
  mongoose.model<IBlogPost>('BlogPost', blogPostSchema);

export default BlogPost;
