const _ = require('lodash');
const winston = require('winston');

function productsWithPriceInPercent(products) {
  function normalize(val, min, max) {
    return Math.floor(((val - min) / (max - min) * 100));
  }
  return products
    .sort((a, b) => a.price - b.price)
    .map((product, index, pSorted) => Object.assign({}, {
      pricePercent: normalize(product.price, pSorted[0].price, pSorted[products.length - 1].price),
    }, product));
}

function closet(productsPrice, goal) {
  return productsPrice.reduce((prev, curr) => {
    if (Math.abs(curr.pricePercent - goal) < Math.abs(prev.pricePercent - goal)) {
      return curr;
    }
    return prev;
  });
}

function totalPrice(products) {
  return products.reduce((total, curr) => (total + curr.price), 0);
}

function removeProductsOutOfBudget(products, budget) {
  // Si le total est au dessus du budget on supprime l'article le plus cher et on recommence
  const productTotalPrice = totalPrice(products);

  if (productTotalPrice > budget) {
    const productToRemove = _.maxBy(products, 'price');
    winston.info(`Suppression de ${productToRemove.title}, car ${productTotalPrice} superieur au budget de ${budget} €`);
    const removeHigherProductPrice = products.filter(product => product.id !== productToRemove.id);
    return removeProductsOutOfBudget(removeHigherProductPrice, budget);
  }

  return products;
}


module.exports = {
  productsWithPriceInPercent,
  closet,
  totalPrice,
  removeProductsOutOfBudget,
};
