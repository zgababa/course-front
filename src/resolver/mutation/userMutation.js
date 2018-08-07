async function addFavouriteProductToUser(root, { userId, productId }, ctx, info) {
  const { favouriteProductsIds } = await ctx.db.query.user({ where: { id: userId } },
    '{favouriteProductsIds}');

  if (favouriteProductsIds.includes(productId)) {
    return ctx.db.query.user({ where: { id: userId } }, info);
  }

  return ctx.db.mutation.updateUser({
    where: { id: userId },
    data: {
      favouriteProductsIds: {
        set: favouriteProductsIds.concat(productId),
      },
    },
  }, info);
}

async function removeFavouriteProductToUser(root, { userId, productId }, ctx, info) {
  const { favouriteProductsIds } = await ctx.db.query.user({ where: { id: userId } },
    '{favouriteProductsIds}');

  return ctx.db.mutation.updateUser({
    where: { id: userId },
    data: {
      favouriteProductsIds: {
        set: favouriteProductsIds.filter(p => p !== productId),
      },
    },
  }, info);
}

module.exports = { addFavouriteProductToUser, removeFavouriteProductToUser };
