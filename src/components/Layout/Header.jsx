import { Search, Bell } from 'lucide-react';

export default function Header({ title }) {
  return (
    <header className="header">
      <h2 className="header-title">{title}</h2>
      <div className="header-actions">
        <div className="header-search">
          <Search size={16} />
          <input type="text" placeholder="Search..." />
        </div>
        <button className="btn btn-icon btn-ghost">
          <Bell size={18} />
        </button>
      </div>
    </header>
  );
}
