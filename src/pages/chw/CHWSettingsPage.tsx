import React, { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { useAuth } from '../../context/AuthContext';
import { useTranslation } from 'react-i18next';
import { LanguageToggle } from '../../components/shared/LanguageToggle';
import { DISTRICTS } from '../../data/mockData';
import {
  UserIcon,
  MapPinIcon,
  MailIcon,
  ShieldCheckIcon,
  GlobeIcon,
  PencilIcon,
  CheckIcon,
  XIcon,
} from 'lucide-react';

export function CHWSettingsPage() {
  const { user, updateProfile } = useAuth();
  const { i18n } = useTranslation();
  const language = i18n.language.startsWith('rw') ? 'rw' : 'en';
  const en = language === 'en';

  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(user?.name ?? '');
  const [district, setDistrict] = useState(user?.district ?? '');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user || editing) return;
    setName(user.name);
    setDistrict(user.district ?? '');
  }, [user, editing]);

  const initials = (user?.name ?? '?')
    .split(/\s+/)
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const cardClass = 'rounded-2xl border border-gray-100 bg-white p-6 shadow-sm';
  const labelClass = 'text-sm font-semibold text-gray-500 mb-1';
  const inputClass =
    'w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20';

  const sortedDistricts = [...DISTRICTS].sort((a, b) => a.localeCompare(b));

  const handleSave = async () => {
    const nextName = name.trim();
    const nextDistrict = district.trim();
    if (!nextName) {
      toast.error(en ? 'Name is required' : 'Izina rirakenewe');
      return;
    }
    if (!nextDistrict) {
      toast.error(en ? 'District is required' : 'Akarere karakenewe');
      return;
    }
    const body: { name?: string; district?: string } = {};
    if (nextName !== user?.name) body.name = nextName;
    if (nextDistrict !== user?.district) body.district = nextDistrict;
    if (Object.keys(body).length === 0) {
      setEditing(false);
      return;
    }
    setSaving(true);
    try {
      await updateProfile(body);
      toast.success(en ? 'Profile updated' : 'Byavuguruwe');
      setEditing(false);
    } catch (e) {
      toast.error(
        e instanceof Error ? e.message : en ? 'Could not save' : 'Byanze'
      );
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setName(user?.name ?? '');
    setDistrict(user?.district ?? '');
    setEditing(false);
  };

  return (
    <div className="px-4 py-4 space-y-6 lg:px-0 lg:py-0 pb-10">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-base font-bold text-gray-900 sm:text-lg">
            {en ? 'Personal profile' : 'Umwirondoro'}
          </h2>
          <p className="text-sm text-gray-500">
            {en
              ? 'View and update your details. Change district if you are reassigned.'
              : 'Hindura amakuru niba wimuriwe mu karere gashya.'}
          </p>
        </div>
        {!editing ? (
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="mt-2 inline-flex items-center justify-center gap-2 rounded-lg bg-teal-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-teal-700 sm:mt-0"
          >
            <PencilIcon size={16} />
            {en ? 'Edit' : 'Hindura'}
          </button>
        ) : (
          <div className="mt-2 flex flex-wrap gap-2 sm:mt-0">
            <button
              type="button"
              onClick={handleCancel}
              disabled={saving}
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              <XIcon size={16} />
              {en ? 'Cancel' : 'Hagarika'}
            </button>
            <button
              type="button"
              onClick={() => void handleSave()}
              disabled={saving}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-teal-600 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-700 disabled:opacity-50"
            >
              <CheckIcon size={16} />
              {saving ? (en ? 'Saving…' : 'Biri kubikwa…') : en ? 'Save' : 'Bika'}
            </button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-1 space-y-6">
          <div className={`${cardClass} text-center relative overflow-hidden`}>
            <div className="absolute top-0 left-0 right-0 h-20 bg-teal-50/50 -z-10" />
            <div className="relative mx-auto h-20 w-20">
              <div className="flex h-full w-full items-center justify-center rounded-2xl bg-teal-600 text-2xl font-bold text-white shadow-lg ring-4 ring-white">
                {initials}
              </div>
            </div>
            <div className="mt-5">
              <h3 className="text-lg font-bold text-gray-900">{user?.name}</h3>
              <div className="mt-2 inline-flex items-center gap-1.5 rounded-lg bg-teal-50 px-2.5 py-1 text-sm font-semibold text-teal-700 border border-teal-100">
                <ShieldCheckIcon size={14} />
                {user?.role ?? 'CHW'}
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-2 space-y-6">
          <section className={cardClass}>
            <div className="flex items-center gap-2.5 mb-6">
              <div className="p-2 bg-gray-50 text-gray-400 rounded-xl">
                <UserIcon size={18} />
              </div>
              <h3 className="text-sm font-semibold text-gray-900">
                {en ? 'Contact & assignment' : 'Amakuru n’akarere'}
              </h3>
            </div>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div>
                <p className={labelClass}>{en ? 'Full name' : 'Izina ryose'}</p>
                {editing ? (
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className={inputClass}
                    autoComplete="name"
                  />
                ) : (
                  <div className="flex items-center gap-2">
                    <UserIcon size={14} className="text-gray-300" />
                    <p className="text-sm font-semibold text-gray-900">
                      {user?.name ?? '—'}
                    </p>
                  </div>
                )}
              </div>
              <div>
                <p className={labelClass}>{en ? 'Email' : 'Imeri'}</p>
                <div className="flex items-center gap-2">
                  <MailIcon size={14} className="text-gray-300" />
                  <p className="text-sm font-semibold text-gray-900">
                    {user?.email ?? '—'}
                  </p>
                </div>
                <p className="mt-1 text-xs text-gray-400">
                  {en
                    ? 'Email cannot be changed here. Contact support if it is wrong.'
                    : 'Imeri ntishobora guhindurwa hano.'}
                </p>
              </div>
              <div>
                <p className={labelClass}>
                  {en ? 'Primary district' : 'Akarere'}
                </p>
                {editing ? (
                  <select
                    value={district}
                    onChange={(e) => setDistrict(e.target.value)}
                    className={inputClass}
                  >
                    <option value="">{en ? 'Select district' : 'Hitamo akarere'}</option>
                    {sortedDistricts.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                ) : (
                  <div className="flex items-center gap-2">
                    <MapPinIcon size={14} className="text-gray-300" />
                    <p className="text-sm font-semibold text-gray-900">
                      {user?.district ?? '—'}
                    </p>
                  </div>
                )}
              </div>
              <div>
                <p className={labelClass}>{en ? 'Workplace' : 'Akazi'}</p>
                <div className="flex items-center gap-2">
                  <ShieldCheckIcon size={14} className="text-gray-300" />
                  <p className="text-sm font-semibold text-gray-900">
                    {en
                      ? 'Certified community health worker'
                      : 'Umujyanama w’ubuzima mu mudugudu'}
                  </p>
                </div>
              </div>
            </div>
          </section>

          <section className={cardClass}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-gray-50 text-gray-400 rounded-xl">
                  <GlobeIcon size={18} />
                </div>
                <h3 className="text-sm font-semibold text-gray-900">
                  {en ? 'Language' : 'Ururimi'}
                </h3>
              </div>
              <LanguageToggle variant="light" />
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
