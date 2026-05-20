import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../../components/Sidebar';
import TopBar from '../../components/TopBar';
import userIcon       from '../../assets/images/svg/User.svg';
import userCircleIcon from '../../assets/images/svg/UserCircle.svg';
import atIcon         from '../../assets/images/svg/At.svg';
import linkIcon       from '../../assets/images/svg/LinkSimple.svg';
import envelopeIcon   from '../../assets/images/svg/Envelope.svg';

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8000';

type Tab = 'org' | 'more' | 'contact' | 'complete';

const NPO_TYPES = [
  'Charitable Organization',
  'Foundation',
  'Non-Governmental Organization',
  'Others',
];

const SDG_FOCUS_AREAS = [
  'SDG 1 - No Poverty',
  'SDG 2 - Zero Hunger',
  'SDG 3 - Good Health & Well-being',
  'SDG 4 - Quality Education',
  'SDG 5 - Gender Equality',
  'SDG 6 - Clean Water & Sanitation',
  'SDG 7 - Affordable & Clean Energy',
  'SDG 8 - Decent Work & Economic Growth',
  'SDG 9 - Industry, Innovation & Infrastructure',
  'SDG 10 - Reduced Inequalities',
  'SDG 11 - Sustainable Cities & Communities',
  'SDG 12 - Responsible Consumption & Production',
  'SDG 13 - Climate Action',
  'SDG 14 - Life Below Water',
  'SDG 15 - Life On Land',
  'SDG 16 - Peace, Justice & Strong Institutions',
  'SDG 17 - Partnerships for the Goals',
];

const SOCIAL_PLATFORMS = ['LinkedIn', 'GitHub', 'Behance / Dribbble', 'Instagram', 'Twitter / X', 'Facebook', 'Medium / Substack'];

const inputCls =
  'w-full h-[48px] border border-[#e4e5e8] bg-white rounded-full px-4 text-sm text-[#18191c] placeholder-[#9199a3] focus:outline-none focus:border-[#ff9400] focus:ring-1 focus:ring-[#ff9400] transition-colors';

function UploadArea({ hint, accept, cover, imageType }: {
  hint: string; accept?: string; cover?: boolean; imageType: 'avatar' | 'cover';
}) {
  const [preview, setPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');

  async function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setPreview(URL.createObjectURL(file));
    setUploadError('');
    setUploading(true);
    try {
      const user = JSON.parse(localStorage.getItem('user') ?? '{}');
      const token = user.access_token ?? '';
      const form = new FormData();
      form.append('file', file);
      form.append('image_type', imageType);
      const res = await fetch(`${API_URL}/api/upload/profile-image`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: form,
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail ?? 'Upload failed');
      }
      const data = await res.json();
      setPreview(data.url);
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  }

  if (preview) {
    return (
      <label className="relative w-full h-full min-h-[140px] rounded-lg overflow-hidden cursor-pointer block">
        <img
          src={preview}
          alt="preview"
          className={`w-full h-full object-cover ${cover ? 'object-center' : 'object-top'}`}
          style={{ minHeight: 140 }}
        />
        {uploading && (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
            <span className="text-white text-sm font-medium">Uploading…</span>
          </div>
        )}
        {!uploading && (
          <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
            <span className="text-white text-sm font-medium">Change photo</span>
          </div>
        )}
        {uploadError && (
          <div className="absolute bottom-0 left-0 right-0 bg-red-500/90 text-white text-xs text-center py-1">
            {uploadError}
          </div>
        )}
        <input type="file" accept={accept} className="sr-only" onChange={handleChange} />
      </label>
    );
  }

  return (
    <label className="flex flex-col items-center gap-3 border border-dashed border-[#767676] bg-[#f3f5f7] rounded-lg p-4 cursor-pointer hover:bg-[#eef0f2] transition-colors w-full h-full min-h-[140px] justify-center">
      <input type="file" accept={accept} className="sr-only" onChange={handleChange} />
      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" className="text-[#7c8493]">
        <polyline points="16 16 12 12 8 16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        <line x1="12" y1="12" x2="12" y2="21" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        <path d="M20.39 18.39A5 5 0 0018 9h-1.26A8 8 0 103 16.3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
      <div className="text-center">
        <p className="text-sm text-[#18191c]">
          <span className="font-medium">Browse photo</span> or drop here
        </p>
        <p className="text-xs text-[#5e6670] mt-1 leading-relaxed">{hint}</p>
      </div>
    </label>
  );
}

function TagInput({ label, placeholder, hint, tags, onAdd, onRemove }: {
  label: string; placeholder: string; hint?: string;
  tags: string[]; onAdd: (t: string) => void; onRemove: (t: string) => void;
}) {
  const [input, setInput] = useState('');

  function commit() {
    const v = input.trim().replace(/,/g, '');
    if (v) { onAdd(v); setInput(''); }
  }

  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[#18191c] text-sm">{label}</label>
      <div className="min-h-[48px] border border-[#e4e5e8] bg-white rounded-full px-3 flex flex-wrap items-center gap-1.5 py-1.5">
        {tags.map((t) => (
          <span key={t} className="flex items-center gap-1 bg-[#ffeacc] text-[#ff9400] text-sm rounded-full pl-3 pr-2 py-1 shrink-0">
            {t}
            <button type="button" onClick={() => onRemove(t)} className="hover:text-[#cc7700] transition-colors">
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none">
                <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
              </svg>
            </button>
          </span>
        ))}
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === ',' || e.key === 'Enter') { e.preventDefault(); commit(); } }}
          onBlur={commit}
          placeholder={tags.length === 0 ? placeholder : ''}
          className="flex-1 min-w-[100px] text-sm bg-transparent outline-none text-[#18191c] placeholder-[#9199a3]"
        />
      </div>
      {hint && <p className="text-[#9199a3] text-sm">{hint}</p>}
    </div>
  );
}

function NPOTypeDropdown({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={`w-full h-[48px] border rounded-full px-4 flex items-center justify-between text-sm transition-colors bg-white ${
          open ? 'border-[#ff9400] ring-1 ring-[#ff9400]' : 'border-[#e4e5e8]'
        }`}
      >
        <span className={value ? 'text-[#18191c]' : 'text-[#9199a3]'}>
          {value || 'Select NPO type'}
        </span>
        <svg
          className={`text-[#9199a3] transition-transform ${open ? 'rotate-180' : ''}`}
          width="16" height="16" viewBox="0 0 24 24" fill="none"
        >
          <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>

      {open && (
        <div className="absolute z-50 top-[calc(100%+6px)] left-0 right-0 bg-white rounded-2xl shadow-[0px_8px_32px_rgba(0,0,0,0.12)] border border-[#f2f2f3] overflow-hidden">
          {NPO_TYPES.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => { onChange(t); setOpen(false); }}
              className={`w-full text-left px-5 py-3.5 text-sm transition-colors ${
                value === t
                  ? 'text-[#ff9400] font-semibold bg-[#fff8f0]'
                  : 'text-[#18191c] hover:bg-[#f9fafb]'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function NonProfitOrgAccountUpdatePage() {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [tab, setTab] = useState<Tab>('org');
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [loading, setLoading] = useState(true);

  // Org Info
  const [sector, setSector] = useState<'government' | 'private'>('government');
  const [npoType, setNpoType] = useState('');
  const [causeKeywords, setCauseKeywords] = useState<string[]>([]);
  const [operateLocations, setOperateLocations] = useState<string[]>([]);
  const [sdgFocusAreas, setSdgFocusAreas] = useState<string[]>([]);
  const [bio, setBio] = useState('');

  // More Info
  const [services, setServices] = useState<string[]>([]);
  const [industries, setIndustries] = useState([{ name: '', years: '' }]);
  const [website, setWebsite] = useState('');
  const [socialLinks, setSocialLinks] = useState([{ platform: 'LinkedIn', url: '' }]);

  // Contact
  const [reachFor, setReachFor] = useState<string[]>([]);
  const [location, setLocation] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user') ?? '{}');
    const token = user.access_token;
    if (!token) {
      navigate('/');
      return;
    }
    fetch(`${API_URL}/api/profile`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((d) => {
        if (d.sector) setSector(d.sector);
        if (d.describe_as) setNpoType(d.describe_as);
        if (d.skills?.length) setCauseKeywords(d.skills);
        if (d.edu_levels_offered?.length) setOperateLocations(d.edu_levels_offered);
        if (d.applicable_industries?.length) setSdgFocusAreas(d.applicable_industries);
        if (d.bio) setBio(d.bio);
        if (d.services?.length) setServices(d.services);
        if (d.industries?.length) setIndustries(d.industries);
        if (d.website) setWebsite(d.website);
        if (d.social_links?.length) setSocialLinks(d.social_links);
        if (d.reach_for?.length) setReachFor(d.reach_for);
        if (d.location) setLocation(d.location);
        if (d.phone) setPhone(d.phone);
        if (d.email) setEmail(d.email);
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-4">
        <div className="flex flex-col items-center gap-4 max-w-sm text-center">
          <div className="relative w-14 h-14">
            <div className="absolute inset-0 rounded-full border-4 border-[#ffeacc] opacity-40"></div>
            <div className="absolute inset-0 rounded-full border-4 border-[#ff9400] border-t-transparent animate-spin"></div>
            <div className="absolute inset-3 rounded-full bg-[#ff9400]/10 animate-pulse"></div>
          </div>
          <div className="space-y-1 mt-2">
            <h3 className="text-base font-semibold text-[#18191c] tracking-tight animate-pulse">
              Loading workspace…
            </h3>
            <p className="text-xs text-[#7c8493]">
              Setting up your personalized dashboard
            </p>
          </div>
        </div>
      </div>
    );
  }

  const progressMap: Record<Tab, number> = {
    org: 25, more: 50, contact: 75, complete: 100,
  };

  const TABS: { id: Tab; label: string; icon: string }[] = [
    { id: 'org',     label: 'Organization Info', icon: userIcon },
    { id: 'more',    label: 'More Info',          icon: userCircleIcon },
    { id: 'contact', label: 'Contact',            icon: atIcon },
  ];

  function toggleSdg(sdg: string) {
    setSdgFocusAreas((prev) =>
      prev.includes(sdg) ? prev.filter((s) => s !== sdg) : [...prev, sdg]
    );
  }

  async function handleSave() {
    const user = JSON.parse(localStorage.getItem('user') ?? '{}');
    const token = user.access_token;
    if (!token) { navigate('/'); return; }

    const payloadByTab: Record<string, object> = {
      org:     { sector, describe_as: npoType, skills: causeKeywords, edu_levels_offered: operateLocations, applicable_industries: sdgFocusAreas, bio },
      more:    { services, industries, website, social_links: socialLinks },
      contact: { reach_for: reachFor, location, phone, setup_complete: true },
    };

    setSaving(true);
    setSaveError('');
    try {
      const res = await fetch(`${API_URL}/api/profile`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(payloadByTab[tab]),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail ?? 'Save failed');
      }
      if (tab === 'org') setTab('more');
      else if (tab === 'more') setTab('contact');
      else setTab('complete');
    } catch (e: unknown) {
      setSaveError(e instanceof Error ? e.message : 'Something went wrong');
    } finally {
      setSaving(false);
    }
  }

  function updateIndustry(idx: number, field: 'name' | 'years', value: string) {
    setIndustries((prev) => prev.map((item, i) => i === idx ? { ...item, [field]: value } : item));
  }

  function removeSocialLink(idx: number) {
    setSocialLinks((prev) => prev.filter((_, i) => i !== idx));
  }

  function updateSocialLink(idx: number, field: 'platform' | 'url', value: string) {
    setSocialLinks((prev) => prev.map((l, i) => i === idx ? { ...l, [field]: value } : l));
  }

  return (
    <div className="min-h-screen bg-white">
      <TopBar onMenuToggle={() => setSidebarOpen((v) => !v)} />
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="pt-[64px] sm:pt-[72px] lg:pt-[78px] lg:pl-[280px] min-h-screen">

        {/* Completion screen */}
        {tab === 'complete' && (
          <div className="flex items-center justify-center min-h-[calc(100vh-78px)] px-4">
            <div className="flex flex-col items-center gap-8 text-center max-w-md w-full">
              <div className="bg-[#ffeacc] p-10 rounded-full">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" className="text-[#ff9400]">
                  <polyline points="20 6 9 17 4 12" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <h2 className="text-[#18191c] text-xl sm:text-2xl font-semibold leading-snug">
                🎉 Congratulations, Your profile is 100% complete!
              </h2>
              <button
                onClick={() => navigate('/home')}
                className="flex items-center gap-3 bg-[#ff9400] text-white text-base font-semibold rounded-full px-8 py-4 hover:bg-[#e68500] transition-colors shadow-[0px_4px_12px_rgba(255,148,0,0.35)]"
              >
                Go To Home
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path d="M5 12h14M13 6l6 6-6 6" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            </div>
          </div>
        )}

        {/* Form */}
        {tab !== 'complete' && (
          <div className="max-w-[960px] mx-auto px-4 sm:px-6 py-6 sm:py-8">

            {/* Progress bar */}
            <div className="mb-6 sm:mb-8">
              <div className="flex items-center justify-between text-sm sm:text-base mb-3">
                <span className="text-[#767f8c]">Setup Progress</span>
                <span className="text-[#ff9400] font-medium">{progressMap[tab]}% Completed</span>
              </div>
              <div className="w-full h-[9px] bg-[#e7f0fa] rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#ff9400] rounded-full transition-all duration-500"
                  style={{ width: `${progressMap[tab]}%` }}
                />
              </div>
            </div>

            {/* Tab bar */}
            <div className="bg-[#f9fafb] rounded-[10px] p-1 mb-6 sm:mb-8">
              <div className="flex items-center">
                {TABS.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setTab(t.id)}
                    className={`flex-1 flex items-center justify-center gap-2 px-3 sm:px-5 py-3 rounded-[10px] text-sm transition-all ${
                      tab === t.id
                        ? 'bg-white shadow-sm text-[#ff9400] font-semibold'
                        : 'text-[#4f5665] font-medium hover:text-[#18191c]'
                    }`}
                  >
                    <img src={t.icon} alt="" className="w-5 h-5 shrink-0" />
                    <span className="hidden xs:inline sm:inline">{t.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Tab: Organization Info */}
            {tab === 'org' && (
              <div className="flex flex-col gap-6">

                {/* Photo uploads */}
                <div className="flex flex-col sm:flex-row gap-5 sm:gap-6">
                  <div className="flex flex-col gap-2 w-full sm:w-[260px] shrink-0">
                    <p className="text-[#18191c] text-sm font-medium">Profile Photo</p>
                    <UploadArea
                      hint="A photo larger than 400 pixels work best. Max photo size 5 MB."
                      accept="image/*"
                      imageType="avatar"
                    />
                  </div>
                  <div className="flex flex-col gap-2 flex-1">
                    <p className="text-[#18191c] text-sm font-medium">Cover Photo</p>
                    <UploadArea
                      hint="Banner images optimal dimension 1520 × 400. Supported form jpeg, png, max photo size 5 mb."
                      accept="image/*"
                      cover
                      imageType="cover"
                    />
                  </div>
                </div>

                {/* NPO Sector */}
                <div className="flex flex-col gap-3">
                  <p className="text-[#18191c] text-sm font-semibold">Select your NPO sector</p>
                  <div className="flex gap-3 flex-wrap">
                    <button
                      type="button"
                      onClick={() => setSector('government')}
                      className={`px-5 py-2.5 rounded-full border text-sm font-medium transition-colors ${
                        sector === 'government'
                          ? 'border-[#ff9400] text-[#ff9400] bg-white'
                          : 'border-[#d1d5db] text-[#6b7280] bg-white hover:border-[#ff9400] hover:text-[#ff9400]'
                      }`}
                    >
                      Government Sector
                    </button>
                    <button
                      type="button"
                      onClick={() => setSector('private')}
                      className={`px-5 py-2.5 rounded-full border text-sm font-medium transition-colors ${
                        sector === 'private'
                          ? 'border-[#ff9400] text-[#ff9400] bg-white'
                          : 'border-[#d1d5db] text-[#6b7280] bg-white hover:border-[#ff9400] hover:text-[#ff9400]'
                      }`}
                    >
                      Private Sector
                    </button>
                  </div>
                </div>

                {/* NPO Type dropdown */}
                <div className="flex flex-col gap-2">
                  <label className="text-[#18191c] text-sm font-semibold">Which Type of NPO are you?</label>
                  <NPOTypeDropdown value={npoType} onChange={setNpoType} />
                </div>

                {/* Cause keywords */}
                <TagInput
                  label="Mention your Organization's main cause in keywords"
                  placeholder="Type a keyword and press comma or Enter"
                  hint="Enter a comma after each tag"
                  tags={causeKeywords}
                  onAdd={(t) => setCauseKeywords((prev) => [...prev, t])}
                  onRemove={(t) => setCauseKeywords((prev) => prev.filter((x) => x !== t))}
                />

                {/* Operate locations */}
                <TagInput
                  label="Mention the locations where you operate from"
                  placeholder="Type a location and press comma or Enter"
                  hint="Enter a comma after each tag"
                  tags={operateLocations}
                  onAdd={(t) => setOperateLocations((prev) => [...prev, t])}
                  onRemove={(t) => setOperateLocations((prev) => prev.filter((x) => x !== t))}
                />

                {/* SDG Focus Areas */}
                <div className="flex flex-col gap-3">
                  <p className="text-[#18191c] text-sm font-semibold">Select Your Applicable SDG Focus Areas</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-3">
                    {SDG_FOCUS_AREAS.map((sdg) => (
                      <label key={sdg} className="flex items-center gap-2.5 cursor-pointer group">
                        <div
                          onClick={() => toggleSdg(sdg)}
                          className={`w-4 h-4 shrink-0 border rounded flex items-center justify-center transition-colors cursor-pointer ${
                            sdgFocusAreas.includes(sdg)
                              ? 'bg-[#ff9400] border-[#ff9400]'
                              : 'border-[#d1d5db] bg-white group-hover:border-[#ff9400]'
                          }`}
                        >
                          {sdgFocusAreas.includes(sdg) && (
                            <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
                              <path d="M2 6l3 3 5-5" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                          )}
                        </div>
                        <span
                          onClick={() => toggleSdg(sdg)}
                          className="text-sm text-[#4b5563] group-hover:text-[#18191c] transition-colors cursor-pointer leading-snug"
                        >
                          {sdg}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Bio */}
                <div className="flex flex-col gap-2">
                  <label className="text-[#18191c] text-sm font-medium">Bio</label>
                  <textarea
                    placeholder="Write down your bio here. Let others know who you are..."
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    rows={5}
                    className="w-full border border-[#e4e5e8] bg-white rounded-[18px] px-4 py-3 text-sm text-[#18191c] placeholder-[#9199a3] focus:outline-none focus:border-[#ff9400] focus:ring-1 focus:ring-[#ff9400] transition-colors resize-none"
                  />
                </div>
              </div>
            )}

            {/* Tab: More Info */}
            {tab === 'more' && (
              <div className="flex flex-col gap-5 sm:gap-6">

                <TagInput
                  label="Share your service offerings as keywords"
                  placeholder="Type a keyword and press comma or Enter"
                  hint="Enter a comma after each tag"
                  tags={services}
                  onAdd={(t) => setServices((prev) => [...prev, t])}
                  onRemove={(t) => setServices((prev) => prev.filter((x) => x !== t))}
                />

                <div className="flex flex-col gap-2">
                  <label className="text-[#18191c] text-sm">Mention your organization's industry expertise and years of experience in each</label>
                  <div className="flex flex-col gap-3">
                    {industries.map((item, idx) => (
                      <div key={idx} className="flex gap-3">
                        <input
                          type="text"
                          placeholder="Industry Name"
                          value={item.name}
                          onChange={(e) => updateIndustry(idx, 'name', e.target.value)}
                          className={inputCls}
                        />
                        <input
                          type="text"
                          placeholder="Years of experience"
                          value={item.years}
                          onChange={(e) => updateIndustry(idx, 'years', e.target.value)}
                          className={inputCls}
                        />
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() => setIndustries((prev) => [...prev, { name: '', years: '' }])}
                      className="w-full h-[44px] bg-[#ffeacc] rounded-full flex items-center justify-center gap-2 text-sm font-medium text-[#18191c] hover:bg-[#ffd99a] transition-colors"
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                        <circle cx="12" cy="12" r="10" stroke="#ff9400" strokeWidth="1.5"/>
                        <path d="M12 8v8M8 12h8" stroke="#ff9400" strokeWidth="1.5" strokeLinecap="round"/>
                      </svg>
                      Add More
                    </button>
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-[#18191c] text-sm">Website (Optional)</label>
                  <div className="relative">
                    <img src={linkIcon} alt="" className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 pointer-events-none" />
                    <input
                      type="url"
                      placeholder="https://yourwebsite.com"
                      value={website}
                      onChange={(e) => setWebsite(e.target.value)}
                      className={`${inputCls} pl-11`}
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-[#18191c] text-sm">Social Link</label>
                  <div className="flex flex-col gap-3">
                    {socialLinks.map((link, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <div className="flex-1 h-[50px] border border-[#e4e5e8] bg-white rounded-full flex items-center px-4 gap-2 sm:gap-3 overflow-hidden">
                          <select
                            value={link.platform}
                            onChange={(e) => updateSocialLink(idx, 'platform', e.target.value)}
                            className="text-sm font-medium text-[#18191c] bg-transparent focus:outline-none w-28 sm:w-36 shrink-0"
                          >
                            {SOCIAL_PLATFORMS.map((p) => <option key={p} value={p}>{p}</option>)}
                          </select>
                          <div className="w-px h-6 bg-[#e4e5e8] shrink-0" />
                          <input
                            type="url"
                            placeholder="Profile link/url..."
                            value={link.url}
                            onChange={(e) => updateSocialLink(idx, 'url', e.target.value)}
                            className="flex-1 min-w-0 text-sm text-[#18191c] placeholder-[#9199a3] bg-transparent focus:outline-none"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => removeSocialLink(idx)}
                          className="w-10 h-10 bg-[#f1f2f4] rounded-full flex items-center justify-center shrink-0 hover:bg-[#e4e5e8] transition-colors"
                          aria-label="Remove link"
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                            <circle cx="12" cy="12" r="10" stroke="#9199a3" strokeWidth="1.5"/>
                            <path d="M15 9l-6 6M9 9l6 6" stroke="#9199a3" strokeWidth="1.5" strokeLinecap="round"/>
                          </svg>
                        </button>
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() => setSocialLinks((prev) => [...prev, { platform: 'LinkedIn', url: '' }])}
                      className="w-full h-[44px] bg-[#ffeacc] rounded-full flex items-center justify-center gap-2 text-sm font-medium text-[#18191c] hover:bg-[#ffd99a] transition-colors"
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                        <circle cx="12" cy="12" r="10" stroke="#ff9400" strokeWidth="1.5"/>
                        <path d="M12 8v8M8 12h8" stroke="#ff9400" strokeWidth="1.5" strokeLinecap="round"/>
                      </svg>
                      Add New Social Link
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Tab: Contact */}
            {tab === 'contact' && (
              <div className="flex flex-col gap-5 sm:gap-6">

                <TagInput
                  label="Reach out to us for:"
                  placeholder="Type a keyword and press comma or Enter"
                  hint="Enter a comma after each tag"
                  tags={reachFor}
                  onAdd={(t) => setReachFor((prev) => [...prev, t])}
                  onRemove={(t) => setReachFor((prev) => prev.filter((x) => x !== t))}
                />

                <div className="flex flex-col gap-2">
                  <label className="text-[#18191c] text-sm">Location</label>
                  <input
                    type="text"
                    placeholder="Enter your location"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className={inputCls}
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-[#18191c] text-sm">Phone</label>
                  <input
                    type="tel"
                    placeholder="Phone number.."
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className={inputCls}
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-[#18191c] text-sm">Email</label>
                  <div className="relative">
                    <img src={envelopeIcon} alt="" className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 pointer-events-none" />
                    <input
                      type="email"
                      placeholder="Email address"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className={`${inputCls} pl-11`}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Action buttons */}
            <div className="border-t border-[#f2f2f3] mt-6 sm:mt-8 pt-4 flex items-center justify-between">
              <button
                type="button"
                onClick={() => navigate('/home')}
                className="border border-[#ff9400] text-[#ff9400] text-sm font-medium rounded-full px-5 py-2 hover:bg-[#fff6ed] transition-colors"
              >
                Skip Now
              </button>
              <div className="flex flex-col items-end gap-1">
                {saveError && <p className="text-red-500 text-xs">{saveError}</p>}
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={saving}
                  className="bg-[#ff9400] text-white text-sm font-medium rounded-full px-6 py-2 hover:bg-[#e68500] transition-colors shadow-[0px_4px_12px_rgba(255,148,0,0.3)] disabled:opacity-60"
                >
                  {saving ? 'Saving…' : 'Save & Next'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
