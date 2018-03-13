const scrapProductsByCategory = require('../../../../scrapping/product/productByCategory.js');

module.exports = {
  async scrapProduct(root, { categoryId }, ctx, info) {
    //const { url } = await ctx.db.query.category({ where: { id: categoryId } });
    const url = "https://primenow.amazon.fr/search?ref=sr_nr_n_0&fst=as:off&rh=n:3635788031,p_95:U00E,n:!3635789031,n:6357056031,n:6357058031&bbn=6357056031&ie=UTF8&qid=1504257597&rnid=6357056031"
    const products = await scrapProductsByCategory(url);

    console.log(products);

    await Promise.all(
      products.map(async (product) => {
        return ctx.db.mutation.createProduct({ data: {
          title: product.title,
          imageUrl: product.imageUrl,
          url: product.url,
          category: {
            connect: {
              id: categoryId
            }
          }
        } });
      })
    );
    return ctx.db.query.products(null, info);
  }
};
