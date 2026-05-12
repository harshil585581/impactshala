interface Props {
  skills: string[];
  isOwnProfile: boolean;
}

export default function ProfileSkills({ skills, isOwnProfile }: Props) {
  return (
    <div className="bg-white rounded-[14px] border border-[#f2f2f3] shadow-[0px_2px_8px_rgba(0,0,0,0.06)] px-5 sm:px-6 py-5">
      <h3 className="text-[#18191c] text-base font-semibold border-b border-[#f2f2f3] pb-2 mb-4">
        Skills &amp; Expertise
      </h3>
      {skills.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {skills.map((skill) => (
            <span
              key={skill}
              className="bg-[#f3f5f7] text-[#18191c] text-sm font-medium px-3 py-1.5 rounded-full border border-[#e4e5e8] hover:border-[#f77f00] hover:text-[#f77f00] transition-colors"
            >
              {skill}
            </span>
          ))}
        </div>
      ) : (
        <p className="text-[#9199a3] text-sm italic">
          {isOwnProfile
            ? "Add your skills to help others discover you."
            : "No skills listed yet."}
        </p>
      )}
    </div>
  );
}
