import React, { useState, useMemo, useEffect, useRef } from 'react';
import toast from 'react-hot-toast';
import {
  Plus, Search, Upload, X, ChevronLeft, ChevronRight,
} from 'lucide-react';
import { API } from '../lib/api';
import { useFetch } from './_useFetch';
import { Spinner, Table, Badge, Modal } from '../components/ui';

const PAGE_SIZE = 10;

const emptyForm = {
  name: '',
  icon: '',
  image: '',
  order: 0,
  is_Drivercat: false,
};

const fileToBase64 = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

export default function Categories() {
  const { data: cats, loading, refetch } = useFetch(
    () => API.categories.list(),
    []
  );

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [busy, setBusy] = useState(false);

  const [imagePreview, setImagePreview] = useState('');
  const fileInputRef = useRef(null);

  const [search, setSearch] = useState('');
  const [driverFilter, setDriverFilter] = useState('all');
  const [page, setPage] = useState(1);

  useEffect(() => {
    setPage(1);
  }, [search, driverFilter]);

  const filtered = useMemo(() => {
    let list = cats || [];
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(
        (c) =>
          (c.name || '').toLowerCase().includes(q) ||
          (c.slug || '').toLowerCase().includes(q)
      );
    }
    if (driverFilter === 'yes') list = list.filter((c) => c.is_Drivercat);
    if (driverFilter === 'no') list = list.filter((c) => !c.is_Drivercat);
    return list;
  }, [cats, search, driverFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const paginated = useMemo(
    () =>
      filtered.slice(
        (currentPage - 1) * PAGE_SIZE,
        currentPage * PAGE_SIZE
      ),
    [filtered, currentPage]
  );

  const start = (category = null) => {
    setEditing(category);
    if (category) {
      setForm({
        name: category.name || '',
        icon: category.icon || '',
        image: category.image || '',
        order: category.order || 0,
        is_Drivercat: category.is_Drivercat || false,
      });
      setImagePreview(category.image || '');
    } else {
      setForm(emptyForm);
      setImagePreview('');
    }
    setOpen(true);
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      return toast.error("Only image files allowed");
    }

    if (file.size > 2 * 1024 * 1024) {
      return toast.error("Image must be under 2MB");
    }

    // Preview only
    setImagePreview(URL.createObjectURL(file));

    // Save actual file
    setForm((f) => ({
      ...f,
      image: file,
    }));
  };

  const clearImage = () => {
    setImagePreview('');
    setForm((f) => ({ ...f, image: '' }));
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const save = async () => {
    if (!form.name.trim()) {
      return toast.error("Category name required");
    }

    setBusy(true);

    try {
      const data = new FormData();

      data.append("name", form.name);
      data.append("icon", form.icon);
      data.append("order", form.order);
      data.append("is_Drivercat", form.is_Drivercat);

      if (form.image instanceof File) {
        data.append("category", form.image);
      }

      if (editing) {
        await API.categories.update(editing._id, data);
      } else {
        await API.categories.create(data);
      }

      toast.success(editing ? "Category updated" : "Category created");
      refetch();
      setOpen(false);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  };

  const deleteCategory = async (id) => {
    setBusy(true);
    try {
      if (id) {
        await API.categories.delete(id);
        refetch()
      } else {
        toast.error("Please Delete Any One");
      }
    } catch (error) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold">Categories</h1>
          <p className="text-sm text-muted">
            {filtered.length} of {(cats || []).length} total
          </p>
        </div>
        <button className="btn-primary" onClick={() => start()}>
          <Plus size={18} />
          Add Category
        </button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
        <div className="relative flex-1">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted"
          />
          <input
            className="input pl-9"
            placeholder="Search by name or slug..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <select
          className="input sm:w-56"
          value={driverFilter}
          onChange={(e) => setDriverFilter(e.target.value)}
        >
          <option value="all">All categories</option>
          <option value="yes">Driver only</option>
          <option value="no">Non-driver only</option>
        </select>
      </div>

      {loading ? (
        <Spinner />
      ) : (
        <>
          <Table
            columns={['Icon', 'Name', 'Slug', 'Driver Category', 'Order', 'Action']}
            rows={paginated}
            empty="No categories found"
            renderRow={(category) => (
              <tr key={category._id}>
                <td className="td">
                  {category.image ? (
                    <img
                      src={category.image}
                      alt={category.name}
                      className="w-10 h-10 rounded-lg object-cover border"
                    />
                  ) : (
                    <span className="text-xl">{category.icon || '📁'}</span>
                  )}
                </td>
                <td className="td font-semibold">{category.name}</td>
                <td className="td text-muted">{category.slug}</td>
                <td className="td">
                  <Badge color={category.is_Drivercat ? 'success' : 'gray'}>
                    {category.is_Drivercat ? 'Yes' : 'No'}
                  </Badge>
                </td>
                <td className="td">{category.order || 0}</td>
                <td className="td">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => start(category)}
                      className="btn-outline !py-1.5 !px-3 text-xs"
                    >
                      Edit
                    </button>

                    <button
                      onClick={() => deleteCategory(category._id)}
                      disabled={busy}
                      className="bg-red-500 hover:bg-red-600 text-white rounded-md !py-1.5 !px-3 text-xs"
                    >
                      {busy ? "Deleteing ....." : "Delete"}
                    </button>
                  </div>
                </td>

              </tr>
            )}
          />

          {filtered.length > 0 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
              <p className="text-sm text-muted">
                Showing{' '}
                <span className="font-semibold">
                  {(currentPage - 1) * PAGE_SIZE + 1}
                </span>{' '}
                –{' '}
                <span className="font-semibold">
                  {Math.min(currentPage * PAGE_SIZE, filtered.length)}
                </span>{' '}
                of <span className="font-semibold">{filtered.length}</span>
              </p>
              <div className="flex items-center gap-2">
                <button
                  className="btn-outline !py-1.5 !px-3 disabled:opacity-40"
                  disabled={currentPage === 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  <ChevronLeft size={16} />
                </button>
                <span className="text-sm font-medium px-2">
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  className="btn-outline !py-1.5 !px-3 disabled:opacity-40"
                  disabled={currentPage === totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}
        </>
      )}

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={editing ? 'Edit Category' : 'Create Category'}
        footer={
          <button className="btn-primary" disabled={busy} onClick={save}>
            {busy ? 'Saving...' : 'Save'}
          </button>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="label">Category Name</label>
            <input
              className="input"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Enter category name"
            />
          </div>

          <div>
            <label className="label">Category Image</label>
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 rounded-xl border-2 border-dashed flex items-center justify-center bg-gray-50 overflow-hidden flex-shrink-0">
                {imagePreview ? (
                  <img
                    src={imagePreview}
                    alt="preview"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-3xl">{form.icon || '📁'}</span>
                )}
              </div>
              <div className="flex-1 space-y-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleFileChange}
                />
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="btn-outline !py-1.5 !px-3 text-sm inline-flex items-center gap-2"
                  >
                    <Upload size={14} />
                    {imagePreview ? 'Change Image' : 'Upload Image'}
                  </button>
                  {imagePreview && (
                    <button
                      type="button"
                      onClick={clearImage}
                      className="!py-1.5 !px-3 text-xs text-red-600 hover:underline inline-flex items-center gap-1"
                    >
                      <X size={12} /> Remove
                    </button>
                  )}
                </div>
                <p className="text-xs text-muted">
                  PNG / JPG up to 2MB. No image → emoji icon shown.
                </p>
              </div>
            </div>
          </div>

          <div>
            <label className="label">Icon (Emoji fallback)</label>
            <input
              className="input"
              value={form.icon}
              onChange={(e) => setForm({ ...form, icon: e.target.value })}
              placeholder="🚗"
            />
          </div>

          <div>
            <label className="label">Display Order</label>
            <input
              type="number"
              className="input"
              value={form.order}
              onChange={(e) =>
                setForm({ ...form, order: Number(e.target.value) })
              }
            />
          </div>

          <div className="rounded-xl border p-4">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={form.is_Drivercat}
                onChange={(e) =>
                  setForm({ ...form, is_Drivercat: e.target.checked })
                }
              />
              <div>
                <p className="font-medium">Driver Category</p>
                <p className="text-sm text-muted">
                  Mark this category for driver-related jobs.
                </p>
              </div>
            </label>
          </div>
        </div>
      </Modal>
    </div>
  );
}