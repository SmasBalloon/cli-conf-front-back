import { type RouteConfig, route } from "@react-router/dev/routes";

export default [
  route("/", "./welcome/welcome.tsx"),
  ] satisfies RouteConfig;
