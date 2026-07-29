import React, { useState, useEffect, useRef } from 'react';
import toast from 'react-hot-toast';
import { Megaphone, Plus, Pencil, Trash2, X, Loader2, ChevronDown, Search } from 'lucide-react';
import { API } from '../lib/api';

const EMPTY_FORM = { role: '', label: '', desc: '', icon: '', order: 0, isActive: true };

// common Ionicons names useful for role-option style icons — extend freely
const ICON_OPTIONS = [
  'briefcase-outline', 'briefcase',
  'business-outline', 'business',
  'car-outline', 'car',
  'school-outline', 'school',
  'medkit-outline', 'medkit',
  'shield-checkmark-outline', 'shield-checkmark',
  'people-outline', 'people',
  'person-outline', 'person',
  'cart-outline', 'cart',
  'construct-outline', 'construct',
  'restaurant-outline', 'restaurant',
  'home-outline', 'home',
  'bicycle-outline', 'bicycle',
  'airplane-outline', 'airplane',
  'cash-outline', 'cash',
  'laptop-outline', 'laptop',
  'megaphone-outline', 'megaphone',
  'document-text-outline', 'document-text',
  'storefront-outline', 'storefront',
  'hammer-outline', 'hammer',
];

// ---- Searchable icon picker dropdown ----
function IconPicker({ value, onChange }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const wrapRef = useRef(null);

  useEffect(() => {
    const onClickOutside = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  const filtered = ICON_OPTIONS.filter((name) =>
    name.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="relative" ref={wrapRef}>
      <button
        type="button"
        onClick={() => setOpen((p) => !p)}
        className="w-full flex items-center justify-between border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
      >
        <span className={value ? 'text-gray-800' : 'text-gray-400'}>
          {value || 'Select icon'}
        </span>
        <ChevronDown className="w-4 h-4 text-gray-400" />
      </button>

      {open && (
        <div className="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg">
          <div className="flex items-center gap-2 px-3 py-2 border-b border-gray-100">
            <Search className="w-4 h-4 text-gray-400" />
            <input
              autoFocus
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search icon..."
              className="w-full text-sm outline-none"
            />
          </div>

          <div className="max-h-56 overflow-y-auto">
            {filtered.length === 0 ? (
              <div className="px-3 py-3 text-sm text-gray-400">No icons found</div>
            ) : (
              filtered.map((name) => (
                <button
                  key={name}
                  type="button"
                  onClick={() => {
                    onChange(name);
                    setOpen(false);
                    setQuery('');
                  }}
                  className={`w-full text-left px-3 py-2 text-sm hover:bg-indigo-50 ${
                    value === name ? 'bg-indigo-50 text-indigo-600 font-semibold' : 'text-gray-700'
                  }`}
                >
                  {name}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

const AllRoles = () => {
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const fetchRoles = async () => {
    setLoading(true);
    try {
      const data = await API.manage.getRoleOptions();
      setRoles(Array.isArray(data) ? data : []);
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Could not load roles');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRoles();
  }, []);

  const openCreateModal = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setModalOpen(true);
  };

  const openEditModal = (role) => {
    setEditingId(role._id);
    setForm({
      role: role.role || '',
      label: role.label || '',
      desc: role.desc || '',
      icon: role.icon || '',
      order: role.order ?? 0,
      isActive: role.isActive ?? true,
    });
    setModalOpen(true);
  };

  const closeModal = () => {
    if (saving) return;
    setModalOpen(false);
    setEditingId(null);
    setForm(EMPTY_FORM);
  };

  const handleChange = (key) => (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setForm((f) => ({ ...f, [key]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.role.trim() || !form.label.trim() || !form.desc.trim()) {
      toast.error('Role, label and description are required');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        role: form.role.trim(),
        label: form.label.trim(),
        desc: form.desc.trim(),
        icon: form.icon.trim() || 'briefcase-outline',
        order: Number(form.order) || 0,
        isActive: !!form.isActive,
      };

      if (editingId) {
        await API.manage.updateRoleOption(editingId, payload);
        toast.success('Role updated');
      } else {
        await API.manage.createRoleOption(payload);
        toast.success('Role created');
      }

      closeModal();
      fetchRoles();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Could not save role');
    } finally {
      setSaving(false);
    }
  };

  const openDeleteConfirm = (role) => {
    setDeleteTarget(role);
    setConfirmOpen(true);
  };

  const closeDeleteConfirm = () => {
    if (deleting) return;
    setConfirmOpen(false);
    setDeleteTarget(null);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await API.manage.deleteRoleOption(deleteTarget._id);
      toast.success('Role deleted');
      closeDeleteConfirm();
      fetchRoles();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Could not delete role');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Megaphone className="w-6 h-6 text-indigo-600" />
          <h1 className="text-xl font-bold text-gray-800">Role Options</h1>
        </div>
        <button
          onClick={openCreateModal}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition"
        >
          <Plus className="w-4 h-4" />
          Add Role
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
        </div>
      ) : roles.length === 0 ? (
        <div className="text-center py-20 text-gray-500">No role options yet.</div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-600 text-left">
              <tr>
                <th className="px-4 py-3 font-semibold">Order</th>
                <th className="px-4 py-3 font-semibold">Role</th>
                <th className="px-4 py-3 font-semibold">Label</th>
                <th className="px-4 py-3 font-semibold">Description</th>
                <th className="px-4 py-3 font-semibold">Icon</th>
                <th className="px-4 py-3 font-semibold">Active</th>
                <th className="px-4 py-3 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {roles.map((r) => (
                <tr key={r._id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-gray-500">{r.order}</td>
                  <td className="px-4 py-3 font-medium text-gray-800">{r.role}</td>
                  <td className="px-4 py-3 text-gray-700">{r.label}</td>
                  <td className="px-4 py-3 text-gray-500 max-w-xs truncate">{r.desc}</td>
                  <td className="px-4 py-3 text-gray-500">{r.icon}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-semibold ${
                        r.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                      }`}
                    >
                      {r.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => openEditModal(r)}
                        className="p-2 rounded-lg hover:bg-indigo-50 text-indigo-600"
                        title="Edit"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => openDeleteConfirm(r)}
                        className="p-2 rounded-lg hover:bg-red-50 text-red-600"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ---- Create / Edit Modal ---- */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-md shadow-xl">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <h2 className="font-semibold text-gray-800">
                {editingId ? 'Edit Role' : 'Add Role'}
              </h2>
              <button onClick={closeModal} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="px-5 py-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Role key</label>
                <input
                  type="text"
                  value={form.role}
                  onChange={handleChange('role')}
                  placeholder="jobseeker"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Label</label>
                <input
                  type="text"
                  value={form.label}
                  onChange={handleChange('label')}
                  placeholder="Find a Job"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Description</label>
                <textarea
                  value={form.desc}
                  onChange={handleChange('desc')}
                  placeholder="Browse & apply to lakhs of openings"
                  rows={2}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Icon (Ionicons name)</label>
                <IconPicker
                  value={form.icon}
                  onChange={(name) => setForm((f) => ({ ...f, icon: name }))}
                />
              </div>

              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Order</label>
                  <input
                    type="number"
                    value={form.order}
                    onChange={handleChange('order')}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div className="flex items-center gap-2 mt-6">
                  <input
                    type="checkbox"
                    checked={form.isActive}
                    onChange={handleChange('isActive')}
                    className="w-4 h-4"
                  />
                  <label className="text-sm text-gray-700">Active</label>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={saving}
                  className="px-4 py-2 rounded-lg text-sm font-semibold text-gray-600 hover:bg-gray-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 rounded-lg text-sm font-semibold bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-60 flex items-center gap-2"
                >
                  {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                  {editingId ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ---- Delete confirm modal ---- */}
      {confirmOpen && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-sm shadow-xl p-5">
            <h2 className="font-semibold text-gray-800 mb-2">Delete role?</h2>
            <p className="text-sm text-gray-500 mb-5">
              Are you sure you want to delete{' '}
              <span className="font-semibold text-gray-700">{deleteTarget?.label}</span>? This cannot be undone.
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={closeDeleteConfirm}
                disabled={deleting}
                className="px-4 py-2 rounded-lg text-sm font-semibold text-gray-600 hover:bg-gray-100"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="px-4 py-2 rounded-lg text-sm font-semibold bg-red-600 text-white hover:bg-red-700 disabled:opacity-60 flex items-center gap-2"
              >
                {deleting && <Loader2 className="w-4 h-4 animate-spin" />}
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AllRoles;