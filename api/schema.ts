import { relations } from "drizzle-orm";
import { pgEnum, pgTable, serial, text, integer, date, primaryKey, boolean } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
    user_id: serial().primaryKey(),
    name: text().notNull(),
    reputation: integer().notNull(),
    creation_date: date().notNull(),
    is_employee: boolean().notNull(),
    location: text().notNull(),
});

export const usersRelations = relations(users, ({ many }) => ({
    posts: many(posts),
}));

export const postType = pgEnum('post_type', ["question", "answer"]);

export const posts = pgTable("posts", {
    post_id: serial().primaryKey(),
    post_type: postType(),
    creation_date: date().notNull(),
    score: integer().notNull(),
    link: text().notNull(), // TODO: Check if it's valid link
    user_id: integer().notNull().references(() => users.user_id),
});

export const postsRelations = relations(posts, ({ one }) => ({
    author: one(users, {
        fields: [posts.user_id],
        references: [users.user_id],
    }),
}));

export const questions = pgTable("questions", {
    question_id: serial().primaryKey(),
    post_id: integer().notNull().references(() => posts.post_id),
    title: text().notNull(),
    body: text().notNull(),
    is_answered: boolean().notNull(),
    answer_count: integer().default(0),
    view_count: integer().default(0),
    creation_date: date().notNull(),
    score: integer().notNull(),
    user_id: integer().notNull().references(() => users.user_id),
});

export const questionsRelations = relations(questions, ({ one }) => ({
    post: one(posts, {
        fields: [questions.post_id],
        references: [posts.post_id],
    }),
    user: one(users, {
        fields: [questions.user_id],
        references: [users.user_id],
    }),
}));

export const answers = pgTable("answers", {
    answers_id: serial().primaryKey(),
    post_id: integer().references(() => posts.post_id),
    body: text().notNull(),
    creation_date: date().notNull(),
    score: integer().notNull(),
    is_accepted: boolean().notNull(),
    user_id: integer().references(() => users.user_id),
    question_id: integer().references(() => questions.question_id),
});

export const answersRelations = relations(answers, ({ one }) => ({
    post: one(posts, {
        fields: [answers.post_id],
        references: [posts.post_id],
    }),
    user: one(users, {
        fields: [answers.user_id],
        references: [users.user_id],
    }),
}));

export const comments = pgTable("comments", {
    comment_id: serial().primaryKey(),
    body: text().notNull(),
    creation_date: date().notNull(),
    user_id: integer().references(() => users.user_id),
    post_id: integer().references(() => posts.post_id),
});

export const commentsRelations = relations(comments, ({ one }) => ({
    post: one(posts, {
        fields: [comments.post_id],
        references: [posts.post_id],
    }),
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

export const questionTags = pgTable("question_tags", {
    question_id: integer().references(() => questions.question_id),
    tag_id: integer().references(() => tags.tag_id),
}, (table) => [
    primaryKey({ columns: [table.question_id, table.tag_id] })
]);
