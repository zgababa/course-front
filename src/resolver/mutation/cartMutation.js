async function removeProductFromCart(root, { productId, cartId }, ctx, info) {
  const { products } = await ctx.db.query.cart({ where: { id: cartId } }, '{products {included { id product { id } }}}');
  const cartProductIncludedId = products.included.find(item => item.product.id === productId).id;
  return ctx.db.mutation.updateCart({
    where: { id: cartId },
    data: {
      products: {
        update: {
          included: {
            disconnect: [{ id: cartProductIncludedId }],
          },
        },
      },
    },
  }, info);
}


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

  return removeProductFromCart(null, { productId, cartId }, ctx, info);
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
