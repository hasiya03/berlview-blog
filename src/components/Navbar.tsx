import { PenSquare } from 'lucide-react';

export function Navbar() {
  return (
    <nav className="navbar">
      <div className="container flex justify-between items-center">
        <div className="logo">
          <PenSquare size={28} />
          <span>Berl Blog Admin</span>
        </div>
        <div className="text-dim" style={{ fontSize: '0.9rem', fontWeight: 500 }}>
          Manage your content
        </div>
      </div>
    </nav>
  );
}
