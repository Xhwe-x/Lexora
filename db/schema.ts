import { relations } from "drizzle-orm";
import {
  boolean,
  integer,
  pgEnum,
  pgTable,
  serial,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";

import { MAX_HEARTS } from "@/constants";

export const courses = pgTable("courses", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  imageSrc: text("image_src").notNull(),
});

export const coursesRelations = relations(courses, ({ many }) => ({
  userProgress: many(userProgress),
  units: many(units),
}));

export const units = pgTable("units", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(), // Unit 1
  description: text("description").notNull(), // Learn the basics of spanish
  courseId: integer("course_id")
    .references(() => courses.id, {
      onDelete: "cascade",
    })
    .notNull(),
  order: integer("order").notNull(),
});

export const unitsRelations = relations(units, ({ many, one }) => ({
  course: one(courses, {
    fields: [units.courseId],
    references: [courses.id],
  }),
  lessons: many(lessons),
}));

export const lessons = pgTable("lessons", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  unitId: integer("unit_id")
    .references(() => units.id, {
      onDelete: "cascade",
    })
    .notNull(),
  order: integer("order").notNull(),
});

export const lessonsRelations = relations(lessons, ({ one, many }) => ({
  unit: one(units, {
    fields: [lessons.unitId],
    references: [units.id],
  }),
  challenges: many(challenges),
  lessonWords: many(lessonWords),
}));

export const words = pgTable("words", {
  id: serial("id").primaryKey(),
  word: text("word").notNull().unique(),
  normalizedWord: text("normalized_word").notNull().unique(),
  phonetic: text("phonetic"),
  partOfSpeech: text("part_of_speech"),
  translationCn: text("translation_cn").notNull(),
  cefrLevel: text("cefr_level"),
  difficultyLevel: integer("difficulty_level").notNull().default(1),
  audioSrc: text("audio_src"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const wordsRelations = relations(words, ({ many }) => ({
  examples: many(wordExamples),
  lessonWords: many(lessonWords),
  userWordProgress: many(userWordProgress),
  exerciseAttempts: many(exerciseAttempts),
}));

export const wordExamples = pgTable("word_examples", {
  id: serial("id").primaryKey(),
  wordId: integer("word_id")
    .references(() => words.id, { onDelete: "cascade" })
    .notNull(),
  sentence: text("sentence").notNull(),
  translationCn: text("translation_cn"),
  difficultyLevel: integer("difficulty_level").notNull().default(1),
  source: text("source").notNull().default("seed"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const wordExamplesRelations = relations(wordExamples, ({ one }) => ({
  word: one(words, {
    fields: [wordExamples.wordId],
    references: [words.id],
  }),
}));

export const lessonWords = pgTable(
  "lesson_words",
  {
    id: serial("id").primaryKey(),
    lessonId: integer("lesson_id")
      .references(() => lessons.id, { onDelete: "cascade" })
      .notNull(),
    wordId: integer("word_id")
      .references(() => words.id, { onDelete: "cascade" })
      .notNull(),
    order: integer("order").notNull(),
  },
  (table) => [
    uniqueIndex("lesson_words_lesson_id_word_id_unique").on(
      table.lessonId,
      table.wordId
    ),
  ]
);

export const lessonWordsRelations = relations(lessonWords, ({ one }) => ({
  lesson: one(lessons, {
    fields: [lessonWords.lessonId],
    references: [lessons.id],
  }),
  word: one(words, {
    fields: [lessonWords.wordId],
    references: [words.id],
  }),
}));

export const userWordProgress = pgTable(
  "user_word_progress",
  {
    id: serial("id").primaryKey(),
    userId: text("user_id").notNull(),
    wordId: integer("word_id")
      .references(() => words.id, { onDelete: "cascade" })
      .notNull(),
    masteryLevel: integer("mastery_level").notNull().default(0),
    meaningCorrect: integer("meaning_correct").notNull().default(0),
    meaningWrong: integer("meaning_wrong").notNull().default(0),
    spellingCorrect: integer("spelling_correct").notNull().default(0),
    spellingWrong: integer("spelling_wrong").notNull().default(0),
    contextCorrect: integer("context_correct").notNull().default(0),
    contextWrong: integer("context_wrong").notNull().default(0),
    correctCount: integer("correct_count").notNull().default(0),
    wrongCount: integer("wrong_count").notNull().default(0),
    lastWrongAt: timestamp("last_wrong_at"),
    lastAnsweredAt: timestamp("last_answered_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("user_word_progress_user_id_word_id_unique").on(
      table.userId,
      table.wordId
    ),
  ]
);

export const userWordProgressRelations = relations(
  userWordProgress,
  ({ one }) => ({
    word: one(words, {
      fields: [userWordProgress.wordId],
      references: [words.id],
    }),
  })
);

export const exerciseAttempts = pgTable("exercise_attempts", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),
  wordId: integer("word_id")
    .references(() => words.id, { onDelete: "cascade" })
    .notNull(),
  lessonId: integer("lesson_id").references(() => lessons.id, {
    onDelete: "set null",
  }),
  exerciseType: text("exercise_type").notNull(),
  userAnswer: text("user_answer"),
  correctAnswer: text("correct_answer").notNull(),
  correct: boolean("correct").notNull(),
  responseMs: integer("response_ms"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const exerciseAttemptsRelations = relations(
  exerciseAttempts,
  ({ one }) => ({
    word: one(words, {
      fields: [exerciseAttempts.wordId],
      references: [words.id],
    }),
    lesson: one(lessons, {
      fields: [exerciseAttempts.lessonId],
      references: [lessons.id],
    }),
  })
);

export const challengesEnum = pgEnum("type", ["SELECT", "ASSIST"]);

export const challenges = pgTable("challenges", {
  id: serial("id").primaryKey(),
  lessonId: integer("lesson_id")
    .references(() => lessons.id, {
      onDelete: "cascade",
    })
    .notNull(),
  type: challengesEnum("type").notNull(),
  question: text("question").notNull(),
  order: integer("order").notNull(),
});

export const challengesRelations = relations(challenges, ({ one, many }) => ({
  lesson: one(lessons, {
    fields: [challenges.lessonId],
    references: [lessons.id],
  }),
  challengeOptions: many(challengeOptions),
  challengeProgress: many(challengeProgress),
}));

export const challengeOptions = pgTable("challenge_options", {
  id: serial("id").primaryKey(),
  challengeId: integer("challenge_id")
    .references(() => challenges.id, {
      onDelete: "cascade",
    })
    .notNull(),
  text: text("text").notNull(),
  correct: boolean("correct").notNull(),
  imageSrc: text("image_src"),
  audioSrc: text("audio_src"),
});

export const challengeOptionsRelations = relations(
  challengeOptions,
  ({ one }) => ({
    challenge: one(challenges, {
      fields: [challengeOptions.challengeId],
      references: [challenges.id],
    }),
  })
);

export const challengeProgress = pgTable("challenge_progress", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),
  challengeId: integer("challenge_id")
    .references(() => challenges.id, {
      onDelete: "cascade",
    })
    .notNull(),
  completed: boolean("completed").notNull().default(false),
});

export const challengeProgressRelations = relations(
  challengeProgress,
  ({ one }) => ({
    challenge: one(challenges, {
      fields: [challengeProgress.challengeId],
      references: [challenges.id],
    }),
  })
);

export const userProgress = pgTable("user_progress", {
  userId: text("user_id").primaryKey(),
  userName: text("user_name").notNull().default("User"),
  userImageSrc: text("user_image_src").notNull().default("/mascot.svg"),
  activeCourseId: integer("active_course_id").references(() => courses.id, {
    onDelete: "cascade",
  }),
  hearts: integer("hearts").notNull().default(MAX_HEARTS),
  points: integer("points").notNull().default(0),
});

export const userProgressRelations = relations(userProgress, ({ one }) => ({
  activeCourse: one(courses, {
    fields: [userProgress.activeCourseId],
    references: [courses.id],
  }),
}));

export const userSubscription = pgTable("user_subscription", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull().unique(),
  stripeCustomerId: text("stripe_customer_id").notNull().unique(),
  stripeSubscriptionId: text("stripe_subscription_id").notNull().unique(),
  stripePriceId: text("stripe_price_id").notNull(),
  stripeCurrentPeriodEnd: timestamp("stripe_current_period_end").notNull(),
});
