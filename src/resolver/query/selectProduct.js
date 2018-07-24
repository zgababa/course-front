function isShowMilkInsideProducts(isLactoseIntolerant) {
  const obj = {};
  if (isLactoseIntolerant) {
    obj.isMilkInside = false;
  }
  return obj;
}

function isShowVegetarienProducts(isVegetarien) {
  const obj = {}
  if (isVegetarien) {
    obj.isMeatInside = false;
  }
  return obj;
}

function isShowVegetalienProducts(isVegetalien) {
  const obj = {};
  if (isVegetalien) {
    obj.isEggInside = false;
    obj.isMeatInside = false;
  }
  return obj;
}

function isShowCookedMealProducts(isCooking) {
  const obj = {};
  if (isCooking) {
    obj.isCookedMeal = false;
  } else {
    obj.isCookedMeal = true;
  }
  return obj;
}

module.exports = {
  isShowMilkInsideProducts,
  isShowVegetarienProducts,
  isShowVegetalienProducts,
  isShowCookedMealProducts
};
