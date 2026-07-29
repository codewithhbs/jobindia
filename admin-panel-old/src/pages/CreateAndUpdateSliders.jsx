import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Megaphone } from 'lucide-react';
import api from '../lib/axios';
import { useNavigate, useParams } from 'react-router-dom';

const CreateAndUpdateSliders = () => {
  const { id } = useParams(); // edit mode if exists
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    title: '',
    type: "",  //["jobseeker","driver","employer"]
    subtitle: '',
    redirectType: 'none',
    redirectValue: '',
    order: 0,
    isActive: true,
  });

  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState('');

  // ---------------- FETCH SINGLE (EDIT MODE) ----------------
  const fetchSlider = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/admin/home-sliders/${id}`);
      const data = res.data.data;

      setForm({
        title: data.title || '',
        subtitle: data.subtitle || '',
        redirectType: data.redirectType || 'none',
        type: data?.type || '',
        redirectValue: data.redirectValue || '',
        order: data.order || 0,
        isActive: data.isActive ?? true,
      });

      setPreview(data.image);
    } catch (err) {
      toast.error('Failed to load slider');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) fetchSlider();
  }, [id]);

  // ---------------- HANDLE CHANGE ----------------
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  // ---------------- IMAGE ----------------
  const handleImage = (e) => {
    const file = e.target.files[0];
    setImage(file);
    setPreview(URL.createObjectURL(file));
  };

  // ---------------- SUBMIT ----------------
  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setSaving(true);

      const formData = new FormData();

      Object.keys(form).forEach((key) => {
        formData.append(key, form[key]);
      });

      if (image) {
        formData.append('image', image);
      }

      if (id) {
        // UPDATE
        await api.put(`/admin/home-sliders/${id}`, formData);
        toast.success('Slider updated');
      } else {
        // CREATE
        await api.post('/admin/home-sliders', formData);
        toast.success('Slider created');
      }

      navigate('/home-sliders');
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Something went wrong');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <p className="p-4">Loading...</p>;

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-xl font-bold flex items-center gap-2 mb-4">
        <Megaphone />
        {id ? 'Edit Slider' : 'Create Slider'}
      </h1>

      <form onSubmit={handleSubmit} className="space-y-4">

        {/* Title */}
        <input
          name="title"
          placeholder="Title"
          value={form.title}
          onChange={handleChange}
          className="w-full border p-2 rounded"
        />

        {/* Subtitle */}
        <input
          name="subtitle"
          placeholder="Subtitle"
          value={form.subtitle}
          onChange={handleChange}
          className="w-full border p-2 rounded"
        />

        <select
          name="type"
          value={form.type}
          onChange={handleChange}
          className="w-full border p-2 rounded"
        >
          <option value="none">Select Banner Type</option>
          <option value="jobseeker">Job Seeker</option>
          <option value="driver">Driver Banner</option>
          <option value="employer">Employer Banner</option>
        </select>
        {/* Redirect Type */}
        <select
          name="redirectType"
          value={form.redirectType}
          onChange={handleChange}
          className="w-full border p-2 rounded"
        >
          <option value="none">None</option>
          <option value="job">Job</option>
          <option value="category">Category</option>
          <option value="external">External URL</option>
        </select>

        {/* Redirect Value */}
        <input
          name="redirectValue"
          placeholder="Job ID / Category ID / URL"
          value={form.redirectValue}
          onChange={handleChange}
          className="w-full border p-2 rounded"
        />

        {/* Order */}
        <input
          name="order"
          type="number"
          placeholder="Order"
          value={form.order}
          onChange={handleChange}
          className="w-full border p-2 rounded"
        />

        {/* Active */}
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            name="isActive"
            checked={form.isActive}
            onChange={handleChange}
          />
          Active
        </label>

        {/* Image */}
        <input type="file" onChange={handleImage} />

        {preview && (
          <img
            src={preview}
            alt="preview"
            className="w-full h-40 object-cover rounded"
          />
        )}

        {/* Submit */}
        <button
          type="submit"
          disabled={saving}
          className="bg-blue-600 text-white px-4 py-2 rounded w-full"
        >
          {saving ? 'Saving...' : id ? 'Update Slider' : 'Create Slider'}
        </button>
      </form>
    </div>
  );
};

export default CreateAndUpdateSliders;