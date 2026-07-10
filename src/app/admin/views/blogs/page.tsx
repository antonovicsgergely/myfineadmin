import prisma from "@/lib/prisma";
import BlogsViewClient from "./BlogsViewClient";

export const dynamic = "force-dynamic";

export default async function AdminViewsBlogsPage() {
  const blogs = await prisma.blogPost.findMany({
    orderBy: { createdAt: "desc" },
    include: { vendor: true },
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Blog Bejegyzések (Nézet)</h2>
          <p className="text-sm text-foreground/60 mt-1">Az összes blogbejegyzés listája.</p>
        </div>
        <a 
          href="/admin/views/blogs/new" 
          className="bg-primary hover:bg-primary-hover text-white px-6 py-2 rounded-xl font-bold shadow-md transition-all flex items-center gap-2"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Új bejegyzés (Rendszer)
        </a>
      </div>

      <BlogsViewClient blogs={blogs} />
    </div>
  );
}
