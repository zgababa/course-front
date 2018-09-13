
const { forwardTo } = require('prisma-binding');
const { authQueries, authMutations } = require('graphql-authentication');
const { scrapProduct, scrapProducts, scrapCategories } = require('./mutation/scrapMutation');
const { getProductsFromCart, getProductsFromUser } = require('./query/productQuery');

const {
  removeFalseAllowedProductFromCart, removeProductFromCart, addMoreProductToCart, addProductToCart,
} = require('./mutation/cartMutation');
const { addFavouriteProductToUser, removeFavouriteProductToUser } = require('./mutation/userMutation');

module.exports = {
  resolvers: {
    Query: {
      ...authQueries,
      product: forwardTo('db'),
      products: forwardTo('db'),
      categories: forwardTo('db'),
      category: forwardTo('db'),
      cart: forwardTo('db'),
      carts: forwardTo('db'),
      user: forwardTo('db'),
      users: forwardTo('db'),
    },
    Mutation: {
      ...authMutations,
      scrapProduct,
      scrapProducts,
      scrapCategories,
      createCart: forwardTo('db'),
      updateCart: forwardTo('db'),
      createUser: forwardTo('db'),
      updateUser: forwardTo('db'),
      updateProduct: forwardTo('db'),
      removeFalseAllowedProductFromCart,
      removeProductFromCart,
      addMoreProductToCart,
      addFavouriteProductToUser,
      removeFavouriteProductToUser,
      addProductToCart,
    },
    AuthPayload: {
      user: async ({ user: { id } }, args, ctx, info) => ctx.db.query.user({ where: { id } }, info),
    },
    User: {
      products: async (root, args, ctx) => getProductsFromUser(ctx),
    },
    Cart: {
      products: {
        fragment: 'fragment CartId on Cart { id }',
        resolve: async (root, args, ctx, info) => {
          if (!root.products) {
            return getProductsFromCart(root, args, ctx, info);
          }
          return root.products;
        },
      },
    },
  },
};
