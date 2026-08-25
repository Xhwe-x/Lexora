import { auth } from "@clerk/nextjs/server";

import { LessonContent } from "./lesson-content";

const LessonPage = async () => {
  await auth.protect();
  return <LessonContent />;
};

export default LessonPage;
