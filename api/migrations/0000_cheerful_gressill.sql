CREATE TYPE "public"."post_type" AS ENUM('question', 'answer');--> statement-breakpoint
CREATE TABLE "answers" (
	"answers_id" serial PRIMARY KEY NOT NULL,
	"post_id" integer,
	"body" text NOT NULL,
	"creation_date" date NOT NULL,
	"score" integer NOT NULL,
	"is_accepted" boolean NOT NULL,
	"user_id" integer,
	"question_id" integer
);
--> statement-breakpoint
CREATE TABLE "comments" (
	"comment_id" serial PRIMARY KEY NOT NULL,
	"body" text NOT NULL,
	"creation_date" date NOT NULL,
	"user_id" integer,
	"post_id" integer
);
--> statement-breakpoint
CREATE TABLE "posts" (
	"post_id" serial PRIMARY KEY NOT NULL,
	"post_type" "post_type",
	"creation_date" date NOT NULL,
	"score" integer NOT NULL,
	"link" text NOT NULL,
	"user_id" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "question_tags" (
	"question_id" integer,
	"tag_id" integer,
	CONSTRAINT "question_tags_question_id_tag_id_pk" PRIMARY KEY("question_id","tag_id")
);
--> statement-breakpoint
CREATE TABLE "questions" (
	"question_id" serial PRIMARY KEY NOT NULL,
	"post_id" integer NOT NULL,
	"title" text NOT NULL,
	"body" text NOT NULL,
	"is_answered" boolean NOT NULL,
	"answer_count" integer DEFAULT 0,
	"view_count" integer DEFAULT 0,
	"creation_date" date NOT NULL,
	"score" integer NOT NULL,
	"user_id" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tags" (
	"tag_id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"has_synonyms" boolean NOT NULL,
	"is_moderator_only" boolean NOT NULL,
	"is_required" boolean NOT NULL,
	"count" integer DEFAULT 0
);
--> statement-breakpoint
CREATE TABLE "users" (
	"user_id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"reputation" integer NOT NULL,
	"creation_date" date NOT NULL,
	"is_employee" boolean NOT NULL,
	"location" text NOT NULL
);
--> statement-breakpoint
ALTER TABLE "answers" ADD CONSTRAINT "answers_post_id_posts_post_id_fk" FOREIGN KEY ("post_id") REFERENCES "public"."posts"("post_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "answers" ADD CONSTRAINT "answers_user_id_users_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("user_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "answers" ADD CONSTRAINT "answers_question_id_questions_question_id_fk" FOREIGN KEY ("question_id") REFERENCES "public"."questions"("question_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "comments" ADD CONSTRAINT "comments_user_id_users_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("user_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "comments" ADD CONSTRAINT "comments_post_id_posts_post_id_fk" FOREIGN KEY ("post_id") REFERENCES "public"."posts"("post_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "posts" ADD CONSTRAINT "posts_user_id_users_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("user_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "question_tags" ADD CONSTRAINT "question_tags_question_id_questions_question_id_fk" FOREIGN KEY ("question_id") REFERENCES "public"."questions"("question_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "question_tags" ADD CONSTRAINT "question_tags_tag_id_tags_tag_id_fk" FOREIGN KEY ("tag_id") REFERENCES "public"."tags"("tag_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "questions" ADD CONSTRAINT "questions_post_id_posts_post_id_fk" FOREIGN KEY ("post_id") REFERENCES "public"."posts"("post_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "questions" ADD CONSTRAINT "questions_user_id_users_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("user_id") ON DELETE no action ON UPDATE no action;