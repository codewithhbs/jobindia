import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import api from '../lib/axios';
import { Megaphone, Edit, Trash2, Plus, ImageOff, GripVertical } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const TYPE_TABS = [
  { value: 'all', label: 'All' },
  { value: 'jobseeker', label: 'Jobseeker' },
  { value: 'driver', label: 'Driver' },
];

const TYPE_BADGE = {
  jobseeker: 'bg-indigo-50 text-indigo-600',
  driver: 'bg-amber-50 text-amber-600',
};

function formatDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

const AllHomeSliders = () => {
  const [sliders, setSliders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState('all');
  const [togglingId, setTogglingId] = useState(null);
  const navigate = useNavigate();

  const fetchSliders = async () => {
    try {
      setLoading(true);
      const res = await api.get('/admin/home-sliders?type=all');
      setSliders(res.data.data || []);
    } catch (err) {
      toast.error('Failed to load sliders');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSliders();
  }, []);

  const deleteSlider = async (id) => {
    if (!confirm('Delete this slider?')) return;
    try {
      await api.delete(`/admin/home-sliders/${id}`);
      toast.success('Deleted');
      fetchSliders();
    } catch {
      toast.error('Delete failed');
    }
  };

  const toggleActive = async (s) => {
    setTogglingId(s._id);
    try {
      await api.put(`/admin/home-sliders/${s._id}`, { isActive: !s.isActive });
      setSliders((prev) =>
        prev.map((x) => (x._id === s._id ? { ...x, isActive: !x.isActive } : x))
      );
      toast.success(s.isActive ? 'Slider hidden' : 'Slider shown');
    } catch {
      toast.error('Could not update status');
    } finally {
      setTogglingId(null);
    }
  };

  const filtered = tab === 'all' ? sliders : sliders.filter((s) => s.type === tab);
  const counts = {
    all: sliders.length,
    jobseeker: sliders.filter((s) => s.type === 'jobseeker').length,
    driver: sliders.filter((s) => s.type === 'driver').length,
  };

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* ---- Header ---- */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-extrabold flex items-center gap-2 text-gray-900">
            <Megaphone size={22} className="text-blue-600" /> Home Sliders
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">Banners shown on the app home screen</p>
        </div>

        <button
          onClick={() => navigate('/home-sliders/create')}
          className="inline-flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-4 py-2.5 rounded-lg transition-colors"
        >
          <Plus size={16} /> Create slider
        </button>
      </div>

      {/* ---- Type tabs ---- */}
      <div className="flex gap-1 mb-5 border-b border-gray-200">
        {TYPE_TABS.map((t) => (
          <button
            key={t.value}
            onClick={() => setTab(t.value)}
            className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors ${
              tab === t.value
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {t.label}
            <span className="ml-1.5 text-xs font-bold text-gray-400">{counts[t.value] ?? 0}</span>
          </button>
        ))}
      </div>

      {/* ---- List ---- */}
      {loading ? (
        <div className="grid gap-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-24 rounded-xl bg-gray-100 animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-gray-200 rounded-xl">
          <ImageOff size={32} className="mx-auto text-gray-300 mb-2" />
          <p className="text-gray-500 font-medium">No sliders found</p>
          <p className="text-sm text-gray-400 mt-1">Create one to show a banner on the home screen</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {filtered.map((s) => (
            <div
              key={s._id}
              className={`group bg-white border rounded-xl p-3.5 flex items-center gap-4 transition-shadow hover:shadow-sm ${
                s.isActive ? 'border-gray-200' : 'border-gray-100 opacity-60'
              }`}
            >
              <GripVertical size={16} className="text-gray-300 shrink-0 hidden sm:block" />

              <div className="relative w-28 h-[72px] shrink-0 rounded-lg overflow-hidden bg-gray-100">
                {s.image ? (
                  <img src={s.image} className="w-full h-full object-cover" alt={s.title || 'Slider'} />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <ImageOff size={20} className="text-gray-300" />
                  </div>
                )}
                <span className="absolute top-1 left-1 bg-black/60 text-white text-[10px] font-bold px-1.5 py-0.5 rounded">
                  #{s.order ?? 0}
                </span>
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-semibold text-gray-900 truncate">
                    {s.title || <span className="text-gray-400 italic font-normal">Untitled slider</span>}
                  </h3>
                  {s.type && (
                    <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full capitalize ${TYPE_BADGE[s.type] || 'bg-gray-100 text-gray-500'}`}>
                      {s.type}
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-500 truncate mt-0.5">
                  {s.subtitle || <span className="text-gray-300 italic">No subtitle</span>}
                </p>
                <div className="flex items-center gap-3 text-xs text-gray-400 mt-1.5">
                  <span className="capitalize">{s.redirectType === 'none' ? 'No redirect' : `Redirects to ${s.redirectType}`}</span>
                  <span>·</span>
                  <span>{formatDate(s.createdAt)}</span>
                </div>
              </div>

              {/* Active toggle */}
              <button
                onClick={() => toggleActive(s)}
                disabled={togglingId === s._id}
                title={s.isActive ? 'Active — click to hide' : 'Hidden — click to show'}
                className={`relative shrink-0 inline-flex h-6 w-11 items-center rounded-full transition-colors disabled:opacity-50 ${
                  s.isActive ? 'bg-green-500' : 'bg-gray-300'
                }`}
              >
                <span
                  className={`inline-block h-4.5 w-4.5 transform rounded-full bg-white shadow transition-transform ${
                    s.isActive ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>

              <div className="flex gap-1 shrink-0">
                <button
                  onClick={() => navigate(`/home-sliders/edit/${s._id}`)}
                  className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-blue-600 transition-colors"
                  title="Edit"
                >
                  <Edit size={16} />
                </button>
                <button
                  onClick={() => deleteSlider(s._id)}
                  className="p-2 rounded-lg text-gray-500 hover:bg-red-50 hover:text-red-600 transition-colors"
                  title="Delete"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AllHomeSliders;