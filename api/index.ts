import { api } from "encore.dev/api";
import { orm } from "./database";
import { Question, questions } from "./schema";

interface GetQuestionResponse {
    questions: Question[];
}
export const getQuestion = api(
    { method: "GET", expose: true, path: "/questions" },
    async (): Promise<GetQuestionResponse> => {
        const results: Question[] = await orm.select().from(questions);

        return { questions: results };
    }
);