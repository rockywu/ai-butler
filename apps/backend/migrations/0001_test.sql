CREATE TABLE "test" (
  "id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  "key" varchar(50) NOT NULL,
  "value" jsonb NOT NULL
);
