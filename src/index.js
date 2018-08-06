const { GraphQLServer } = require('graphql-yoga');
const { Prisma, extractFragmentReplacements } = require('prisma-binding');
const winston = require('winston');
const chalk = require('chalk');
const { resolvers } = require('./resolver');


const { combine, printf, colorize } = winston.format;
const myFormat = printf(info => `${info.level}: ${chalk.blue(info.message)}`);
const logger = winston.createLogger({
  level: 'info',
  format: combine(
    colorize(),
    myFormat,
  ),
  transports: [
    new winston.transports.Console(),
  ],
});
winston.add(logger);

const fragmentReplacements = extractFragmentReplacements(resolvers);

try {
  const server = new GraphQLServer({
    typeDefs: './src/schema.graphql',
    resolvers,
    resolverValidationOptions: {
      requireResolversForResolveType: false,
    },
    context: req => ({
      ...req,
      db: new Prisma({
        typeDefs: 'src/generated/prisma.graphql',
        endpoint: 'http://localhost:4466', // the endpoint of the Prisma DB service
        secret: 'mysecret123', // specified in database/prisma.yml
        debug: false, // log all GraphQL queryies & mutations
        fragmentReplacements,
      }),
    }),
  });

  server.start(() => winston.info('Server is running on http://localhost:4466'));
} catch (e) {
  winston.error(e);
}
