"use client";

import { useState, useEffect } from "react";
import { format, formatDistanceToNow } from "date-fns";
import { hu } from "date-fns/locale";

export default function AdminUsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newUserName, setNewUserName] = useState("");
  const [newUserEmail, setNewUserEmail] = useState("");
  const [newUserRole, setNewUserRole] = useState("ADMIN");
  const [newUserPassword, setNewUserPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/users");
      if (!res.ok) throw new Error("Hiba a felhasználók lekérésekor");
      const data = await res.json();
      setUsers(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newUserName,
          email: newUserEmail,
          role: newUserRole,
          password: newUserPassword,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        alert(data.message);
        setIsModalOpen(false);
        setNewUserName("");
        setNewUserEmail("");
        setNewUserPassword("");
        fetchUsers();
      } else {
        alert(data.message || "Hiba történt");
      }
    } catch (err) {
      alert("Hálózati hiba.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSendResetEmail = async (email: string) => {
    if (!confirm(`Biztosan küldesz egy jelszó-visszaállító emailt a következő címre: ${email}?`)) {
      return;
    }

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (res.ok) {
        alert("Jelszó visszaállító link elküldve! (Nézd meg a szerver konzolt a teszt linkért)");
      } else {
        alert(data.error || "Hiba történt az email küldésekor.");
      }
    } catch (err) {
      alert("Hálózati hiba.");
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Felhasználókezelés</h1>
          <p className="text-gray-500 mt-1">Adminisztrátorok és Gyártók fiókjainak áttekintése.</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-primary hover:bg-primary-hover text-white px-6 py-2.5 rounded-lg font-bold transition-colors shadow-sm flex items-center gap-2"
        >
          <span>+ Új Munkatárs</span>
        </button>
      </div>

      {error && (
        <div className="p-4 bg-red-50 text-red-500 rounded-lg">{error}</div>
      )}

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="px-6 py-4 text-sm font-bold text-gray-500 tracking-wider">Felhasználó</th>
                <th className="px-6 py-4 text-sm font-bold text-gray-500 tracking-wider">Szerepkör</th>
                <th className="px-6 py-4 text-sm font-bold text-gray-500 tracking-wider">Regisztráció</th>
                <th className="px-6 py-4 text-sm font-bold text-gray-500 tracking-wider">Utolsó Bejelentkezés</th>
                <th className="px-6 py-4 text-right text-sm font-bold text-gray-500 tracking-wider">Műveletek</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-bold text-gray-900">{user.name || "Nincs név"}</div>
                    <div className="text-sm text-gray-500">{user.email}</div>
                  </td>
                  <td className="px-6 py-4">
                    {user.role === "SUPERADMIN" && (
                      <span className="px-3 py-1 rounded-full text-xs font-bold bg-purple-100 text-purple-700">Szuperadmin</span>
                    )}
                    {user.role === "ADMIN" && (
                      <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-700">Admin</span>
                    )}
                    {user.role === "VENDOR" && (
                      <div>
                        <span className="px-3 py-1 rounded-full text-xs font-bold bg-green-100 text-green-700">Gyártó</span>
                        <div className="text-xs text-gray-400 mt-1">{user.vendor?.companyName}</div>
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                    {format(new Date(user.createdAt), "yyyy. MM. dd.", { locale: hu })}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {user.lastLoginAt ? (
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {formatDistanceToNow(new Date(user.lastLoginAt), { addSuffix: true, locale: hu })}
                        </div>
                        <div className="text-xs text-gray-400">
                          {format(new Date(user.lastLoginAt), "yyyy. MM. dd. HH:mm", { locale: hu })}
                        </div>
                      </div>
                    ) : (
                      <span className="text-sm text-gray-400 italic">Még nem jelentkezett be</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right whitespace-nowrap">
                    <button 
                      onClick={() => handleSendResetEmail(user.email)}
                      className="text-primary hover:text-blue-700 text-sm font-bold underline"
                    >
                      Jelszócsere küldése
                    </button>
                  </td>
                </tr>
              ))}
              
              {users.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                    Nincsenek felhasználók a rendszerben.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Új munkatárs hozzáadása */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h3 className="text-xl font-bold text-gray-900">Új munkatárs hozzáadása</h3>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                ✕
              </button>
            </div>
            
            <form onSubmit={handleCreateUser} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Név</label>
                <input 
                  type="text" 
                  required
                  value={newUserName}
                  onChange={e => setNewUserName(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none"
                  placeholder="Gipsz Jakab"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email cím</label>
                <input 
                  type="email" 
                  required
                  value={newUserEmail}
                  onChange={e => setNewUserEmail(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none"
                  placeholder="admin@myfine.hu"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Jogosultság</label>
                <select 
                  value={newUserRole}
                  onChange={e => setNewUserRole(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none bg-white"
                >
                  <option value="ADMIN">Adminisztrátor (Normál hozzáférés)</option>
                  <option value="SUPERADMIN">Szuperadminisztrátor (Teljes hozzáférés)</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Ideiglenes Jelszó</label>
                <input 
                  type="password" 
                  required
                  minLength={6}
                  value={newUserPassword}
                  onChange={e => setNewUserPassword(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none"
                  placeholder="Legalább 6 karakter..."
                />
                <p className="text-xs text-gray-500 mt-1">Ezt a jelszót adhatod meg a munkatársnak. Első belépés után megváltoztathatja.</p>
              </div>

              <div className="pt-4 flex gap-3">
                <button 
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors"
                >
                  Mégsem
                </button>
                <button 
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 px-4 py-2 bg-primary text-white rounded-lg font-bold hover:bg-primary-hover transition-colors disabled:opacity-70 flex justify-center items-center"
                >
                  {isSubmitting ? "Mentés..." : "Hozzáadás"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
