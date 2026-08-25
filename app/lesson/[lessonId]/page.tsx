import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

import { LessonContent } from "../lesson-content";

type LessonIdPageProps = {
  params: Promise<{
    lessonId: string;
  }>;
};

const LessonIdPage = async ({ params }: LessonIdPageProps) => {
  await auth.protect();

  const { lessonId } = await params;
  const parsedLessonId = Number(lessonId);

  if (!Number.isInteger(parsedLessonId) || parsedLessonId <= 0) {
    redirect("/learn");
  }

  return <LessonContent lessonId={parsedLessonId} />;
};

export default LessonIdPage;
