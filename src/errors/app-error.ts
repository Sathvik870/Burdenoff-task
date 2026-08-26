import { GraphQLError } from "graphql";

export type AppErrorCode =
  | "VALIDATION_ERROR"
  | "DUPLICATE_RESOURCE"
  | "NOT_FOUND"
  | "DATABASE_ERROR"
  | "INTERNAL_ERROR";

export class AppError extends GraphQLError {
  constructor(
    code: AppErrorCode,
    message: string,
    httpStatus: number,
  ) {
    super(message, {
      extensions: {
        code,
        httpStatus,
      },
    });

    this.name = "AppError";
  }
}