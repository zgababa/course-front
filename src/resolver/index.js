
const { forwardTo } = require('prisma-binding');
const { scrapProduct, scrapProducts, scrapCategories } = require('./mutation/scrapMutation');
const { getProductsFromCart, getProductsFromUser } = require('./query/productQuery');
const { me, signup, login } = require('./auth');


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
      me,
    },
    Mutation: {
      scrapProduct,
      scrapProducts,
      scrapCategories,
      createCart: forwardTo('db'),
      createUser: forwardTo('db'),
      updateUser: forwardTo('db'),
      updateProduct: forwardTo('db'),
      signup,
      login,
    },
    AuthPayload: {
      user: async ({ user: { id } }, args, ctx, info) => ctx.db.query.user({ where: { id } }, info),
    },
    User: {
      products: async (root, args, ctx) => getProductsFromUser(ctx),
    },
    Cart: {
      products: async (root, args, Context) => getProductsFromCart(root, args, Context),
    },
  },
};
