import { createSchema, createYoga } from "graphql-yoga";
import { readFileSync } from "node:fs";
import { createServer } from "node:http";
import { resolvers } from "./schema/resolvers";

const typeDefs = readFileSync(
  new URL("./schema/schema.graphql", import.meta.url),
  "utf8",
);

const schema = createSchema({
  typeDefs,
  resolvers,
});

const yoga = createYoga({
  schema,
});

const server = createServer(yoga);

server.listen(4000, () => {
  console.log("GraphQL server running at http://localhost:4000/graphql");
});