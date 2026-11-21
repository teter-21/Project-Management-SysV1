import { Menu, Bell, Search } from "lucide-react";

function Header({ onMenuClick }) {
  return (
    <header className="header">
      <div className="header-left">
        <button
          type="button"
          className="icon-button menu-button"
          onClick={onMenuClick}
          aria-label="Open navigation"
        >
          <Menu size={22} />
        </button>

        <div>
          <h2>Workspace</h2>
          <p>Manage your projects efficiently</p>
        </div>
      </div>

      <div className="header-actions">
        <div className="header-search">
          <Search size={18} />
          <span>Search</span>
        </div>

        <div
          className="notification-icon"
          aria-label="Notifications coming soon"
        >
          <Bell size={20} />
        </div>

        <div className="header-avatar">DU</div>
      </div>
    </header>
  );
}

export default Header;
