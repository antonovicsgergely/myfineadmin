import { syncBlogPostToUnas } from "../src/lib/unas/pages";
import { PrismaClient } from '@prisma/client';

async function run() {
  try {
    const prisma = new PrismaClient();
    const blogs = await prisma.blogPost.findMany({
      where: { status: 'PUBLISHED', unasPageId: null }
    });
    for (const blog of blogs) {
      console.log("Syncing:", blog.title);
      const result = await syncBlogPostToUnas(blog.id);
      console.log("Sync success! UNAS Page ID:", result);
    }
  } catch (error) {
    console.error("Sync error:", error);
  }
}

run();
