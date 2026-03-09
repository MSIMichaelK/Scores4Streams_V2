import { createBrowserRouter, RouterProvider } from "react-router-dom";
import Console from "./components/Console";
import ManualScoringPage from "./pages/ManualScoringPage";
import LoginPage from "./pages/LoginPage";
import OverlayFromFigma from "./pages/OverlayFromFigma";

const ErrorFallback = () => (
  <div style={{ padding: "2rem" }}>
    <h1>404 Not Found</h1>
    <p>This page doesn't exist.</p>
  </div>
);

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
    path: "/manual/:gameId",
    element: <ManualScoringPage />,
    errorElement: <ErrorFallback />
  },
  {
    path: "/overlay/:gameId",
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
