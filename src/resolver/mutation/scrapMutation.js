const Promise = require('bluebird');
const winston = require('winston');
const scrapProductsByCategory = require('../../../../scrapping/product/productByCategory.js');
const categoriesJSON = require('../../../../scrapping/category/category.json');

async function createProduct(ctx, category, product) {
  return ctx.db.mutation.createProduct({
    data: {
      title: product.title,
      imageUrl: product.imageUrl,
      url: product.url,
      price: product.price && product.price.replace(',', '.').replace(/\s/g, ''),
      pricePerKilo: product.pricePerKilo && product.pricePerKilo.replace(',', '.').replace(/\s/g, ''),
      isCookedMeal: category.title === 'Légumes surgelé',
      isMeatInside: category.title === 'Viande',
      isMilkInside: category.title === 'Lait',
      isEggInside: category.title === 'Oeufs',
      category: {
        connect: {
          id: category.id,
        },
      },
    },
  });
}

async function scrapProduct(root, { categoryId }, ctx, info) {
  const category = await ctx.db.query.category({ where: { id: categoryId } });
  if (!category.url) throw new Error('No category found !');

  const products = await scrapProductsByCategory(category.title);
  await Promise
    .map(products, product => createProduct(ctx, category, product), { concurrency: 10 })
    .catch(winston.error);

  return ctx.db.query.products(null, info);
}

module.exports = {
  scrapProduct,
  async scrapProducts(root, args, ctx, info) {
    const date = new Date();
    await ctx.db.mutation.deleteManyProducts({ where: { createdAt_lt: date.toISOString() } });
    const categories = await ctx.db.query.categories(null, '{ id }');
    const categoryIds = categories.map(category => category.id);

    await Promise
      .map(categoryIds, id => scrapProduct(root, { categoryId: id }, ctx, info), { concurrency: 1 })
      .catch(winston.error);

    return ctx.db.query.products(null, info);
  },
  async scrapCategories(root, args, ctx, info) {
    const date = new Date();
    await ctx.db.mutation.deleteManyCategories({ where: { createdAt_lt: date.toISOString() } });

    function getSubCategories(categories) {
      return categories.children
        .map(category => (category.children ? category.children : category))
        .reduce((a, b) => a.concat(b), []);
    }

    const subCategories = getSubCategories(categoriesJSON);
    await Promise.all(subCategories.map(async category => ctx.db.mutation.createCategory({
      data: {
        title: category.title,
        url: category.url,
      },
    })));
    return ctx.db.query.categories(null, info);
  },
};
