'use client';

import { useState } from 'react';

interface AuthFormProps {
  title: string;
  submitText: string;
  withRole?: boolean;
  onSubmit: (email: string, password: string, role: string) => Promise<void>;
}

export const AuthForm = ({ title, submitText, withRole, onSubmit }: AuthFormProps) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('BUYER');

  return (
    <form
      className="bg-white p-6 rounded-xl shadow space-y-4 w-full max-w-md"
      onSubmit={async (e) => {
        e.preventDefault();
        await onSubmit(email, password, role);
      }}
    >
      <h1 className="text-2xl font-bold">{title}</h1>
      <input className="w-full border p-2 rounded" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
      <input className="w-full border p-2 rounded" type="password" placeholder="Mot de passe" value={password} onChange={(e) => setPassword(e.target.value)} />
      {withRole && (
        <select className="w-full border p-2 rounded" value={role} onChange={(e) => setRole(e.target.value)}>
          <option value="BUYER">Acheteur</option>
          <option value="PRODUCER">Producteur</option>
        </select>
      )}
      <button className="w-full bg-green-700 text-white py-2 rounded">{submitText}</button>
    </form>
  );
};
