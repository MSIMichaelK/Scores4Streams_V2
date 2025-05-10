import { createBrowserRouter, RouterProvider } from "react-router-dom";
import Console from "./components/Console";
import ManualScoringPage from "./pages/ManualScoringPage";
import LoginPage from "./pages/LoginPage";
import OverlayPage from "./pages/OverlayPage";
import OverlaySVGPage from "./pages/OverlaySVGPage";
import OverlayFromFigma from "./pages/OverlayFromFigma";
import AdminHierarchy from "./pages/AdminHierarchy";

const ErrorFallback = () => <div style={{ padding: "2rem" }}><h1>404 Not Found</h1><p>This page doesn’t exist.</p></div>;

const router = createBrowserRouter([
  {
    path: "/",
    element: <Console />,
    errorElement: <ErrorFallback />
  },
  {
    path: "/console",
    element: <Console />,
    errorElement: <ErrorFallback />
  },
  {
    path: "/admin-hierarchy",
    element: <AdminHierarchy />,
    errorElement: <ErrorFallback />
  },
  {
    path: "/manual/:gameId",
    element: <ManualScoringPage />,
    errorElement: <ErrorFallback />
  },
  {
    path: "/overlay/:gameId",
    element: <OverlayPage />,
    errorElement: <ErrorFallback />
  },
  {
    path: "/overlaysvg/:gameId",
    element: <OverlaySVGPage />,
    errorElement: <ErrorFallback />
  },
  {
    path: "/overlayfigma/:gameId",
    element: <OverlayFromFigma showGrid={false} />,
    errorElement: <ErrorFallback />
  },
  {
    path: "/login",
    element: <LoginPage />,
    errorElement: <ErrorFallback />
  }
]);

const AppRouter = () => <RouterProvider router={router} />;

export default AppRouter;
