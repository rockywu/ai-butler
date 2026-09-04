CREATE TABLE "poc_accounts" (
  "id" text PRIMARY KEY NOT NULL,
  "balance" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "poc_audit_logs" (
  "id" text PRIMARY KEY NOT NULL,
  "account_id" text NOT NULL,
  "event" text NOT NULL,
  CONSTRAINT "poc_audit_logs_account_id_poc_accounts_id_fk"
    FOREIGN KEY ("account_id")
    REFERENCES "public"."poc_accounts"("id")
    ON DELETE no action
    ON UPDATE no action
);
