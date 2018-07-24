const _ = require('lodash');

function productsWithPriceInPercent(products) {
  function normalize(val, min, max) {
    return Math.floor(((val - min) / (max - min) * 100));
  }
  return products
    .sort((a, b) => a.price - b.price)
    .map((product, index, pSorted) => {
      return Object.assign({}, {
        pricePercent: normalize(product.price, pSorted[0].price, pSorted[products.length - 1].price)
      }, product);
    });
}

function closet(productsPrice, goal) {
  return productsPrice.reduce(function(prev, curr) {
    return (Math.abs(curr.pricePercent - goal) < Math.abs(prev.pricePercent - goal) ? curr : prev);
  });
}

function totalPrice(products) {
  return products.reduce((total, curr) => {
    return (total + curr.price)
  }, 0)
}

function removeProductsOutOfBudget(products, budget) {
  // Si le total est au dessus du budget on supprime l'article le plus cher et on recommence
  const productTotalPrice = totalPrice(products);

  if(productTotalPrice > budget) {
    console.log("Hors budget car ", productTotalPrice, "superieur au budget : ", budget);
    const productToRemove = _.maxBy(products, 'price');
    console.log("Suppression de ", productToRemove);
    const removeHigherProductPrice = products.filter(product => product.id !== productToRemove.id);
    return removeProductsOutOfBudget(removeHigherProductPrice, budget);
  }

  return products;
}


module.exports = {
  productsWithPriceInPercent,
  closet,
  totalPrice,
  removeProductsOutOfBudget
};
