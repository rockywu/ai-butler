import { Type } from 'typebox';

export const AppEnvSchema = Type.Union([
  Type.Literal('development'),
  Type.Literal('production'),
  Type.Literal('test'),
]);

export const LogLevelSchema = Type.Union([
  Type.Literal('debug'),
  Type.Literal('error'),
  Type.Literal('fatal'),
  Type.Literal('info'),
  Type.Literal('silent'),
  Type.Literal('trace'),
  Type.Literal('warn'),
]);

export const AppConfigSchema = Type.Object({
  appEnv: AppEnvSchema,
  databaseUrl: Type.Optional(Type.String({ minLength: 1 })),
  host: Type.String({ minLength: 1 }),
  logLevel: LogLevelSchema,
  openapiUiEnabled: Type.Boolean(),
  port: Type.Integer({ maximum: 65_535, minimum: 0 }),
});

export type AppEnv = 'development' | 'production' | 'test';
export type LogLevel =
  | 'debug'
  | 'error'
  | 'fatal'
  | 'info'
  | 'silent'
  | 'trace'
  | 'warn';

export type AppConfig = Readonly<{
  appEnv: AppEnv;
  databaseUrl?: string;
  host: string;
  logLevel: LogLevel;
  openapiUiEnabled: boolean;
  port: number;
}>;
