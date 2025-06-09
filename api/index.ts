import { api } from "encore.dev/api";
import { orm } from "./database";
import {
  Answer,
  Comment,
  Question,
  Tag,
  User,
  answers,
  comments,
  questions,
  tags,
  users,
} from "./schema";

interface Response<T> {
  data: T[];
}

export const getQuestion = api(
  { method: "GET", expose: true, path: "/questions" },
  async (): Promise<Response<Question>> => {
    const results: any[] = await orm.select().from(questions);

    return { data: results };
  },
);

export const getAnswers = api(
  { method: "GET", expose: true, path: "/answers" },
  async (): Promise<Response<Answer>> => {
    const results: any[] = await orm.select().from(answers);

    return { data: results };
  },
);

export const getComments = api(
  { method: "GET", expose: true, path: "/comments" },
  async (): Promise<Response<Comment>> => {
    const results: Comment[] = await orm.select().from(comments);

    return { data: results };
  },
);

export const getUsers = api(
  { method: "GET", expose: true, path: "/users" },
  async (): Promise<Response<User>> => {
    const results: User[] = await orm.select().from(users);

    return { data: results };
  },
);

export const getTags = api(
  { method: "GET", expose: true, path: "/tags" },
  async (): Promise<Response<Tag>> => {
    const results: Tag[] = await orm.select().from(tags);

    return { data: results };
  },
);
