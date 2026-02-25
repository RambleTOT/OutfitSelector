import { createBrowserRouter } from "react-router";
import { Registration } from "./screens/Registration";
import { PhoneVerification } from "./screens/PhoneVerification";
import { AdditionalParameters } from "./screens/AdditionalParameters";
import { Login } from "./screens/Login";
import { WardrobeDigitization } from "./screens/WardrobeDigitization";
import { MainLayout } from "./screens/MainLayout";
import { DigitalWardrobe } from "./screens/DigitalWardrobe";
import { Feed } from "./screens/Feed";
import { Home } from "./screens/Home";
import { Favorites } from "./screens/Favorites";
import { Profile } from "./screens/Profile";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: Registration,
  },
  {
    path: "/verify",
    Component: PhoneVerification,
  },
  {
    path: "/additional-params",
    Component: AdditionalParameters,
  },
  {
    path: "/login",
    Component: Login,
  },
  {
    path: "/digitize",
    Component: WardrobeDigitization,
  },
  {
    path: "/app",
    Component: MainLayout,
    children: [
      {
        path: "home",
        Component: Home,
      },
      {
        path: "wardrobe",
        Component: DigitalWardrobe,
      },
      {
        path: "feed",
        Component: Feed,
      },
      {
        path: "favorites",
        Component: Favorites,
      },
      {
        path: "profile",
        Component: Profile,
      },
    ],
  },
]);
