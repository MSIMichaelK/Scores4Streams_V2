import { useLocation, useNavigate } from "react-router-dom";

const TABS = [
  { path: "/console", label: "Score", icon: "⚾" },
  { path: "/stats", label: "Stats", icon: "📊" },
  { path: "/settings", label: "Settings", icon: "⚙" },
];

// Hide nav bar on these route prefixes
const HIDDEN_PREFIXES = ["/manual", "/overlay", "/login"];

const NavBar = () => {
  const location = useLocation();
  const navigate = useNavigate();

  // Hide on scoring, overlay, and login pages
  const shouldHide = HIDDEN_PREFIXES.some((p) => location.pathname.startsWith(p));
  if (shouldHide) return null;

  const activeTab = TABS.find((t) => location.pathname.startsWith(t.path))
    || TABS[0]; // default to Score tab

  return (
    <nav className="nav-bar">
      {TABS.map((tab) => (
        <button
          key={tab.path}
          className={`nav-tab ${activeTab.path === tab.path ? "active" : ""}`}
          onClick={() => navigate(tab.path)}
        >
          <span className="nav-icon">{tab.icon}</span>
          <span className="nav-label">{tab.label}</span>
        </button>
      ))}
    </nav>
  );
};

export default NavBar;
