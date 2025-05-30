import { SQLDatabase } from "encore.dev/storage/sqldb";
import { drizzle } from "drizzle-orm/node-postgres";
import { Question, questions, users } from "./schema";
import { sql } from "drizzle-orm/sql";
import log from "encore.dev/log";
import { APIResponse, QuestionDTO } from "./dtos";

const db = new SQLDatabase("stackoverflow", {
    migrations: {
        path: "migrations",
        source: "drizzle",
    },
});

const orm = drizzle(db.connectionString);
async function loadStackOverflowData() {
    let users_map = new Set<number>();
    try {
        // Check if we already have data
        const existingCount = await orm
            .select({ count: sql<number>`count(*)` })
            .from(questions);

        if (existingCount[0].count > 0) {
            log.info("Data already loaded, skipping initial load");
            return;
        }

        log.info("Starting initial data load from Stack Exchange API");

        const response = await fetch(
            "https://api.stackexchange.com/2.3/questions?order=desc&sort=activity&site=stackoverflow&pagesize=100"
        );

        if (!response.ok) {
            throw new Error(`API request failed: ${response.statusText}`);
        }


        const data = await response.json() as APIResponse<QuestionDTO>;

        await orm.transaction(async (tx) => {
            let questions_list: Question[] = [];
            for (const item of data.items) {
                if (item.owner.user_id === undefined || !item.owner) {
                    log.warn(`Skipping question with missing owner: ${item.question_id}`);
                    continue;
                }
                if (!users_map.has(item.owner.user_id)) {
                    await tx.insert(users).values({
                        user_id: item.owner.user_id,
                        name: item.owner.display_name,
                        reputation: item.owner.reputation,
                        link: item.owner.link,
                    });
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
                    creation_date: typeof item.creation_date === "number"
                        ? new Date(item.creation_date * 1000).toISOString()
                        : item.creation_date,
                });
            }

            log.debug(`Prepared ${questions_list.length} questions for insertion`);
            await tx.insert(questions).values(questions_list);
        });

        log.info(`Successfully loaded ${data.items.length} questions from Stack Exchange API`);
    } catch (error) {
        log.error(error, "Failed to load initial data from Stack Exchange API");
        throw error; // Re-throw to prevent app from starting with no data
    }
}

// Load data before exporting the orm
await loadStackOverflowData();

export { orm };