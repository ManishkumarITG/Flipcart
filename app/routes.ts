import { type RouteConfig, index, route, layout } from "@react-router/dev/routes";

export default [
  layout("routes/components/Layout.jsx", [
    index("routes/index.jsx"),
    route("login", "routes/components/login.jsx"),
    route("signup", "routes/components/signup.jsx"),
    route("product/:id", "routes/components/ProductDetail.jsx"),
    route("checkout", "routes/components/Checkout.jsx"),
    route("sell/register", "routes/components/SellerRegister.jsx"),
    route("sell", "routes/components/Sell.jsx"),

    layout("routes/components/merchant/MerchantLayout.jsx", [
      route("merchant", "routes/components/merchant/MerchantDashboard.jsx"),
      route("merchant/products", "routes/components/merchant/MerchantProducts.jsx"),
      route("merchant/products/:id/edit", "routes/components/merchant/MerchantProductEdit.jsx"),
      route("merchant/add-product", "routes/components/addProduct.jsx"),
      route("merchant/orders", "routes/components/merchant/MerchantOrders.jsx"),
    ]),
  ]),

  //APIs
  route("api/user/*", "server/controller/user.controller.$.js"),
  route("api/merchant/:action", "server/controller/merchant.controller.$.js"),
  route("api/product/:action", "server/controller/product.controller.$.js"),
] satisfies RouteConfig;
