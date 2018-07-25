const _ = require('lodash');
const { getUserId } = require('../utils');
const { removeProductsOutOfBudget, totalPrice } = require('./priceProduct');
const {
  isShowMilkInsideProducts, isShowVegetarienProducts, isShowVegetalienProducts,
  isShowCookedMealProducts,
} = require('./selectProduct');

function pickOneProductPerCategory(products, priceQualityProfile) {
  const productsByCategory = _.groupBy(products, 'category.title');

  return Object.keys(productsByCategory).map((key) => {
    switch (priceQualityProfile) {
      case 'BEST_PRICE':
        return _.minBy(productsByCategory[key], 'price');
      case 'BEST_PRICE_QUALITY_RATIO':
        return _.maxBy(productsByCategory[key], 'priceQualityRatio');
      case 'BEST_QUALITY':
        return _.maxBy(productsByCategory[key], 'qualityRate');
      default:
        break;
    }
    return '';
  });
}

async function getProductsFromUser(ctx) {
  const userId = getUserId(ctx);

  const {
    isCooking, isLactoseIntolerant,
    isVegetarien, isVegetalien,
    falseAllowedProductIds, falseForbiddenProductIds,
  } = await ctx.db.query.user({ where: { id: userId } }, `{
      isCooking, isLactoseIntolerant, isVegetarien, isVegetalien,
      falseAllowedProductIds, falseForbiddenProductIds
    }`);

  const productFields = '{ id title category {id title} }';

  let allowedProducts = await ctx.db.query.products({
    where: Object.assign({},
      isShowMilkInsideProducts(isLactoseIntolerant),
      isShowCookedMealProducts(isCooking),
      isShowVegetarienProducts(isVegetarien),
      isShowVegetalienProducts(isVegetalien)),
  }, productFields);

  const allProducts = await ctx.db.query.products(null, productFields);


  function filterFalseAllowedProducts(product) {
    return !falseAllowedProductIds.find(falseAllowedProduct => falseAllowedProduct === product.id);
  }

  allowedProducts = _.filter(allowedProducts, filterFalseAllowedProducts);

  // Add false forbidden products, false negative
  const falseForbiddenProducts = await ctx.db.query.products({
    where: { id_in: falseForbiddenProductIds },
  }, productFields);

  allowedProducts = allowedProducts.concat(falseForbiddenProducts);

  const forbiddenProducts = _.differenceWith(allProducts, allowedProducts, _.isEqual);

  return {
    id: Math.floor(Math.random() * 1000),
    allowed: allowedProducts,
    forbidden: forbiddenProducts,
  };
}

async function getAllowedSelectedProducts(ctx, info) {
  const cartId = info.variableValues.id;

  const { selectedCategories } = await ctx.db.query
    .cart({ where: { id: cartId } }, '{selectedCategories { products {id title}} }');

  const selectedProductIds = selectedCategories
    .map(category => category.products)
    .reduce((a, b) => a.concat(b), [])
    .map(a => a.id);

  const userProducts = await getProductsFromUser(ctx);

  const forbiddenProductIds = userProducts.forbidden
    .reduce((a, b) => a.concat(b), [])
    .map(a => a.id);

  const allowedSelectedProductIds = _
    .differenceWith(selectedProductIds, forbiddenProductIds, _.isEqual);

  return ctx.db.query.products({
    where: { id_in: allowedSelectedProductIds },
  }, '{id title price qualityRate priceQualityRatio category {id title}}');
}

async function getProductsFromCart(root, args, ctx, info) {
  const userId = getUserId(ctx);

  const allowedSelectedProducts = await getAllowedSelectedProducts(ctx, info);

  const { weeklyBudget, priceQualityProfile } = await ctx.db.query.user({ where: { id: userId } },
    '{weeklyBudget priceQualityProfile}');

  const pickedProducts = pickOneProductPerCategory(allowedSelectedProducts, priceQualityProfile);

  const productsInBudget = removeProductsOutOfBudget(pickedProducts, weeklyBudget);
  const productOutBudget = _.differenceWith(pickedProducts, productsInBudget, _.isEqual);

  return {
    included: productsInBudget,
    total: totalPrice(productsInBudget),
    excluded: productOutBudget,
  };
}


module.exports = {
  getProductsFromCart,
  getProductsFromUser,
};
