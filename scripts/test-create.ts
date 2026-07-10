import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function test() {
  try {
    const post = await prisma.blogPost.create({
      data: {
        title: "Test",
        content: "Test",
        draftTitle: "Test",
        status: "DRAFT"
      }
    });
    console.log("Success:", post.id);
  } catch (err: any) {
    console.error("Error:", err.message);
  } finally {
    await prisma.$disconnect();
  }
}

test();
