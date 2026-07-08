import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { text } = await req.json();

    // Mock AI optimization delay
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // A mock AI that visually enhances the USER'S OWN HTML content
    // instead of replacing it with a hardcoded text.
    let optimizedText = text || "";

    // 1. Wrap the entire content in a beautiful, centered container if it's not already
    if (!optimizedText.includes('max-width: 800px')) {
      optimizedText = `<div style="max-width: 800px; margin: 0 auto; color: #4a5568; font-family: sans-serif;">\n${optimizedText}\n</div>`;
    }

    // 2. Enhance headings with premium font and spacing
    optimizedText = optimizedText.replace(/<h([1-6])(.*?)>(.*?)<\/h\1>/gi, (match: string, level: string, attrs: string, content: string) => {
      // Add or update styles for headings
      return `<h${level} style="color: #2d3748; font-family: 'Fraunces', serif; font-weight: 800; margin-top: 1.5em; margin-bottom: 0.8em; line-height: 1.3;"${attrs}>${content}</h${level}>`;
    });

    // 3. Enhance paragraphs with better line-height and readability
    optimizedText = optimizedText.replace(/<p(.*?)>(.*?)<\/p>/gi, (match: string, attrs: string, content: string) => {
      // Only modify if it doesn't already have explicit styling that we might break, 
      // or just forcefully apply good typography:
      return `<p style="font-size: 17px; line-height: 1.8; margin-bottom: 1.5em; color: #4a5568;"${attrs}>${content}</p>`;
    });

    // 4. Enhance images (make them responsive, nicely rounded, with subtle shadow)
    optimizedText = optimizedText.replace(/<img(.*?)>/gi, (match: string, attrs: string) => {
      // If it doesn't have our custom class/style, add it
      if (!attrs.includes('border-radius')) {
        return `<img style="max-width: 100%; height: auto; border-radius: 12px; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1); margin: 2em auto; display: block;"${attrs}>`;
      }
      return match;
    });

    return NextResponse.json({ optimizedText });
  } catch (error) {
    console.error("AI optimization error:", error);
    return NextResponse.json(
      { error: "Hiba történt az AI optimalizálás során." },
      { status: 500 }
    );
  }
}
