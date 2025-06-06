CREATE TABLE "answers" (
	"answers_id" serial PRIMARY KEY NOT NULL,
	"body" text NOT NULL,
	"creation_date" date NOT NULL,
	"score" integer DEFAULT 0,
	"is_accepted" boolean NOT NULL,
	"user_id" integer,
	"question_id" integer
);
--> statement-breakpoint
CREATE TABLE "comments" (
	"comment_id" serial PRIMARY KEY NOT NULL,
	"body" text NOT NULL,
	"creation_date" date NOT NULL,
	"link" text NOT NULL,
	"user_id" integer
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
	"title" text NOT NULL,
	"is_answered" boolean NOT NULL,
	"answer_count" integer DEFAULT 0,
	"view_count" integer DEFAULT 0,
	"creation_date" date NOT NULL,
	"score" integer DEFAULT 0,
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
	"reputation" integer DEFAULT 0,
	"link" text
);
--> statement-breakpoint
ALTER TABLE "answers" ADD CONSTRAINT "answers_user_id_users_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("user_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "answers" ADD CONSTRAINT "answers_question_id_questions_question_id_fk" FOREIGN KEY ("question_id") REFERENCES "public"."questions"("question_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "comments" ADD CONSTRAINT "comments_user_id_users_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("user_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "question_tags" ADD CONSTRAINT "question_tags_question_id_questions_question_id_fk" FOREIGN KEY ("question_id") REFERENCES "public"."questions"("question_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "question_tags" ADD CONSTRAINT "question_tags_tag_id_tags_tag_id_fk" FOREIGN KEY ("tag_id") REFERENCES "public"."tags"("tag_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "questions" ADD CONSTRAINT "questions_user_id_users_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("user_id") ON DELETE no action ON UPDATE no action;