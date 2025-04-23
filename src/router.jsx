import { createBrowserRouter, RouterProvider } from "react-router-dom";
import Console from "./components/Console";
import ManualScoringPage from "./pages/ManualScoringPage";
import LoginPage from "./pages/LoginPage";

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
    path: "/login",
    element: <LoginPage />
  }
]);

const AppRouter = () => <RouterProvider router={router} />;

export default AppRouter;
