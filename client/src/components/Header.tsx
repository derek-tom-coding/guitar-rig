import { Link } from '@tanstack/react-router';

export default function Header() {
  return (
    <>
      <header className="p-4 bg-gray-800 text-white flex justify-between items-center">
        <nav className="flex space-x-4">
          <Link to="/">guitar rig</Link>
          <Link to="/about">about</Link>
        </nav>
      </header>
    </>
  );
}
