import { SQLDatabase } from "encore.dev/storage/sqldb";
import { drizzle } from "drizzle-orm/node-postgres";
import { answers, Question, questions, users, Answer } from "./schema";
import { eq, sql } from "drizzle-orm/sql";
import log from "encore.dev/log";
import { APIResponse, QuestionDTO, AnswerDTO } from "./dtos";

const db = new SQLDatabase("agora_vai_13", {
  migrations: {
    path: "migrations",
    source: "drizzle",
  },
});

const orm = drizzle(db.connectionString);

let users_map = new Set<number>();

async function loadQuestionsData() {
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
      "https://api.stackexchange.com/2.3/questions?order=desc&sort=activity&site=stackoverflow&pagesize=100",
    );

    if (!response.ok) {
      throw new Error(`API request failed: ${response.statusText}`);
    }

    const data = (await response.json()) as APIResponse<QuestionDTO>;

    await orm.transaction(async (tx) => {
      let questions_list: Question[] = [];
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

    log.info(
      `Successfully loaded ${data.items.length} questions from Stack Exchange API`,
    );
  } catch (error) {
    log.error(error, "Failed to load initial data from Stack Exchange API");
    throw error; // Re-throw to prevent app from starting with no data
  }
}

async function loadAnswersData() {
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

    const response = await fetch(
      "https://api.stackexchange.com/2.3/answers?order=desc&sort=activity&site=stackoverflow&pagesize=100&filter=withbody",
    );

    if (!response.ok) {
      throw new Error(`API request failed: ${response.statusText}`);
    }

    const data = (await response.json()) as APIResponse<AnswerDTO>;

    await orm.transaction(async (tx) => {
      let answers_list: Answer[] = [];
      for (const item of data.items) {
        if (item.owner.user_id === undefined || !item.owner) {
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

        // search first in questions_list
        if (item.question_id) {
          const result = await tx
            .select()
            .from(questions)
            .where(eq(questions.question_id, item.question_id!));

          if (!result.length) {
            let res = await fetch(
              `https://api.stackexchange.com/2.3/questions/${item.question_id}?site=stackoverflow`,
            );

            const data = ((await res.json()) as APIResponse<QuestionDTO>).items;

            if (!users_map.has(data[0].owner.user_id)) {
              await tx
                .insert(users)
                .values({
                  user_id: data[0].owner.user_id,
                  name: data[0].owner.display_name,
                  reputation: data[0].owner.reputation,
                  link: data[0].owner.link,
                })
                .onConflictDoNothing();
              users_map.add(data[0].owner.user_id);
            }

            await tx
              .insert(questions)
              .values({
                question_id: data[0].question_id,
                title: data[0].title,
                score: data[0].score,
                answer_count: data[0].answer_count,
                view_count: data[0].view_count,
                is_answered: data[0].is_answered,
                user_id: data[0].owner.user_id,
                creation_date:
                  typeof data[0].creation_date === "number"
                    ? new Date(data[0].creation_date * 1000).toISOString()
                    : data[0].creation_date,
              })
              .onConflictDoNothing();
          }
        }

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
