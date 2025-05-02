import { createBrowserRouter, RouterProvider } from "react-router-dom";
import Console from "./components/Console";
import ManualScoringPage from "./pages/ManualScoringPage";
import LoginPage from "./pages/LoginPage";
import OverlayPage from "./pages/OverlayPage";
import OverlaySVGPage from "./pages/OverlaySVGPage";
import OverlayFromFigma from "./pages/OverlayFromFigma";  
const router = createBrowserRouter([
  {
    path: "/",
    element: <Console />
  },
  {
    path: "/manual/:gameId",
    element: <ManualScoringPage />
  },
  {
    path: "/overlay/:gameId",
    element: <OverlayPage />
  },
  {
    path: "/overlaysvg/:gameId",
    element: <OverlaySVGPage />
  },
  {
    path: "/overlayfigma/:gameId",
    element: <OverlayFromFigma showGrid={false} />
  },
  {
    path: "/login",
    element: <LoginPage />
  }
]);

const AppRouter = () => <RouterProvider router={router} />;

export default AppRouter;
