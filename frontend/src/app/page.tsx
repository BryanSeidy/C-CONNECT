import Link from 'next/link';

export default function HomePage() {
  return (
    <section className="text-center py-20 space-y-6">
      <h1 className="text-4xl font-bold">Bienvenue sur CEMAC Connect</h1>
      <p className="text-gray-600 max-w-2xl mx-auto">
        Plateforme B2B pour connecter producteurs et acheteurs de la zone CEMAC.
      </p>
      <div className="flex gap-4 justify-center">
        <Link className="bg-green-700 text-white px-5 py-2 rounded" href="/marketplace">Explorer le marketplace</Link>
        <Link className="border border-green-700 text-green-700 px-5 py-2 rounded" href="/register">Créer un compte</Link>
      </div>
    </section>
  );
}
