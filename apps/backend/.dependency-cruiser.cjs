module.exports = {
  forbidden: [
    {
      name: 'no-circular',
      severity: 'error',
      from: {},
      to: { circular: true },
    },
    {
      name: 'framework-must-not-import-modules',
      severity: 'error',
      from: { path: '^src/framework/' },
      to: { path: '^src/modules/' },
    },
    {
      name: 'business-must-not-import-database-clients',
      severity: 'error',
      from: { path: '^src/modules/' },
      to: { path: 'node_modules/(drizzle-orm|postgres)(/|$)' },
    },
    {
      name: 'services-must-not-import-fastify',
      severity: 'error',
      from: { path: '\\.service\\.ts$' },
      to: { path: 'node_modules/fastify(/|$)' },
    },
  ],
  options: {
    doNotFollow: { path: 'node_modules' },
    tsConfig: { fileName: 'tsconfig.json' },
  },
};
