/**
 * pages.config.js - Page routing configuration
 *
 * This file is AUTO-GENERATED. Do not add imports or modify PAGES manually.
 * Pages are auto-registered when you create files in the ./pages/ folder.
 *
 * THE ONLY EDITABLE VALUE: mainPage
 */
import AdminDashboard from "./pages/AdminDashboard";
import ClientMenu from "./pages/ClientMenu";
import Home from "./pages/Home";
import KitchenDashboard from "./pages/KitchenDashboard";
import OrderConfirmation from "./pages/OrderConfirmation";
import __Layout from "./Layout.jsx";

export const PAGES = {
  Home: Home,
  ClientMenu: ClientMenu,
  OrderConfirmation: OrderConfirmation,
  KitchenDashboard: KitchenDashboard,
  AdminDashboard: AdminDashboard,
};

export const pagesConfig = {
  mainPage: "Home",
  Pages: PAGES,
  Layout: __Layout,
};
