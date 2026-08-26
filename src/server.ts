import { createSchema, createYoga } from "graphql-yoga";
import { GraphQLError } from "graphql";
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

  maskedErrors: {
    maskError(error) {
      if (error instanceof GraphQLError) {
        const code = error.extensions?.code;

        if (
          code === "VALIDATION_ERROR" ||
          code === "DUPLICATE_RESOURCE" ||
          code === "NOT_FOUND" ||
          code === "DATABASE_ERROR" ||
          code === "INTERNAL_ERROR"
        ) {
          return error;
        }
      }

      return new GraphQLError(
        "Unexpected error.",
        {
          extensions: {
            code: "INTERNAL_ERROR",
          },
        },
      );
    },
  },
});

const server = createServer(yoga);

server.listen(4000, () => {
  console.log("GraphQL server running at http://localhost:4000/graphql");
});