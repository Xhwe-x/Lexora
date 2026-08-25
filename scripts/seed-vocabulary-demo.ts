import "dotenv/config";

import { neon } from "@neondatabase/serverless";
import { and, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/neon-http";

import * as schema from "@/db/schema";
import { normalizeWord } from "@/lib/vocabulary/normalize-word";

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL is not defined");
}

const db = drizzle(neon(databaseUrl), { schema });

const demoWords = [
  {
    word: "abandon",
    partOfSpeech: "v.",
    translationCn: "放弃；抛弃",
    sentence: "They had to abandon the plan.",
    sentenceTranslationCn: "他们不得不放弃这个计划。",
  },
  {
    word: "available",
    partOfSpeech: "adj.",
    translationCn: "可获得的；有空的",
    sentence: "The doctor is available this afternoon.",
    sentenceTranslationCn: "医生今天下午有空。",
  },
  {
    word: "maintain",
    partOfSpeech: "v.",
    translationCn: "维持；保持",
    sentence: "It is important to maintain a healthy lifestyle.",
    sentenceTranslationCn: "保持健康的生活方式很重要。",
  },
] as const;

async function ensureDemoCourse() {
  const existing = await db.query.courses.findFirst({
    where: eq(schema.courses.title, "CET-4 Vocabulary Demo"),
  });

  if (existing) {
    const [course] = await db
      .update(schema.courses)
      .set({ imageSrc: "/learn.svg" })
      .where(eq(schema.courses.id, existing.id))
      .returning();

    return course;
  }

  const [course] = await db
    .insert(schema.courses)
    .values({ title: "CET-4 Vocabulary Demo", imageSrc: "/learn.svg" })
    .returning();

  return course;
}

async function ensureDemoUnit(courseId: number) {
  const existing = await db.query.units.findFirst({
    where: and(
      eq(schema.units.courseId, courseId),
      eq(schema.units.title, "Unit 1 · Core Vocabulary")
    ),
  });

  const values = {
    title: "Unit 1 · Core Vocabulary",
    description: "Master three essential CET-4 words",
    order: 1,
  };

  if (existing) {
    const [unit] = await db
      .update(schema.units)
      .set(values)
      .where(eq(schema.units.id, existing.id))
      .returning();

    return unit;
  }

  const [unit] = await db
    .insert(schema.units)
    .values({ ...values, courseId })
    .returning();

  return unit;
}

async function ensureDemoLesson(unitId: number) {
  const existing = await db.query.lessons.findFirst({
    where: and(
      eq(schema.lessons.unitId, unitId),
      eq(schema.lessons.title, "Lesson 1")
    ),
  });

  if (existing) {
    const [lesson] = await db
      .update(schema.lessons)
      .set({ order: 1 })
      .where(eq(schema.lessons.id, existing.id))
      .returning();

    return lesson;
  }

  const [lesson] = await db
    .insert(schema.lessons)
    .values({ title: "Lesson 1", unitId, order: 1 })
    .returning();

  return lesson;
}

async function ensureDemoWord(
  entry: (typeof demoWords)[number],
  lessonId: number,
  order: number
) {
  const normalizedWord = normalizeWord(entry.word);
  const existing = await db.query.words.findFirst({
    where: eq(schema.words.normalizedWord, normalizedWord),
  });

  const wordValues = {
    word: entry.word,
    normalizedWord,
    partOfSpeech: entry.partOfSpeech,
    translationCn: entry.translationCn,
    updatedAt: new Date(),
  };

  const word = existing
    ? (
        await db
          .update(schema.words)
          .set(wordValues)
          .where(eq(schema.words.id, existing.id))
          .returning()
      )[0]
    : (await db.insert(schema.words).values(wordValues).returning())[0];

  const existingExample = await db.query.wordExamples.findFirst({
    where: and(
      eq(schema.wordExamples.wordId, word.id),
      eq(schema.wordExamples.sentence, entry.sentence)
    ),
  });

  const exampleValues = {
    translationCn: entry.sentenceTranslationCn,
    source: "vocabulary-demo",
  };

  if (existingExample) {
    await db
      .update(schema.wordExamples)
      .set(exampleValues)
      .where(eq(schema.wordExamples.id, existingExample.id));
  } else {
    await db.insert(schema.wordExamples).values({
      ...exampleValues,
      wordId: word.id,
      sentence: entry.sentence,
    });
  }

  const existingLessonWord = await db.query.lessonWords.findFirst({
    where: and(
      eq(schema.lessonWords.lessonId, lessonId),
      eq(schema.lessonWords.wordId, word.id)
    ),
  });

  if (existingLessonWord) {
    await db
      .update(schema.lessonWords)
      .set({ order })
      .where(eq(schema.lessonWords.id, existingLessonWord.id));
  } else {
    await db.insert(schema.lessonWords).values({
      lessonId,
      wordId: word.id,
      order,
    });
  }
}

async function main() {
  const course = await ensureDemoCourse();
  const unit = await ensureDemoUnit(course.id);
  const lesson = await ensureDemoLesson(unit.id);

  for (const [index, entry] of demoWords.entries()) {
    await ensureDemoWord(entry, lesson.id, index + 1);
  }

  console.log("Vocabulary demo seeded successfully");
}

void main();
