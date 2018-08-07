const _ = require('lodash');

async function removeFalseAllowedProductFromCart(root, { userId, productId, cartId }, ctx, info) {
  const { falseAllowedProductIds } = await ctx.db.query.user({ where: { id: userId } }, '{ falseAllowedProductIds }');

  if (falseAllowedProductIds.includes(productId)) {
    return ctx.db.query.cart({ where: { id: cartId } }, info);
  }

  const addToFalseAllowedProducts = falseAllowedProductIds.concat(productId);

  await ctx.db.mutation.updateUser({
    where: { id: userId },
    data: {
      falseAllowedProductIds: {
        set: addToFalseAllowedProducts,
      },
    },
  });

  return ctx.db.mutation.updateCart({
    where: { id: cartId },
    data: {
      products: {
        update: {
          included: {
            disconnect: [{ id: productId }],
          },
        },
      },
    },
  }, info);
}

async function removeProductFromCart(root, { productId, cartId }, ctx, info) {
  return ctx.db.mutation.updateCart({
    where: { id: cartId },
    data: {
      products: {
        update: {
          included: {
            disconnect: [{ id: productId }],
          },
        },
      },
    },
  }, info);
}

async function addMoreProductToCart(root, { cartId, cartProductId, quantity }, ctx, info) {
  return ctx.db.mutation.updateCart({
    where: { id: cartId },
    data: {
      products: {
        update: {
          included: {
            update: {
              where: {
                id: cartProductId,
              },
              data: {
                quantity,
              },
            },
          },

        },
      },
    },
  }, info);
}

module.exports = { removeFalseAllowedProductFromCart, removeProductFromCart, addMoreProductToCart };
