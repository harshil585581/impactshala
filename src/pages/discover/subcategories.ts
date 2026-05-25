export type SubGroup = {
  group: string;
  options: string[];
  highlighted?: boolean;
};

export const DOMAIN_SUBGROUPS: Record<string, SubGroup[]> = {
  Education: [
    {
      group: "Experiential Learning Opportunity",
      options: [
        "Guest Lecture",
        "Workshop",
        "Project Based Learning",
        "Extracurricular Activities",
        "Co-Curricular Activities",
        "Student Exchange Programs",
        "Research and Innovation",
        "Others",
      ],
    },
    {
      group: "Student Wellbeing & Support",
      options: [
        "Student Sessions Support",
        "Financial Aid",
        "Special Education Programs",
        "Tutoring and Mentorship",
        "Others",
      ],
    },
    {
      group: "Support Educational Institutions with resources & infrastructure",
      options: [
        "Educational Resources & Digital Learning Devices",
        "Infrastructure Support",
        "Library and Learning Resources",
        "Physical Education Equipment",
        "Educational Technology Integration",
        "Others",
      ],
    },
    {
      group: "Teacher Support & Professional Development",
      options: [
        "Teacher Support",
        "Professional Development for Educators",
        "Assessment and Evaluation",
        "Curriculum Development",
        "Others",
      ],
    },
    {
      group: "Educational Field Trip Venues",
      options: [
        "Museums",
        "Science Centers",
        "Historical Sites",
        "National Parks",
        "Zoos and Aquariums",
        "Factories and Industrial Sites",
        "Botanical Gardens",
        "Art Galleries",
        "Environmental Education Centers",
        "Educational Movies",
        "Others",
      ],
      highlighted: true,
    },
    { group: "Others", options: [] },
  ],
  "Social Impact": [
    {
      group: "Community Development",
      options: [
        "Skill Building Programs",
        "Livelihood Support",
        "Women Empowerment",
        "Youth Leadership",
        "Others",
      ],
    },
    {
      group: "Health & Wellness",
      options: [
        "Health Camps",
        "Mental Health Awareness",
        "Nutrition Programs",
        "Sports & Fitness",
        "Others",
      ],
    },
    {
      group: "Environment & Sustainability",
      options: [
        "Tree Plantation Drives",
        "Waste Management",
        "Clean Energy Awareness",
        "Eco-Tourism",
        "Others",
      ],
    },
    { group: "Others", options: [] },
  ],
  "Job Ready Exposures": [
    {
      group: "Career Readiness",
      options: [
        "Internship",
        "Apprenticeship",
        "Job Shadowing",
        "Career Counseling",
        "Resume Building",
        "Mock Interviews",
        "Others",
      ],
    },
    {
      group: "Skill Development",
      options: [
        "Technical Skills Training",
        "Soft Skills Training",
        "Certification Programs",
        "Others",
      ],
    },
    { group: "Others", options: [] },
  ],
  "Startup & Grants": [
    {
      group: "Startup Support",
      options: [
        "Mentorship",
        "Incubation",
        "Funding Opportunities",
        "Pitch Events",
        "Networking",
        "Others",
      ],
    },
    {
      group: "Grants & Funding",
      options: [
        "Government Grants",
        "NGO Grants",
        "Corporate CSR Funding",
        "Research Grants",
        "Others",
      ],
    },
    { group: "Others", options: [] },
  ],
  "Talent & Sports": [
    {
      group: "Sports",
      options: [
        "Cricket",
        "Football",
        "Basketball",
        "Athletics",
        "Swimming",
        "Others",
      ],
    },
    {
      group: "Arts & Performing Arts",
      options: [
        "Music",
        "Dance",
        "Theatre",
        "Visual Arts",
        "Film & Media",
        "Others",
      ],
    },
    {
      group: "Competitions",
      options: [
        "Olympiad",
        "Debate",
        "Quiz",
        "Science Fair",
        "Hackathon",
        "Others",
      ],
    },
    { group: "Others", options: [] },
  ],
  "Meetups & Competitions": [
    {
      group: "Meetups",
      options: [
        "Networking Events",
        "Community Meetups",
        "Tech Talks",
        "Panel Discussions",
        "Others",
      ],
    },
    {
      group: "Competitions",
      options: [
        "Hackathon",
        "Case Study",
        "Business Plan",
        "Creative Writing",
        "Others",
      ],
    },
    { group: "Others", options: [] },
  ],
};

export const DOMAINS = Object.keys(DOMAIN_SUBGROUPS);

export const TARGET_AUDIENCE_OPTIONS = [
  "Students",
  "Teachers",
  "Parents",
  "Professionals",
  "General Public",
  "Open to All",
];

export const EDUCATIONAL_LEVELS = [
  "Pre-primary",
  "Primary (1-5)",
  "Middle School (6-8)",
  "High School (9-12)",
  "College/University",
  "Vocational",
  "Open to All",
];

export const EVENT_TYPES = [
  { value: "one_day", label: "One day event" },
  { value: "weekly", label: "Weekly Recurring event" },
  { value: "custom_multi_day", label: "Custom Multi-day event" },
] as const;
