import { PenSquare, LogOut } from 'lucide-react';

interface NavbarProps {
  onLogout?: () => void;
}

export function Navbar({ onLogout }: NavbarProps) {
  return (
    <nav className="navbar">
      <div className="container flex justify-between items-center">
        <div className="logo">
          <PenSquare size={28} />
          <span>Berl Blog Admin</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-dim" style={{ fontSize: '0.9rem', fontWeight: 500 }}>
            Manage your content
          </span>
          {onLogout && (
            <button 
              onClick={onLogout}
              className="flex items-center gap-2 text-dim hover:text-[var(--text)] transition-colors"
              title="Sign Out"
            >
              <LogOut size={18} />
              <span style={{ fontSize: '0.9rem', fontWeight: 500 }}>Sign Out</span>
            </button>
          )}
        </div>
      </div>
    </nav>
  );
}
