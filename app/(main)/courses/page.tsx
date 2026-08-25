import { auth } from "@clerk/nextjs/server";

import { getCourses, getUserProgress } from "@/db/queries";
import { translate } from "@/lib/i18n/messages";
import { getRequestLocale } from "@/lib/i18n/server";

import { List } from "./list";

const CoursesPage = async () => {
  await auth.protect();
  const locale = await getRequestLocale();

  const coursesData = getCourses();
  const userProgressData = getUserProgress();

  const [courses, userProgress] = await Promise.all([
    coursesData,
    userProgressData,
  ]);

  return (
    <div className="mx-auto h-full max-w-[912px] px-3">
      <h1 className="text-pretty text-2xl font-bold text-neutral-700">
        {translate(locale, "courses.title")}
      </h1>

      <List courses={courses} activeCourseId={userProgress?.activeCourseId} />
    </div>
  );
};

export default CoursesPage;
