import prisma from "@/lib/prisma";
import AdminBlogForm from "./AdminBlogForm";

export const dynamic = "force-dynamic";

export default async function AdminBlogEditorPage(props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params;

  let post = null;
  if (id !== "new") {
    post = await prisma.blogPost.findUnique({
      where: { id },
      include: { vendor: true }
    });
  } else {
    // "new" means creating a system blog
    post = {
      id: "new",
      title: "",
      content: "",
      coverUrl: "",
      shortDescription: "",
      draftTitle: "",
      draftContent: "",
      draftCoverUrl: "",
      draftShortDescription: "",
      status: "DRAFT",
      vendor: null
    };
  }

  if (!post && id !== "new") {
    return <div>Bejegyzés nem található.</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <a href="/admin/views/blogs" className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm border border-border hover:bg-gray-50 transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 text-gray-500">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
          </svg>
        </a>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{id === "new" ? "Új Rendszer Blog" : "Blogposzt Szerkesztése"}</h1>
          {id !== "new" && <p className="text-gray-500 text-sm">Azonosító: {post?.id}</p>}
        </div>
      </div>

      <AdminBlogForm post={post} />
    </div>
  );
}
