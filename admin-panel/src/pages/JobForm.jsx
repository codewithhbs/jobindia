import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { API } from '../lib/api';
import { Spinner } from '../components/ui';

const JOB_TYPES = ['full_time', 'part_time', 'contract', 'freelance', 'internship'];
const STATUSES = ['draft', 'active', 'paused', 'closed'];

// Set this in your .env as VITE_GOOGLE_MAPS_API_KEY=your_key_here
const GOOGLE_MAPS_API_KEY = "AIzaSyDnyLLiPykuaRbCKZEmBPa0jzdiB61qRpc";

// Loads the Google Maps JS SDK (places library) exactly once, however many
// JobForm instances mount.
let googleMapsPromise = null;
function loadGoogleMaps() {
  if (window.google?.maps?.places) return Promise.resolve(window.google);
  if (googleMapsPromise) return googleMapsPromise;

  googleMapsPromise = new Promise((resolve, reject) => {
    const existing = document.getElementById('google-maps-script');
    if (existing) {
      existing.addEventListener('load', () => resolve(window.google));
      existing.addEventListener('error', reject);
      return;
    }
    const script = document.createElement('script');
    script.id = 'google-maps-script';
    script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=places`;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve(window.google);
    script.onerror = reject;
    document.head.appendChild(script);
  });
  return googleMapsPromise;
}

function getComponent(components, type) {
  const match = components?.find((c) => c.types.includes(type));
  return match?.long_name || '';
}

// Pool of demo jobs — "Load Demo" picks one at random and fills the form.
const DEMO_JOBS = [
  {
    title: 'Frontend Developer (React)',
    description:
      'We are looking for a skilled Frontend Developer with strong React experience to join our product team. You will build responsive, accessible UIs, collaborate with designers and backend engineers, and ship features end-to-end.',
    jobType: 'full_time',
    vacancies: 2,
    salaryMin: 25000,
    salaryMax: 45000,
    address: 'MG Road, Bengaluru, Karnataka, India',
    city: 'Bengaluru',
    state: 'Karnataka',
    pincode: '560001',
    latitude: 12.9758,
    longitude: 77.6068,
    skills: 'React, JavaScript, Tailwind CSS, REST APIs, Git',
    benefits: 'Health insurance, Flexible hours, Work from home, Annual bonus',
    isRemote: true,
    isFeatured: true,
  },
  {
    title: 'Telecaller / Customer Support Executive',
    description:
      'Hiring telecallers for inbound and outbound customer support. Good communication skills in Hindi and English required. Freshers welcome, training provided.',
    jobType: 'full_time',
    vacancies: 10,
    salaryMin: 14000,
    salaryMax: 20000,
    address: 'Hazratganj, Lucknow, Uttar Pradesh, India',
    city: 'Lucknow',
    state: 'Uttar Pradesh',
    pincode: '226001',
    latitude: 26.8467,
    longitude: 80.9462,
    skills: 'Communication, MS Excel, Customer Handling',
    benefits: 'PF, ESI, Incentives, Cab facility',
    isRemote: false,
    isFeatured: false,
  },
  {
    title: 'Graphic Design Intern',
    description:
      'Looking for a creative Graphic Design intern to support our marketing team with social media creatives, banners, and brand assets. Great opportunity to learn and build a portfolio.',
    jobType: 'internship',
    vacancies: 1,
    salaryMin: 5000,
    salaryMax: 10000,
    address: 'Koregaon Park, Pune, Maharashtra, India',
    city: 'Pune',
    state: 'Maharashtra',
    pincode: '411001',
    latitude: 18.5362,
    longitude: 73.8939,
    skills: 'Photoshop, Illustrator, Canva, Figma',
    benefits: 'Certificate, Letter of recommendation, Flexible hours',
    isRemote: true,
    isFeatured: false,
  },
  {
    title: 'Delivery Executive',
    description:
      'Join our logistics team as a Delivery Executive. Own two-wheeler required. Daily payouts available, flexible shift timings.',
    jobType: 'part_time',
    vacancies: 15,
    salaryMin: 12000,
    salaryMax: 18000,
    address: 'Banjara Hills, Hyderabad, Telangana, India',
    city: 'Hyderabad',
    state: 'Telangana',
    pincode: '500034',
    latitude: 17.4126,
    longitude: 78.4482,
    skills: 'Two-wheeler license, Local area knowledge, Smartphone usage',
    benefits: 'Daily payout, Fuel allowance, Accident insurance',
    isRemote: false,
    isFeatured: false,
  },
];

export default function JobForm() {
  const { id } = useParams(); // undefined = create
  const navigate = useNavigate();
  const editing = !!id;
  const [loading, setLoading] = useState(editing);
  const [categories, setCategories] = useState([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({
    title: '', description: '', category: '', jobType: 'full_time', vacancies: 1,
    salaryMin: '', salaryMax: '',
    address: '', city: '', state: '', country: 'India', pincode: '', latitude: '', longitude: '',
    skills: '', benefits: '',
    status: 'active', isRemote: false, isFeatured: false,
  });
  const set = (k) => (v) => setForm((f) => ({ ...f, [k]: v }));

  const addressInputRef = useRef(null);
  const autocompleteRef = useRef(null);

  const fetchCategories = async () => {
    setCategoriesLoading(true);
    try {
      const res = await API.categories.list();
      setCategories(res || []);
    } catch (error) {
      toast.error('Could not load categories');
    } finally {
      setCategoriesLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  // ---- Google Places Autocomplete on the address field ----
  useEffect(() => {
    if (!GOOGLE_MAPS_API_KEY) return;
    let listener;
    loadGoogleMaps()
      .then((google) => {
        if (!addressInputRef.current) return;
        autocompleteRef.current = new google.maps.places.Autocomplete(addressInputRef.current, {
          types: ['geocode'],
          componentRestrictions: { country: 'in' },
          fields: ['formatted_address', 'address_components', 'geometry'],
        });
        listener = autocompleteRef.current.addListener('place_changed', () => {
          const place = autocompleteRef.current.getPlace();
          if (!place?.geometry) return; // user pressed enter without picking a suggestion

          const components = place.address_components;
          const city =
            getComponent(components, 'locality') ||
            getComponent(components, 'administrative_area_level_2') ||
            getComponent(components, 'sublocality');
          const state = getComponent(components, 'administrative_area_level_1');
          const country = getComponent(components, 'country') || 'India';
          const pincode = getComponent(components, 'postal_code');

          setForm((f) => ({
            ...f,
            address: place.formatted_address || f.address,
            city: city || f.city,
            state: state || f.state,
            country,
            pincode: pincode || f.pincode,
            latitude: place.geometry.location.lat(),
            longitude: place.geometry.location.lng(),
          }));
        });
      })
      .catch(() => toast.error('Could not load Google Maps. Check your API key / network.'));

    return () => listener?.remove();
  }, []);

  useEffect(() => {
    if (!editing) return;
    (async () => {
      try {
        const j = await API.manage.getJob(id);
        setForm({
          title: j.title || '', description: j.description || '', category: j.category || '',
          jobType: j.jobType || 'full_time', vacancies: j.vacancies || 1,
          salaryMin: j.salary?.min || '', salaryMax: j.salary?.max || '',
          address: j.location?.address || '', city: j.location?.city || '',
          state: j.location?.state || '', country: j.location?.country || 'India',
          pincode: j.location?.pincode || '',
          latitude: j.location?.coordinates?.[1] || '', longitude: j.location?.coordinates?.[0] || '',
          skills: (j.requirements?.skills || []).join(', '),
          benefits: (j.benefits || []).join(', '),
          status: j.status || 'active', isRemote: j.location?.isRemote || false, isFeatured: j.isFeatured || false,
        });
      } catch (e) { toast.error(e.message); } finally { setLoading(false); }
    })();
  }, [id, editing]);

  // Admin clicks "Load Demo" -> auto-fills the form with realistic sample data,
  // picking a real category from the fetched list when available.
  const loadDemo = () => {
    const demo = DEMO_JOBS[Math.floor(Math.random() * DEMO_JOBS.length)];
    const randomCategory = categories.length
      ? categories[Math.floor(Math.random() * categories.length)]
      : null;

    setForm((f) => ({
      ...f,
      ...demo,
      country: 'India',
      category: randomCategory ? (randomCategory.name || randomCategory) : f.category,
      status: 'active',
    }));
    toast.success('Demo data loaded');
  };

  const save = async () => {
    if (!form.title || !form.description || !form.category) return toast.error('Title, description & category required');
    if (!form.city) return toast.error('City is required — pick an address from the suggestions');
    setBusy(true);
    const body = {
      title: form.title, description: form.description, category: form.category,
      jobType: form.jobType, vacancies: Number(form.vacancies) || 1,
      salary: { min: Number(form.salaryMin) || undefined, max: Number(form.salaryMax) || undefined, period: 'monthly' },
      location: {
        address: form.address,
        city: form.city || 'Delhi',
        state: form.state,
        country: form.country || 'India',
        pincode: form.pincode,
        isRemote: form.isRemote,
        latitude: form.latitude,
        longitude: form.longitude,
      },
      requirements: {
        skills: form.skills.split(',').map((s) => s.trim()).filter(Boolean),
      },
      benefits: form.benefits.split(',').map((s) => s.trim()).filter(Boolean),
      status: form.status,
       isFeatured: form.isFeatured,
    };
    try {
      if (editing) await API.manage.updateJob(id, body);
      else await API.manage.createJob(body);
      toast.success(editing ? 'Job updated' : 'Job created');
      navigate('/jobs');
    } catch (e) { toast.error(e.message); } finally { setBusy(false); }
  };

  if (loading) return <Spinner />;

  return (
    <div className="max-w-3xl space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-extrabold">{editing ? 'Edit Job' : 'Create Job'}</h1>
        {!editing && (
          <button type="button" className="btn-ghost" onClick={loadDemo}>
            ⚡ Load Demo
          </button>
        )}
      </div>
      <div className="card space-y-4 p-6">
        <div><label className="label">Title *</label><input className="input" value={form.title} onChange={(e) => set('title')(e.target.value)} /></div>
        <div><label className="label">Description *</label><textarea className="input min-h-[120px]" value={form.description} onChange={(e) => set('description')(e.target.value)} /></div>
        <div className="grid gap-4 md:grid-cols-3">
          <div>
            <label className="label">Category *</label>
            <select
              className="input"
              value={form.category}
              onChange={(e) => set('category')(e.target.value)}
              disabled={categoriesLoading}
            >
              <option value="">{categoriesLoading ? 'Loading categories...' : 'Select category'}</option>
              {categories.map((c) => {
                const value = c.name || c;
                return <option key={c._id || value} value={value}>{value}</option>;
              })}
            </select>
            {!categoriesLoading && categories.length === 0 && (
              <p className="mt-1 text-xs text-red-500">No categories found. Add one first.</p>
            )}
          </div>
          <div>
            <label className="label">Job Type</label>
            <select className="input" value={form.jobType} onChange={(e) => set('jobType')(e.target.value)}>
              {JOB_TYPES.map((t) => <option key={t} value={t}>{t.replace('_', ' ')}</option>)}
            </select>
          </div>
          <div><label className="label">Vacancies</label><input type="number" className="input" value={form.vacancies} onChange={(e) => set('vacancies')(e.target.value)} /></div>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <div><label className="label">Salary min ₹/mo</label><input type="number" className="input" value={form.salaryMin} onChange={(e) => set('salaryMin')(e.target.value)} /></div>
          <div><label className="label">Salary max ₹/mo</label><input type="number" className="input" value={form.salaryMax} onChange={(e) => set('salaryMax')(e.target.value)} /></div>
        </div>

        {/* ---- Address: Google Places Autocomplete ---- */}
        <div>
          <label className="label">Address {!GOOGLE_MAPS_API_KEY && <span className="text-xs text-red-500">(set VITE_GOOGLE_MAPS_API_KEY to enable suggestions)</span>}</label>
          <input
            ref={addressInputRef}
            className="input"
            placeholder="Start typing an area, locality or landmark..."
            value={form.address}
            onChange={(e) => set('address')(e.target.value)}
          />
          <p className="mt-1 text-xs text-gray-400">Pick a suggestion to auto-fill city, state and pincode.</p>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          <div><label className="label">City *</label><input className="input" value={form.city} onChange={(e) => set('city')(e.target.value)} /></div>
          <div><label className="label">State</label><input className="input" value={form.state} onChange={(e) => set('state')(e.target.value)} /></div>
          <div><label className="label">Pincode</label><input className="input" value={form.pincode} onChange={(e) => set('pincode')(e.target.value)} /></div>
        </div>

        <div><label className="label">Skills (comma separated)</label><input className="input" value={form.skills} onChange={(e) => set('skills')(e.target.value)} /></div>
        <div><label className="label">Benefits (comma separated)</label><input className="input" value={form.benefits} onChange={(e) => set('benefits')(e.target.value)} /></div>
        <div className="flex flex-wrap items-center gap-6">
          <div>
            <label className="label">Status</label>
            <select className="input w-40" value={form.status} onChange={(e) => set('status')(e.target.value)}>
              {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" className="h-4 w-4 accent-primary" checked={form.isRemote} onChange={(e) => set('isRemote')(e.target.checked)} /> Remote</label>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" className="h-4 w-4 accent-primary" checked={form.isFeatured} onChange={(e) => set('isFeatured')(e.target.checked)} /> Featured</label>
        </div>
        <div className="flex gap-2">
          <button className="btn-primary" disabled={busy} onClick={save}>{busy ? 'Saving...' : editing ? 'Update Job' : 'Create Job'}</button>
          <button className="btn-ghost" onClick={() => navigate('/jobs')}>Cancel</button>
        </div>
      </div>
    </div>
  );
}