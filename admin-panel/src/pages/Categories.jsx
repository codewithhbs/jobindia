import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { Plus } from 'lucide-react';
import { API } from '../lib/api';
import { useFetch } from './_useFetch';
import { Spinner, Table, Badge, Modal } from '../components/ui';

const emptyForm = {
  name: '',
  icon: '',
  order: 0,
  is_Drivercat: false,
};

export default function Categories() {
  const { data: cats, loading, refetch } = useFetch(
    () => API.categories.list(),
    []
  );

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [busy, setBusy] = useState(false);

  const start = (category = null) => {
    setEditing(category);

    if (category) {
      setForm({
        name: category.name || '',
        icon: category.icon || '',
        order: category.order || 0,
        is_Drivercat: category.is_Drivercat || false,
      });
    } else {
      setForm(emptyForm);
    }

    setOpen(true);
  };

  const save = async () => {
    if (!form.name.trim()) {
      return toast.error('Category name is required');
    }

    setBusy(true);

    try {
      const payload = {
        ...form,
        slug: form.name
          .trim()
          .toLowerCase()
          .replace(/\s+/g, '-'),
      };

      if (editing) {
        await API.categories.update(editing._id, payload);
      } else {
        await API.categories.create(payload);
      }

      toast.success(
        editing
          ? 'Category updated successfully'
          : 'Category created successfully'
      );

      setOpen(false);
      setEditing(null);
      setForm(emptyForm);

      refetch();
    } catch (error) {
      toast.error(error.message || 'Something went wrong');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-extrabold">
          Categories
        </h1>

        <button
          className="btn-primary"
          onClick={() => start()}
        >
          <Plus size={18} />
          Add Category
        </button>
      </div>

      {loading ? (
        <Spinner />
      ) : (
        <Table
          columns={[
            'Icon',
            'Name',
            'Slug',
            'Driver Category',
            'Order',
            'Action',
          ]}
          rows={cats || []}
          empty="No categories found"
          renderRow={(category) => (
            <tr key={category._id}>
              <td className="td text-xl">
                {category.icon || '📁'}
              </td>

              <td className="td font-semibold">
                {category.name}
              </td>

              <td className="td text-muted">
                {category.slug}
              </td>

              <td className="td">
                <Badge
                  color={
                    category.is_Drivercat
                      ? 'success'
                      : 'gray'
                  }
                >
                  {category.is_Drivercat
                    ? 'Yes'
                    : 'No'}
                </Badge>
              </td>

              <td className="td">
                {category.order || 0}
              </td>

              <td className="td">
                <button
                  onClick={() => start(category)}
                  className="btn-outline !py-1.5 !px-3 text-xs"
                >
                  Edit
                </button>
              </td>
            </tr>
          )}
        />
      )}

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={
          editing
            ? 'Edit Category'
            : 'Create Category'
        }
        footer={
          <button
            className="btn-primary"
            disabled={busy}
            onClick={save}
          >
            {busy ? 'Saving...' : 'Save'}
          </button>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="label">
              Category Name
            </label>
            <input
              className="input"
              value={form.name}
              onChange={(e) =>
                setForm({
                  ...form,
                  name: e.target.value,
                })
              }
              placeholder="Enter category name"
            />
          </div>

          <div>
            <label className="label">
              Icon (Emoji)
            </label>
            <input
              className="input"
              value={form.icon}
              onChange={(e) =>
                setForm({
                  ...form,
                  icon: e.target.value,
                })
              }
              placeholder="🚗"
            />
          </div>

          <div>
            <label className="label">
              Display Order
            </label>
            <input
              type="number"
              className="input"
              value={form.order}
              onChange={(e) =>
                setForm({
                  ...form,
                  order: Number(e.target.value),
                })
              }
            />
          </div>

          <div className="rounded-xl border p-4">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={form.is_Drivercat}
                onChange={(e) =>
                  setForm({
                    ...form,
                    is_Drivercat:
                      e.target.checked,
                  })
                }
              />

              <div>
                <p className="font-medium">
                  Driver Category
                </p>
                <p className="text-sm text-muted">
                  Mark this category for
                  driver-related jobs.
                </p>
              </div>
            </label>
          </div>
        </div>
      </Modal>
    </div>
  );
}