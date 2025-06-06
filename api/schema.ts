import { relations } from "drizzle-orm";
import { pgTable, serial, text, integer, date, primaryKey, boolean } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
    user_id: serial().primaryKey(),
    name: text().notNull(),
    reputation: integer().default(0),
    link: text(),
});

export type User = typeof users.$inferSelect;


export const questions = pgTable("questions", {
    question_id: serial().primaryKey(),
    title: text().notNull(),
    is_answered: boolean().notNull(),
    answer_count: integer().default(0),
    view_count: integer().default(0),
    creation_date: date().notNull(),
    score: integer().default(0),
    user_id: integer().notNull().references(() => users.user_id),
});

export interface Question {
    question_id: number;
    title: string;
    is_answered: boolean;
    answer_count: number | null;
    view_count: number | null;
    creation_date: string;
    score: number | null;
    user_id: number;
};

export const questionsRelations = relations(questions, ({ one }) => ({
    user: one(users, {
        fields: [questions.user_id],
        references: [users.user_id],
    }),
}));

export const answers = pgTable("answers", {
    answers_id: serial().primaryKey(),
    body: text().notNull(),
    creation_date: date().notNull(),
    score: integer().default(0),
    is_accepted: boolean().notNull(),
    user_id: integer().references(() => users.user_id),
    question_id: integer().references(() => questions.question_id),
});

export type Answer = typeof answers.$inferSelect;

export const answersRelations = relations(answers, ({ one }) => ({
    user: one(users, {
        fields: [answers.user_id],
        references: [users.user_id],
    }),
}));

export const comments = pgTable("comments", {
    comment_id: serial().primaryKey(),
    body: text().notNull(),
    creation_date: date().notNull(),
    link: text().notNull(), // TODO: Check if it's valid link
    user_id: integer().references(() => users.user_id),
});

export interface Comment {
    comment_id: number;
    body: string;
    creation_date: string;
    user_id: number | null;
};

export const commentsRelations = relations(comments, ({ one }) => ({
    user: one(users, {
        fields: [comments.user_id],
        references: [users.user_id],
    }),
}));

export const tags = pgTable("tags", {
    tag_id: serial().primaryKey(),
    name: text().notNull(),
    has_synonyms: boolean().notNull(),
    is_moderator_only: boolean().notNull(),
    is_required: boolean().notNull(),
    count: integer().default(0),
});

export type Tag = typeof tags.$inferSelect;

export const questionTags = pgTable("question_tags", {
    question_id: integer().references(() => questions.question_id),
    tag_id: integer().references(() => tags.tag_id),
}, (table) => [
    primaryKey({ columns: [table.question_id, table.tag_id] })
]);
