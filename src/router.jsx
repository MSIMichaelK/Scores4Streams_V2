import { createBrowserRouter, RouterProvider, Outlet } from "react-router-dom";
import Console from "./components/Console";
import ManualScoringPage from "./pages/ManualScoringPage";
import LoginPage from "./pages/LoginPage";
import OverlayFromFigma from "./pages/OverlayFromFigma";
import StatsPage from "./pages/StatsPage";
import SettingsPage from "./pages/SettingsPage";
import NavBar from "./components/NavBar";

const ErrorFallback = () => (
  <div style={{ padding: "2rem" }}>
    <h1>404 Not Found</h1>
    <p>This page doesn't exist.</p>
  </div>
);

/** Layout wrapper — renders NavBar below page content */
const AppLayout = () => (
  <>
    <Outlet />
    <NavBar />
  </>
);

const router = createBrowserRouter([
  {
    element: <AppLayout />,
    errorElement: <ErrorFallback />,
    children: [
      { path: "/", element: <Console /> },
      { path: "/console", element: <Console /> },
      { path: "/stats", element: <StatsPage /> },
      { path: "/settings", element: <SettingsPage /> },
      { path: "/manual/:gameId", element: <ManualScoringPage /> },
      { path: "/overlay/:gameId", element: <OverlayFromFigma showGrid={false} /> },
      { path: "/login", element: <LoginPage /> },
    ],
  },
]);

const AppRouter = () => <RouterProvider router={router} />;

export default AppRouter;
