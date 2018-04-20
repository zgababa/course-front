
const { forwardTo } = require('prisma-binding')
const { scrapProduct, scrapProducts, scrapCategories } = require('./mutation/scrapMutation');
const { getProductsFromCart } = require('./query/productQuery');

module.exports = {
  resolvers: {
    Query: {
      product: forwardTo('db'),
      products: forwardTo('db'),
      categories: forwardTo('db'),
      category: forwardTo('db'),
      cart: forwardTo('db'),
      carts: forwardTo('db'),
      user: forwardTo('db'),
      users: forwardTo('db'),
      getProductsFromCart
    },
    Mutation: {
      scrapProduct,
      scrapProducts,
      scrapCategories,
      createCart: forwardTo('db'),
      createUser: forwardTo('db'),
    },
  }
};
