import { type RouteConfig, index, route, layout } from "@react-router/dev/routes";

export default [
  layout("routes/components/Layout.jsx", [
    index("routes/index.jsx"),
    route("login", "routes/components/login.jsx"),
    route("signup", "routes/components/signup.jsx"),
    route("add-product", "routes/components/addProduct.jsx"),
    route("sell/register", "routes/components/SellerRegister.jsx"),
    route("sell", "routes/components/Sell.jsx"),
  ]),


  
  //APIs
  route("api/user/*", "server/controller/user.controller.$.js"),
  route("api/merchant/:action", "server/controller/merchant.controller.$.js")
// C:\Users\Itgeeks\Desktop\Practice\Flip-Cart-Remix\Flip-Cart-Remix\app\server\controller\merchant.controller.$.js
] satisfies RouteConfig;
