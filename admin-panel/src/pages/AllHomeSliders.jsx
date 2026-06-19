import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import api from '../lib/axios';
import { Megaphone, Edit, Trash } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const AllHomeSliders = () => {
  const [sliders, setSliders] = useState([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const fetchSliders = async () => {
    try {
      setLoading(true);
      const res = await api.get('/admin/home-sliders');
      setSliders(res.data.data);
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
    try {
      await api.delete(`/admin/home-sliders/${id}`);
      toast.success('Deleted');
      fetchSliders();
    } catch {
      toast.error('Delete failed');
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between mb-4">
        <h1 className="text-xl font-bold flex items-center gap-2">
          <Megaphone /> Home Sliders
        </h1>

        <button
          onClick={() => navigate('/home-sliders/create')}
          className="bg-blue-600 text-white px-4 py-2 rounded"
        >
          + Create
        </button>
      </div>

      {loading ? (
        <p>Loading...</p>
      ) : (
        <div className="grid gap-4">
          {sliders.map((s) => (
            <div key={s._id} className="border p-4 rounded flex gap-4 items-center">
              <img src={s.image} className="w-24 h-16 object-cover rounded" />

              <div className="flex-1">
                <h3 className="font-bold">{s.title}</h3>
                <p className="text-sm text-gray-500">{s.subtitle}</p>
              </div>

              <button onClick={() => navigate(`/home-sliders/edit/${s._id}`)}>
                <Edit />
              </button>

              <button onClick={() => deleteSlider(s._id)}>
                <Trash color="red" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AllHomeSliders;