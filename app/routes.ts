import { type RouteConfig, index, route } from "@react-router/dev/routes";
export default [
  index("routes/index.jsx"),
  route("login", "routes/components/login.jsx"),
  route("signup", "routes/components/signup.jsx"),
  
  
  //APIs
  route("user/signup" , "server/controller/user.controller.$.js")
] satisfies RouteConfig;
