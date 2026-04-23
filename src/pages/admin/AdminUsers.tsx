import React, { useCallback, useEffect, useState } from 'react';
import { PlusIcon, EditIcon, UserXIcon, SearchIcon, XIcon } from 'lucide-react';
import { toast } from 'sonner';
import { apiFetch } from '../../lib/api';
import type { AuthUser, AuthUserRole } from '../../auth/types';
import { DISTRICTS } from '../../data/mockData';
import { useTranslation } from 'react-i18next';

const ROLE_OPTIONS: AuthUserRole[] = [
  'CHW',
  'Health Center',
  'Local Clinic',
  'District Hospital',
  'Referral Hospital',
  'Admin',
  'RICH',
  'PFTH',
  'SFR',
];

export function AdminUsers() {
  const { i18n } = useTranslation();
  const en = !i18n.language.startsWith('rw');
  const roleLabel = (role: AuthUserRole | string) =>
    role === 'Local Clinic'
      ? en
        ? 'Health Post'
        : 'Ivuriro Riciriritse'
      : role;
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [users, setUsers] = useState<AuthUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [newRole, setNewRole] = useState<AuthUserRole>('CHW');
  const [district, setDistrict] = useState(DISTRICTS[0] ?? 'Huye');
  const [staffCode, setStaffCode] = useState('');
  const [mustChangePassword, setMustChangePassword] = useState(true);

  const loadUsers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiFetch<{ data: { users: AuthUser[] } }>(
        '/api/v1/users'
      );
      setUsers(res.data.users);
    } catch {
      setUsers([]);
      toast.error(en ? 'Could not load users' : 'Ntibyashobotse gukuramo abakoresha');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadUsers();
  }, [loadUsers]);

  const filtered = users
    .filter(
      (u) =>
        !search ||
        u.name.toLowerCase().includes(search.toLowerCase()) ||
        u.email.toLowerCase().includes(search.toLowerCase())
    )
    .filter((u) => !roleFilter || u.role === roleFilter);

  function resetForm() {
    setName('');
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setNewRole('CHW');
    setDistrict(DISTRICTS[0] ?? 'Huye');
    setStaffCode('');
    setMustChangePassword(true);
  }

  async function handleCreateUser(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < 8) {
      toast.error(en ? 'Password must be at least 8 characters' : 'Ijambo ry\'ibanga rigomba kugira nibura inyuguti 8');
      return;
    }
    if (password !== confirmPassword) {
      toast.error(en ? 'Passwords do not match' : 'Amagambo y\'ibanga ntahura');
      return;
    }
    setSubmitting(true);
    try {
      await apiFetch<{ data: { user: AuthUser } }>('/api/v1/users', {
        method: 'POST',
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim().toLowerCase(),
          password,
          role: newRole,
          district,
          staffCode: staffCode.trim() || undefined,
          status: 'Active',
          mustChangePassword,
        }),
      });
      toast.success(
        mustChangePassword
          ? en
            ? 'User created. They receive an email with the temporary password and a secure link to set a new password.'
            : 'Umukoresha yakozwe. Arahabwa imeli irimo ijambo ry\'ibanga ry\'agateganyo n\'umuhuza wo gushyiraho irishya.'
          : en
            ? 'User created. They can sign in immediately with the password you entered.'
            : 'Umukoresha yakozwe. Ashobora kwinjira ako kanya akoresheje ijambo ry\'ibanga wanditse.'
      );
      resetForm();
      setShowAdd(false);
      await loadUsers();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : en ? 'Could not create user' : 'Ntibyashobotse gukora umukoresha');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">{en ? 'User Management' : 'Imicungire y\'abakoresha'}</h1>
          <p className="text-sm text-gray-500">
            {loading ? (en ? 'Loading…' : 'Birakorwa...') : `${users.length} ${en ? 'registered users' : 'abakoresha biyandikishije'}`}
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            setShowAdd(!showAdd);
            if (showAdd) resetForm();
          }}
          className="flex items-center gap-2 px-4 py-2 bg-teal-700 text-white rounded-lg text-sm font-medium hover:bg-teal-800 transition-colors"
        >
          <PlusIcon size={16} /> {showAdd ? (en ? 'Close' : 'Funga') : (en ? 'Add User' : 'Ongeramo umukoresha')}
        </button>
      </div>

      {showAdd && (
        <form
          onSubmit={handleCreateUser}
          className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-4"
        >
          <p className="text-sm text-slate-600 leading-relaxed rounded-lg bg-slate-50 border border-slate-100 px-4 py-3">
            {en ? (
              <>Enter and confirm a <strong>temporary password</strong>. With standard security on, that password is emailed to the user together with a link to choose a new password.</>
            ) : (
              <>Shyiramo kandi wemeze <strong>ijambo ry\'ibanga ry\'agateganyo</strong>. Iyo umutekano usanzwe ukora, iri jambo ry\'ibanga ryoherezwa kuri imeli y\'umukoresha hamwe n\'umuhuza wo gushyiraho irishya.</>
            )}
          </p>
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-sm font-bold text-slate-900">{en ? 'Create user' : 'Kora umukoresha'}</h2>
            <button
              type="button"
              onClick={() => {
                setShowAdd(false);
                resetForm();
              }}
              className="p-1 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600"
              aria-label={en ? 'Close form' : 'Funga ifishi'}
            >
              <XIcon size={18} />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">
                {en ? 'Full name' : 'Amazina yose'}
              </label>
              <input
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                placeholder={en ? 'e.g. Jane Mukamana' : 'urugero: Jane Mukamana'}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">
                {en ? 'Email' : 'Imeli'}
              </label>
              <input
                required
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                placeholder={en ? 'user@example.com' : 'umukoresha@example.com'}
                autoComplete="off"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">
                {en ? 'Temporary password (min 8 characters)' : 'Ijambo ry\'ibanga ry\'agateganyo (nibura inyuguti 8)'}
              </label>
              <input
                required
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                autoComplete="new-password"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">
                {en ? 'Confirm temporary password' : 'Emeza ijambo ry\'ibanga ry\'agateganyo'}
              </label>
              <input
                required
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                autoComplete="new-password"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">
                {en ? 'Role' : 'Uruhare'}
              </label>
              <select
                value={newRole}
                onChange={(e) =>
                  setNewRole(e.target.value as AuthUserRole)
                }
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
              >
                {ROLE_OPTIONS.map((r) => (
                  <option key={r} value={r}>
                    {roleLabel(r)}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">
                {en ? 'District' : 'Akarere'}
              </label>
              <select
                value={district}
                onChange={(e) => setDistrict(e.target.value)}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
              >
                {DISTRICTS.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-gray-600 mb-1">
                {en ? 'Staff code (optional)' : 'Kode y\'akazi (si ngombwa)'}
              </label>
              <input
                value={staffCode}
                onChange={(e) => setStaffCode(e.target.value)}
                className="w-full max-w-md rounded-lg border border-gray-200 px-3 py-2 text-sm"
                placeholder={en ? 'e.g. DH-301' : 'urugero: DH-301'}
              />
            </div>
            <div className="sm:col-span-2 flex items-start gap-2 rounded-lg border border-slate-100 bg-slate-50/80 px-3 py-2.5">
              <input
                id="mustChange"
                type="checkbox"
                checked={mustChangePassword}
                onChange={(e) => setMustChangePassword(e.target.checked)}
                className="mt-1 rounded border-gray-300"
              />
              <label htmlFor="mustChange" className="text-sm text-slate-700 leading-snug">
                <span className="font-medium text-slate-900">{en ? 'Standard invitation' : 'Ubutumire busanzwe'}</span>{' '}
                {en
                  ? '(recommended): send the email with temporary password + reset link, and require a new password on first sign-in.'
                  : '(birasabwa): ohereza imeli irimo ijambo ry\'ibanga ry\'agateganyo n\'umuhuza wo kurihindura.'}
              </label>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => {
                setShowAdd(false);
                resetForm();
              }}
              className="px-4 py-2 rounded-lg border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              {en ? 'Cancel' : 'Hagarika'}
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 rounded-lg bg-teal-700 text-white text-sm font-semibold hover:bg-teal-800 disabled:opacity-60"
            >
              {submitting ? (en ? 'Creating…' : 'Birimo gukorwa...') : (en ? 'Create user' : 'Kora umukoresha')}
            </button>
          </div>
        </form>
      )}

      <div className="bg-white rounded-xl border border-gray-200 p-4 flex gap-3">
        <div className="relative flex-1">
          <SearchIcon
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          />

          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={en ? 'Search users...' : 'Shakisha abakoresha...'}
            className="w-full pl-8 pr-3 py-2 rounded-lg border border-gray-200 text-sm"
          />
        </div>
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="rounded-lg border border-gray-200 px-3 py-2 text-sm"
        >
          <option value="">{en ? 'All Roles' : 'Inshingano zose'}</option>
          {[
            'CHW',
            'Health Center',
            'Local Clinic',
            'District Hospital',
            'Referral Hospital',
            'Admin',
            'RICH',
            'PFTH',
            'SFR',
          ].map((r) => (
            <option key={r}>{roleLabel(r)}</option>
          ))}
        </select>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              {[
                en ? 'Name' : 'Izina',
                en ? 'Email' : 'Imeli',
                en ? 'Role' : 'Uruhare',
                en ? 'District' : 'Akarere',
                en ? 'Status' : 'Imimerere',
                en ? 'Last Active' : 'Aheruka gukora',
                en ? 'Actions' : 'Ibikorwa',
              ].map((h) => (
                <th
                  key={h}
                  className="text-left px-5 py-2.5 text-xs font-semibold text-gray-500 uppercase"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filtered.map((u) => (
              <tr key={u.id} className="hover:bg-gray-50">
                <td className="px-5 py-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-teal-100 flex items-center justify-center text-teal-700 font-bold text-xs">
                      {u.name
                        .split(' ')
                        .map((n) => n[0])
                        .join('')
                        .slice(0, 2)}
                    </div>
                    <span className="font-medium text-gray-900">{u.name}</span>
                  </div>
                </td>
                <td className="px-5 py-3 text-xs text-gray-600">{u.email}</td>
                <td className="px-5 py-3">
                  <span
                    className={`px-2 py-0.5 rounded text-xs font-medium ${
                      u.role === 'CHW'
                        ? 'bg-teal-100 text-teal-700'
                        : u.role === 'Health Center'
                          ? 'bg-blue-100 text-blue-700'
                          : u.role === 'District Hospital'
                            ? 'bg-purple-100 text-purple-700'
                            : u.role === 'Referral Hospital'
                              ? 'bg-indigo-100 text-indigo-700'
                              : u.role === 'RICH' ||
                                  u.role === 'PFTH' ||
                                  u.role === 'SFR'
                                ? 'bg-violet-100 text-violet-700'
                                : 'bg-gray-100 text-gray-700'
                    }`}
                  >
                    {roleLabel(u.role)}
                  </span>
                </td>
                <td className="px-5 py-3 text-gray-600">{u.district}</td>
                <td className="px-5 py-3">
                  <span
                    className={`inline-flex items-center gap-1 text-xs font-medium ${u.status === 'Active' ? 'text-success-600' : 'text-gray-400'}`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${u.status === 'Active' ? 'bg-success-500' : 'bg-gray-300'}`}
                    />

                    {u.status}
                  </span>
                </td>
                <td className="px-5 py-3 text-xs text-gray-500">
                  {new Date(u.lastActive).toLocaleString()}
                </td>
                <td className="px-5 py-3">
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => toast.info(en ? 'Edit user modal' : 'Hindura umukoresha')}
                      className="p-1.5 hover:bg-gray-100 rounded text-gray-500"
                    >
                      <EditIcon size={14} />
                    </button>
                    <button
                      type="button"
                      onClick={() => toast.info(en ? 'User deactivated' : 'Umukoresha yahagaritswe')}
                      className="p-1.5 hover:bg-danger-50 rounded text-gray-500 hover:text-danger-600"
                    >
                      <UserXIcon size={14} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
