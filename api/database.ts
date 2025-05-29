import { SQLDatabase } from "encore.dev/storage/sqldb";
import { drizzle } from "drizzle-orm/node-postgres";
import { users } from "./schema";

const db = new SQLDatabase("stackoverflow", {
    migrations: {
        path: "migrations",
        source: "drizzle",
    },
});

const orm = drizzle(db.connectionString);

await orm.select().from(users);
