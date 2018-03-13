
const { scrapProduct } = require('./mutation/scrapMutation');

module.exports = {
  resolvers: {
    Mutation: {
      scrapProduct
    }
  }
};
