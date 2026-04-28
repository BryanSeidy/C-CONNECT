import Link from 'next/link';

export const Sidebar = () => (
  <aside className="w-full md:w-64 bg-white rounded-lg shadow p-4 h-fit">
    <h2 className="font-semibold mb-3">Menu</h2>
    <ul className="space-y-2">
      <li><Link href="/dashboard">Vue générale</Link></li>
      <li><Link href="/marketplace">Produits</Link></li>
      <li><Link href="/profile">Mon profil</Link></li>
    </ul>
  </aside>
);
