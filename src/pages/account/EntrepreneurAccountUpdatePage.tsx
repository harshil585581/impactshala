import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../../components/Sidebar';
import TopBar from '../../components/TopBar';

// Tab icons from Figma
const userIcon       = "https://www.figma.com/api/mcp/asset/aeacde15-44b6-45d0-a0e0-273e0d60de81";
const userCircleIcon = "https://www.figma.com/api/mcp/asset/6c1ee040-0e10-4e32-91cd-3efdea837772";
const atIcon         = "https://www.figma.com/api/mcp/asset/bd19a781-f45c-4caf-bc9a-bb683b56f3c6";
const envelopeIcon   = "https://www.figma.com/api/mcp/asset/f721fa21-d26c-4c12-9c82-2861f364f58a";
const languageIcon   = "https://www.figma.com/api/mcp/asset/3ed2ca26-93a4-4801-99a0-45959d2e7c2c";
const linkIcon       = "https://www.figma.com/api/mcp/asset/c12f4e16-6f90-478a-8500-58c37f19cd2b";

type Tab = 'profile' | 'more' | 'contact' | 'complete';

const DESCRIBE_OPTIONS: Record<'established' | 'aspiring', string[]> = {
  established: ['Startup Mentor', 'Angel Investor', 'Others'],
  aspiring: ['Student', 'Working Professional', 'Out of Work'],
};

const SOCIAL_PLATFORMS = ['GitHub', 'Behance / Dribbble', 'Instagram', 'Twitter / X', 'Facebook', 'Medium / Substack', 'LinkedIn'];

const inputCls =
  'w-full h-[48px] border border-[#e4e5e8] bg-white rounded-full px-4 text-sm text-[#18191c] placeholder-[#9199a3] focus:outline-none focus:border-[#ff9400] focus:ring-1 focus:ring-[#ff9400] transition-colors';

// ── Upload drop-zone ──────────────────────────────────────────────────────────
function UploadArea({ hint, accept }: { hint: string; accept?: string }) {
  return (
    <label className="flex flex-col items-center gap-3 border border-dashed border-[#767676] bg-[#f3f5f7] rounded-lg p-4 cursor-pointer hover:bg-[#eef0f2] transition-colors w-full">
      <input type="file" accept={accept} className="sr-only" />
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

// ── Tag input ─────────────────────────────────────────────────────────────────
function TagInput({
  label, placeholder, hint, tags, onAdd, onRemove,
}: {
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

// ── Main page ─────────────────────────────────────────────────────────────────
export default function EntrepreneurAccountUpdatePage() {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [tab, setTab] = useState<Tab>('profile');

  // Profile Info
  const [entrepreneurType, setEntrepreneurType] = useState<'established' | 'aspiring'>('established');
  const [describeAs, setDescribeAs] = useState('');
  const [showDescribeDrop, setShowDescribeDrop] = useState(false);
  const [bio, setBio] = useState('');

  // More Info
  const [skills, setSkills] = useState<string[]>([]);
  const [website, setWebsite] = useState('');
  const [socialLinks, setSocialLinks] = useState([{ platform: 'GitHub', url: '' }]);
  const [openSocialDropdown, setOpenSocialDropdown] = useState<number | null>(null);

  // Contact
  const [reachFor, setReachFor] = useState<string[]>([]);
  const [location, setLocation] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [languages, setLanguages] = useState('');

  const progressMap: Record<Tab, number> = {
    profile: 25, more: 50, contact: 75, complete: 100,
  };

  const TABS: { id: Tab; label: string; icon: string }[] = [
    { id: 'profile',  label: 'Profile Info', icon: userIcon },
    { id: 'more',     label: 'More Info',    icon: userCircleIcon },
    { id: 'contact',  label: 'Contact',      icon: atIcon },
  ];

  function handleSave() {
    if (tab === 'profile') setTab('more');
    else if (tab === 'more') setTab('contact');
    else setTab('complete');
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

        {/* ── Completion screen ── */}
        {tab === 'complete' && (
          <div className="flex items-center justify-center min-h-[calc(100vh-78px)] px-4">
            <div className="flex flex-col items-center gap-8 text-center max-w-md w-full">
              <div className="bg-[#ffeacc] p-10 rounded-full">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" className="text-[#ff9400]">
                  <polyline points="20 6 9 17 4 12" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                  <polyline points="20 12 9 23 4 18" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
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

        {/* ── Form ── */}
        {tab !== 'complete' && (
          <div className="max-w-[960px] mx-auto px-4 sm:px-6 py-6 sm:py-8">

            {/* Progress */}
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

            {/* ── Tab: Profile Info ── */}
            {tab === 'profile' && (
              <div className="flex flex-col gap-5 sm:gap-6">

                {/* Photo uploads */}
                <div className="flex flex-col sm:flex-row gap-5 sm:gap-6">
                  <div className="flex flex-col gap-2 w-full sm:w-[260px] shrink-0">
                    <p className="text-[#18191c] text-sm">Profile Photo</p>
                    <UploadArea
                      hint="A photo larger than 400 pixels work best. Max photo size 5 MB."
                      accept="image/*"
                    />
                  </div>
                  <div className="flex flex-col gap-2 flex-1">
                    <p className="text-[#18191c] text-sm">Cover Photo</p>
                    <UploadArea
                      hint="Banner images optimal dimension 1520 × 400. Supported: jpeg, png, max 5 MB."
                      accept="image/*"
                    />
                  </div>
                </div>

                {/* Identify yourself further */}
                <div className="flex flex-col gap-2">
                  <label className="text-[#18191c] text-sm">Identify yourself further</label>
                  <div className="flex items-center gap-3 flex-wrap">
                    <button
                      type="button"
                      onClick={() => { setEntrepreneurType('established'); setDescribeAs(''); }}
                      className={`h-[48px] rounded-full px-6 text-sm font-medium transition-colors bg-white ${
                        entrepreneurType === 'established'
                          ? 'border border-[#ff9400] text-[#f77f00]'
                          : 'border border-[#9f9f9f] text-[#9f9f9f]'
                      }`}
                    >
                      Established Entrepreneur
                    </button>
                    <button
                      type="button"
                      onClick={() => { setEntrepreneurType('aspiring'); setDescribeAs(''); }}
                      className={`h-[48px] rounded-full px-6 text-sm font-medium transition-colors bg-white ${
                        entrepreneurType === 'aspiring'
                          ? 'border border-[#ff9400] text-[#f77f00]'
                          : 'border border-[#9f9f9f] text-[#9f9f9f]'
                      }`}
                    >
                      Aspiring Entrepreneur
                    </button>
                  </div>
                </div>

                {/* Select what best describes you */}
                <div className="flex flex-col gap-2">
                  <label className="text-[#18191c] text-sm">Select what best describes you</label>
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setShowDescribeDrop((v) => !v)}
                      className="w-full h-[48px] border border-[#e4e5e8] bg-white rounded-full px-4 flex items-center justify-between text-sm focus:outline-none focus:border-[#ff9400] focus:ring-1 focus:ring-[#ff9400]"
                    >
                      <span className={describeAs ? 'text-[#18191c]' : 'text-[#9199a3]'}>
                        {describeAs || 'Select'}
                      </span>
                      <svg
                        width="16" height="16" viewBox="0 0 24 24" fill="none"
                        className={`transition-transform duration-200 ${showDescribeDrop ? 'rotate-180' : ''}`}
                      >
                        <path d="M6 9l6 6 6-6" stroke="#9199a3" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </button>
                    {showDescribeDrop && (
                      <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-[#e4e5e8] rounded-2xl shadow-lg z-10 overflow-hidden">
                        {DESCRIBE_OPTIONS[entrepreneurType].map((opt, idx) => (
                          <button
                            key={opt}
                            type="button"
                            onClick={() => { setDescribeAs(opt); setShowDescribeDrop(false); }}
                            className={`w-full text-left px-4 py-3 text-sm transition-colors ${
                              idx === 0
                                ? 'text-[#ff9400] border-l-2 border-[#ff9400]'
                                : 'text-[#18191c] hover:bg-[#fff6ed] hover:text-[#ff9400]'
                            }`}
                          >
                            {opt}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Bio */}
                <div className="flex flex-col gap-2">
                  <label className="text-[#18191c] text-sm">Bio</label>
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

            {/* ── Tab: More Info ── */}
            {tab === 'more' && (
              <div className="flex flex-col gap-5 sm:gap-6">

                <TagInput
                  label="Mention your Expertise & Skills in keywords"
                  placeholder="Type a skill and press comma or Enter"
                  hint="Enter a comma after each tag"
                  tags={skills}
                  onAdd={(t) => setSkills((prev) => [...prev, t])}
                  onRemove={(t) => setSkills((prev) => prev.filter((x) => x !== t))}
                />

                {/* Portfolio / Resume upload */}
                <div className="flex flex-col gap-2">
                  <label className="text-[#18191c] text-sm">Upload your Portfolio/Resume</label>
                  <label className="flex flex-col items-center gap-3 border-2 border-dashed border-[rgba(200,204,209,0.7)] bg-[rgba(241,242,244,0.4)] rounded-[6px] px-8 py-6 cursor-pointer hover:bg-[rgba(241,242,244,0.7)] transition-colors">
                    <input type="file" accept=".pdf" className="sr-only" />
                    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" className="text-[#7c8493]">
                      <polyline points="16 16 12 12 8 16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      <line x1="12" y1="12" x2="12" y2="21" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                      <path d="M20.39 18.39A5 5 0 0018 9h-1.26A8 8 0 103 16.3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    <div className="text-center">
                      <p className="text-sm text-[#18191c]"><span className="font-medium">Browse File</span> or drop here</p>
                      <p className="text-xs text-[#5e6670] mt-1">*Supported Format Pdf, Max file size 12 MB.</p>
                    </div>
                  </label>
                </div>

                {/* Website */}
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

                {/* Social links */}
                <div className="flex flex-col gap-2">
                  <label className="text-[#18191c] text-sm">Social Link</label>
                  <div className="flex flex-col gap-3">
                    {socialLinks.map((link, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <div className="flex-1 relative">
                          {/* Platform selector button */}
                          <div className="flex items-center gap-2">
                            <div className="relative">
                              <button
                                type="button"
                                onClick={() => setOpenSocialDropdown(openSocialDropdown === idx ? null : idx)}
                                className="h-[48px] border border-[#e4e5e8] bg-white rounded-full px-4 flex items-center gap-2 text-sm font-medium text-[#18191c] focus:outline-none focus:border-[#ff9400] min-w-[160px] justify-between"
                              >
                                <span>{link.platform}</span>
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className={`transition-transform duration-200 ${openSocialDropdown === idx ? 'rotate-180' : ''}`}>
                                  <path d="M6 9l6 6 6-6" stroke="#9199a3" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                </svg>
                              </button>
                              {openSocialDropdown === idx && (
                                <div className="absolute top-full left-0 mt-1 bg-white border border-[#e4e5e8] rounded-2xl shadow-lg z-20 overflow-hidden min-w-[180px]">
                                  {SOCIAL_PLATFORMS.map((p, pIdx) => (
                                    <button
                                      key={p}
                                      type="button"
                                      onClick={() => { updateSocialLink(idx, 'platform', p); setOpenSocialDropdown(null); }}
                                      className={`w-full text-left px-4 py-3 text-sm transition-colors ${
                                        pIdx === SOCIAL_PLATFORMS.length - 1
                                          ? 'text-[#ff9400] border-l-2 border-[#ff9400]'
                                          : 'text-[#18191c] hover:bg-[#fff6ed] hover:text-[#ff9400]'
                                      }`}
                                    >
                                      {p}
                                    </button>
                                  ))}
                                </div>
                              )}
                            </div>
                            <input
                              type="url"
                              placeholder="Profile link/url..."
                              value={link.url}
                              onChange={(e) => updateSocialLink(idx, 'url', e.target.value)}
                              className="flex-1 h-[48px] border border-[#e4e5e8] bg-white rounded-full px-4 text-sm text-[#18191c] placeholder-[#9199a3] focus:outline-none focus:border-[#ff9400] focus:ring-1 focus:ring-[#ff9400] transition-colors"
                            />
                          </div>
                        </div>
                        {socialLinks.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeSocialLink(idx)}
                            className="w-10 h-10 bg-[#f1f2f4] rounded-full flex items-center justify-center shrink-0 hover:bg-[#e4e5e8] transition-colors"
                            aria-label="Remove link"
                          >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                              <path d="M18 6L6 18M6 6l12 12" stroke="#7c8493" strokeWidth="2" strokeLinecap="round"/>
                            </svg>
                          </button>
                        )}
                      </div>
                    ))}

                    {/* Add new */}
                    <button
                      type="button"
                      onClick={() => setSocialLinks((prev) => [...prev, { platform: 'GitHub', url: '' }])}
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

            {/* ── Tab: Contact ── */}
            {tab === 'contact' && (
              <div className="flex flex-col gap-5 sm:gap-6">

                <TagInput
                  label="Reach out to me for:"
                  placeholder="Type a keyword and press comma or Enter"
                  hint="Enter a comma after each tag"
                  tags={reachFor}
                  onAdd={(t) => setReachFor((prev) => [...prev, t])}
                  onRemove={(t) => setReachFor((prev) => prev.filter((x) => x !== t))}
                />

                {/* Location */}
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

                {/* Phone */}
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

                {/* Email */}
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

                {/* Languages */}
                <div className="flex flex-col gap-2">
                  <label className="text-[#18191c] text-sm">Languages</label>
                  <div className="relative">
                    <img src={languageIcon} alt="" className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 pointer-events-none" />
                    <input
                      type="text"
                      placeholder="Languages you speak"
                      value={languages}
                      onChange={(e) => setLanguages(e.target.value)}
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
              <button
                type="button"
                onClick={handleSave}
                className="bg-[#ff9400] text-white text-sm font-medium rounded-full px-6 py-2 hover:bg-[#e68500] transition-colors shadow-[0px_4px_12px_rgba(255,148,0,0.3)]"
              >
                Save
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
