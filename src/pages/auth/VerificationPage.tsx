import { useNavigate } from 'react-router-dom';

const primaryLogo = "https://www.figma.com/api/mcp/asset/8a750235-40b0-42cf-b263-a81e8356a5bb";
const emailIllustration = "https://www.figma.com/api/mcp/asset/c6880028-f78c-41b8-b8bb-c0cbf3b1f908";

export default function VerificationPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-white flex flex-col">

      {/* Header */}
      <div className="flex justify-center px-5 pt-8 sm:pt-10 pb-4 shrink-0">
        <img src={primaryLogo} alt="Impactshaala" className="h-9 sm:h-10 w-auto object-contain" />
      </div>

      {/* Centered content */}
      <div className="flex-1 flex items-center justify-center px-5 sm:px-8 py-8 sm:py-12">
        <div className="flex flex-col items-center gap-6 sm:gap-8 text-center w-full max-w-[420px]">

          {/* Illustration */}
          <div className="bg-[#fff8f0] rounded-full p-6 sm:p-8">
            <img
              src={emailIllustration}
              alt="Email sent"
              className="w-24 h-auto sm:w-[120px]"
            />
          </div>

          {/* Text */}
          <div className="flex flex-col gap-2 sm:gap-3">
            <h2 className="text-[#0f172a] text-xl sm:text-2xl font-semibold tracking-[0.2px] leading-snug">
              Verification Email Sent
            </h2>
            <p className="text-[#64748b] text-sm leading-relaxed px-2">
              A verification email has been sent to your registered email address. Please verify to complete your registration.
            </p>
          </div>

          {/* Skip Now */}
          <button
            onClick={() => navigate('/home')}
            className="w-full h-[50px] sm:h-[56px] bg-[#ff9400] text-white text-sm sm:text-base font-bold rounded-full hover:bg-[#e68500] transition-colors tracking-[0.2px] shadow-[0px_4px_16px_rgba(255,148,0,0.35)]"
          >
            Skip Now
          </button>

          {/* Resend */}
          <p className="text-sm -mt-2">
            <span className="text-[#0f172a]">Don't receive an email?</span>{' '}
            <button className="text-[#ff9400] font-bold hover:underline transition-colors">
              Resend
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
