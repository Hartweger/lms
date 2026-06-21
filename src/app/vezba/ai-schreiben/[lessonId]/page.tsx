import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import AiWritingExercise from "@/components/exercises/AiWritingExercise";
import { getWritingInstruction } from "@/lib/fixed-writing";

interface PageProps {
  params: Promise<{ lessonId: string }>;
}

export const dynamic = "force-dynamic";

export default async function AiWritingPage({ params }: PageProps) {
  const { lessonId } = await params;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) notFound();

  const { data: lesson } = await supabase
    .from("lessons")
    .select("id, title")
    .eq("id", lessonId)
    .single();

  if (!lesson) notFound();

  return (
    <div className="max-w-4xl mx-auto px-4 py-4">
      <AiWritingExercise lessonId={lesson.id} lessonTitle={lesson.title} instruction={getWritingInstruction(lesson.title)} />
    </div>
  );
}
