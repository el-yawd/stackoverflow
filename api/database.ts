import { SQLDatabase } from "encore.dev/storage/sqldb";
import { drizzle } from "drizzle-orm/node-postgres";
import {
  answers,
  Question,
  questions,
  users,
  Answer,
  comments,
  Comment,
} from "./schema";
import { sql } from "drizzle-orm/sql";
import log from "encore.dev/log";
import { APIResponse, QuestionDTO, AnswerDTO, CommentDTO } from "./dtos";

const db = new SQLDatabase("agora_vai_39", {
  migrations: {
    path: "migrations",
    source: "drizzle",
  },
});

const orm = drizzle(db.connectionString);

let users_map = new Set<number>();
let questions_map = new Set<number>();
let answers_list: Answer[] = [];
let questions_list: Question[] = [];

async function loadQuestionsData() {
  let questions_ids: (number | null)[] = [];

  try {
    // Check if we already have data
    const existingCount = await orm
      .select({ count: sql<number>`count(*)` })
      .from(questions);

    if (existingCount[0].count > 0) {
      log.info("Data already loaded, skipping initial load");
      return;
    }

    log.info("Starting initial data load from Questions");

    const response = await fetch(
      "https://api.stackexchange.com/2.3/questions?site=stackoverflow&pagesize=100",
    );

    if (!response.ok) {
      throw new Error(`API request failed: ${response.statusText}`);
    }

    const data = (await response.json()) as APIResponse<QuestionDTO>;

    await orm.transaction(async (tx) => {
      for (const item of data.items) {
        if (item.owner.user_id === undefined || !item.owner) {
          log.warn(`Skipping question with missing owner: ${item.question_id}`);
          continue;
        }
        if (!users_map.has(item.owner.user_id)) {
          await tx
            .insert(users)
            .values({
              user_id: item.owner.user_id,
              name: item.owner.display_name,
              reputation: item.owner.reputation,
              link: item.owner.link,
            })
            .onConflictDoNothing();
          users_map.add(item.owner.user_id);
        }

        questions_ids.push(item.question_id);
        questions_map.add(item.question_id);

        questions_list.push({
          question_id: item.question_id,
          title: item.title,
          score: item.score,
          answer_count: item.answer_count,
          view_count: item.view_count,
          is_answered: item.is_answered,
          user_id: item.owner.user_id,
          creation_date:
            typeof item.creation_date === "number"
              ? new Date(item.creation_date * 1000).toISOString()
              : item.creation_date,
        });
      }

      log.debug(`Prepared ${questions_list.length} questions for insertion`);
      await tx.insert(questions).values(questions_list).onConflictDoNothing();
    });

    let questions_ids_formatted = questions_ids.filter((id) => id).join(";");

    let res = await fetch(
      `https://api.stackexchange.com/2.3/questions/${questions_ids_formatted}/comments?site=stackoverflow&pagesize=100&filter=withbody`,
    );

    let res_comments = ((await res.json()) as APIResponse<CommentDTO>).items;

    for (const item of res_comments) {
      if (!users_map.has(item.owner.user_id)) {
        await orm
          .insert(users)
          .values({
            user_id: item.owner.user_id,
            name: item.owner.display_name,
            reputation: item.owner.reputation,
            link: item.owner.link,
          })
          .onConflictDoNothing();
        users_map.add(item.owner.user_id);
      }
    }

    let comments_list = res_comments.map((item) => {
      if (item.comment_id) {
        return {
          comment_id: item.comment_id,
          // Here we're sure that post_id is a question
          question_id: item.post_id,
          answer_id: null,
          user_id: item.owner.user_id,
          creation_date:
            typeof item.creation_date === "number"
              ? new Date(item.creation_date * 1000).toISOString()
              : item.creation_date,
          body: item.body.length >= 1000 ? "Body too long" : item.body,
        };
      }
    });

    await orm.insert(comments).values(comments_list as Comment[]);

    log.info(
      `Successfully loaded ${data.items.length} questions from Stack Exchange API`,
    );
  } catch (error) {
    log.error(error, "Failed to load initial data from Stack Exchange API");
    throw error; // Re-throw to prevent app from starting with no data
  }
}

async function loadAnswersData() {
  let answers_ids: (number | null)[] = [];
  try {
    // Check if we already have data
    const existingCount = await orm
      .select({ count: sql<number>`count(*)` })
      .from(answers);

    if (existingCount[0].count > 0) {
      log.info("Data already loaded, skipping initial load");
      return;
    }

    log.info("Starting initial data load from Answers");

    let response = await fetch(
      "https://api.stackexchange.com/2.3/answers?site=stackoverflow&pagesize=100&filter=withbody",
    );

    if (!response.ok) {
      throw new Error(`API request failed: ${response.statusText}`);
    }

    const data = (await response.json()) as APIResponse<AnswerDTO>;

    await orm.transaction(async (tx) => {
      for (const item of data.items) {
        if (
          item.owner.user_id === undefined ||
          !item.owner ||
          item.owner.user_id === null
        ) {
          log.warn(`Skipping answer with missing owner: ${item.answer_id}`);
          continue;
        }
        if (!users_map.has(item.owner.user_id)) {
          await tx
            .insert(users)
            .values({
              user_id: item.owner.user_id,
              name: item.owner.display_name,
              reputation: item.owner.reputation,
              link: item.owner.link,
            })
            .onConflictDoNothing();
          users_map.add(item.owner.user_id);
        }

        if (item.question_id && !questions_map.has(item.question_id)) {
          continue;
        }

        answers_ids.push(item.answer_id);

        answers_list.push({
          answers_id: item.answer_id,
          body: item.body.length >= 1000 ? "Body too long" : item.body,
          score: item.score,
          is_accepted: item.is_accepted,
          user_id: item.owner.user_id,
          question_id: item.question_id,
          creation_date:
            typeof item.creation_date === "number"
              ? new Date(item.creation_date * 1000).toISOString()
              : item.creation_date,
        });
      }

      log.debug(`Prepared ${answers_list.length} answers for insertion`);
      await tx.insert(answers).values(answers_list).onConflictDoNothing();
    });

    let questions_ids_formatted = answers_ids.filter((id) => id).join(";");

    let res = await fetch(
      `https://api.stackexchange.com/2.3/answers/${questions_ids_formatted}/comments?site=stackoverflow&pagesize=100&filter=withbody`,
    );

    let res_comments = ((await res.json()) as APIResponse<CommentDTO>).items;

    for (const item of res_comments) {
      if (!users_map.has(item.owner.user_id)) {
        await orm
          .insert(users)
          .values({
            user_id: item.owner.user_id,
            name: item.owner.display_name,
            reputation: item.owner.reputation,
            link: item.owner.link,
          })
          .onConflictDoNothing();
        users_map.add(item.owner.user_id);
      }
    }

    log.info("Loading messages");
    let comments_list = res_comments.map((item) => {
      if (item.comment_id) {
        return {
          comment_id: item.comment_id,
          question_id: null,
          // Here we're sure that post_id is an answer
          answer_id: item.post_id,
          user_id: item.owner.user_id,
          creation_date:
            typeof item.creation_date === "number"
              ? new Date(item.creation_date * 1000).toISOString()
              : item.creation_date,
          body: item.body.length >= 1000 ? "Body too long" : item.body,
        };
      }
    });

    log.info("Inserting messages");
    await orm.insert(comments).values(comments_list as Comment[]);

    log.info(
      `Successfully loaded ${data.items.length} answers from Stack Exchange API`,
    );
  } catch (error) {
    log.error(error, "Failed to load initial data from Stack Exchange API");
    throw error; // Re-throw to prevent app from starting with no data
  }
}

// Load data before exporting the orm
await loadQuestionsData();
await loadAnswersData();

export { orm };
