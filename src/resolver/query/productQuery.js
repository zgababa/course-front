const _ = require('lodash');
const { getUserId } = require('../utils');
const { removeProductsOutOfBudget, totalPrice } = require('./priceProduct');
const {
  isShowMilkInsideProducts, isShowVegetarienProducts, isShowVegetalienProducts,
  isShowCookedMealProducts,
} = require('./selectProduct');

function pickProductPerCategory(products, priceQualityProfile, duration) {
  const MEAL_PER_DAY = 2;
  const fullMeal = duration * MEAL_PER_DAY;
  const categoryQuantity = {
    'Légumes surgelé': fullMeal,
    'Légumes frais': fullMeal,
    'Fruits frais': fullMeal,
    Viande: fullMeal,
    'Eaux plates': 1,
    'Eaux pétillantes': 1,
    Oeufs: 1,
    Café: 1,
    Thé: 1,
    Lait: 1,
  };

  const productsByCategory = _.groupBy(products, 'category.title');

  return _.flatten(
    Object.keys(productsByCategory).map((key) => {
      switch (priceQualityProfile) {
        case 'BEST_PRICE':
          return _.sortBy(productsByCategory[key], 'price').slice(0, categoryQuantity[key]);
        case 'BEST_PRICE_QUALITY_RATIO':
          return _.sortBy(productsByCategory[key], 'priceQualityRatio').reverse().slice(0, categoryQuantity[key]);
        case 'BEST_QUALITY':
          return _.sortBy(productsByCategory[key], 'qualityRate').reverse().slice(0, categoryQuantity[key]);
        default:
          break;
      }
      return '';
    }),
  );
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

  const { duration } = await ctx.db.query
    .cart({ where: { id: info.variableValues.id } }, '{ duration }'); // À optimiser, on devrait avoir l'info dans les args

  const pickedProducts = pickProductPerCategory(
    allowedSelectedProducts, priceQualityProfile, duration,
  );

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
