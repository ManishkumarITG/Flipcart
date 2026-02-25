import { Header } from "./components/Header";
import { Outlet } from "react-router";
export function meta() {
  return [
    { title: "FlipCart - Online Shopping" },
    { name: "description", content: "Welcome to React Router!" },
  ];
}


export default function Index() {
  return <>
    <Header />
    <Outlet />
  </>
}
