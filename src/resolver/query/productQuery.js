const _ = require('lodash');

function priceProduct(products) {
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

async function getProductsFromCart(root, args, ctx, info) {
  const cart = await ctx.db.query.cart({where: {id : args.cartId}}, '{categoriesSelected { products {id price title}} }');
  const productsIds = cart.categoriesSelected.map(category => {
    const pickOneProduct = _.uniqBy(priceProduct(category.products), 'title');
    return closet(pickOneProduct, args.percent);
  }).reduce((a, b) => a.concat(b), []).map(a => a.id);

  return ctx.db.query.products({where: {id_in : productsIds}}, info);
}


module.exports = {
  getProductsFromCart
}
