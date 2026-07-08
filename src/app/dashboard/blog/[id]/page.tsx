"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import BlogForm from "./BlogForm";

export default function VendorBlogEditorPage() {
  const { id } = useParams();
  const router = useRouter();
  const [post, setPost] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPost();
  }, [id]);

  const fetchPost = async () => {
    try {
      const res = await fetch(`/api/vendor/blog/${id}`);
      if (res.ok) {
        const data = await res.json();
        setPost(data);
      } else {
        alert("A bejegyzés nem található.");
        router.push("/dashboard/blog");
      }
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  if (loading) return <div>Betöltés...</div>;
  if (!post) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/blog" className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm border border-border hover:bg-gray-50 transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 text-gray-500">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
          </svg>
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Blogposzt Szerkesztése</h1>
          <p className="text-gray-500 text-sm">Azonosító: {post.id}</p>
        </div>
      </div>

      <BlogForm post={post} />
    </div>
  );
}
