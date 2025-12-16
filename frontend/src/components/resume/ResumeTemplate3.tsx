interface ResumeData {
  personalInfo: {
    fullName: string;
    email: string;
    phone: string;
    address: string;
    linkedin: string;
    website: string;
  };
  summary: string;
  experiences: Array<{
    company: string;
    position: string;
    startDate: string;
    endDate: string;
    description: string;
    current: boolean;
  }>;
  educations: Array<{
    institution: string;
    degree: string;
    field: string;
    startDate: string;
    endDate: string;
    gpa: string;
  }>;
  skills: Array<{
    name: string;
    level: string;
  }>;
  certifications?: Array<{
    name: string;
    issuer: string;
    issueDate: string;
    expiryDate: string;
    credentialId: string;
    url: string;
  }>;
  achievements?: Array<{
    title: string;
    description: string;
    date: string;
    organization: string;
  }>;
  projects?: Array<{
    name: string;
    description: string;
    technologies: string;
    startDate: string;
    endDate: string;
    url: string;
    current: boolean;
  }>;
  languages?: Array<{
    name: string;
    proficiency: string;
  }>;
  references?: Array<{
    name: string;
    position: string;
    company: string;
    email: string;
    phone: string;
  }>;
}

interface ResumeTemplate3Props {
  data: ResumeData;
}

export const ResumeTemplate3 = ({ data }: ResumeTemplate3Props) => {
  const formatDate = (date: string) => {
    if (!date) return "";
    const d = new Date(date);
    return d.toLocaleDateString("en-US", { month: "short", year: "numeric" });
  };

  return (
    <div className="p-8 text-gray-900 bg-white" style={{ fontFamily: "'Garamond', 'Times New Roman', serif" }}>
      {/* Centered Header */}
      <div className="text-center mb-8 pb-6 border-b-2 border-gray-800">
        <h1 className="text-4xl font-bold mb-3 tracking-tight">{data.personalInfo.fullName || "Your Name"}</h1>
        <div className="flex flex-wrap justify-center gap-3 text-sm text-gray-700">
          {data.personalInfo.email && <span>{data.personalInfo.email}</span>}
          {data.personalInfo.phone && <span>• {data.personalInfo.phone}</span>}
          {data.personalInfo.address && <span>• {data.personalInfo.address}</span>}
        </div>
        <div className="flex flex-wrap justify-center gap-3 text-sm text-gray-700 mt-1">
          {data.personalInfo.linkedin && <span>{data.personalInfo.linkedin}</span>}
          {data.personalInfo.website && <span>• {data.personalInfo.website}</span>}
        </div>
      </div>

      {/* Summary */}
      {data.summary && (
        <div className="mb-8 pb-6 border-b border-gray-300">
          <h2 className="text-base font-bold uppercase tracking-wider mb-3">Professional Summary</h2>
          <p className="text-sm leading-relaxed text-gray-700">{data.summary}</p>
        </div>
      )}

      <div className="grid grid-cols-3 gap-8">
        <div className="col-span-2">
          {/* Experience - Timeline Style */}
          {data.experiences.length > 0 && (
            <div className="mb-8">
              <h2 className="text-base font-bold uppercase tracking-wider mb-6 border-b-2 border-gray-800 pb-2">Work Experience</h2>
              <div className="relative pl-6 border-l-2 border-gray-400">
                {data.experiences.map((exp, idx) => (
                  <div key={idx} className="mb-6 relative">
                    <div className="absolute -left-9 top-1 w-4 h-4 bg-gray-800 rounded-full border-2 border-white"></div>
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h3 className="font-bold text-base">{exp.position || "Position"}</h3>
                        <p className="text-sm text-gray-700 font-semibold">{exp.company || "Company"}</p>
                      </div>
                      <span className="text-xs text-gray-600 font-medium bg-gray-100 px-2 py-1 rounded">
                        {formatDate(exp.startDate)} - {exp.current ? "Present" : formatDate(exp.endDate)}
                      </span>
                    </div>
                    {exp.description && (
                      <p className="text-sm leading-relaxed text-gray-700 mt-2">{exp.description}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Education - Timeline Style */}
          {data.educations.length > 0 && (
            <div className="mb-8">
              <h2 className="text-base font-bold uppercase tracking-wider mb-6 border-b-2 border-gray-800 pb-2">Education</h2>
              <div className="relative pl-6 border-l-2 border-gray-400">
                {data.educations.map((edu, idx) => (
                  <div key={idx} className="mb-5 relative">
                    <div className="absolute -left-9 top-1 w-4 h-4 bg-gray-800 rounded-full border-2 border-white"></div>
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-bold text-base">{edu.degree || "Degree"}</h3>
                        <p className="text-sm text-gray-700">{edu.field && `${edu.field}, `}{edu.institution || "Institution"}</p>
                      </div>
                      <span className="text-xs text-gray-600 font-medium bg-gray-100 px-2 py-1 rounded">
                        {formatDate(edu.startDate)} - {formatDate(edu.endDate)}
                      </span>
                    </div>
                    {edu.gpa && <p className="text-sm mt-1 text-gray-600">GPA: {edu.gpa}</p>}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="col-span-1">
          {/* Skills */}
          {data.skills && data.skills.length > 0 && (
            <div className="border-l-2 border-gray-300 pl-6 mb-8">
              <h2 className="text-base font-bold uppercase tracking-wider mb-4 border-b-2 border-gray-800 pb-2">Skills</h2>
              <div className="space-y-3">
                {data.skills.map((skill, idx) => (
                  <div key={idx}>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm font-semibold">{skill.name || "Skill"}</span>
                      <span className="text-xs text-gray-500 capitalize">{skill.level}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full bg-gray-800 ${
                          skill.level === "expert" ? "w-full" :
                          skill.level === "advanced" ? "w-3/4" :
                          skill.level === "intermediate" ? "w-1/2" :
                          "w-1/4"
                        }`}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Languages */}
          {data.languages && data.languages.length > 0 && (
            <div className="border-l-2 border-gray-300 pl-6 mb-8">
              <h2 className="text-base font-bold uppercase tracking-wider mb-4 border-b-2 border-gray-800 pb-2">Languages</h2>
              <div className="space-y-2">
                {data.languages.map((lang, idx) => (
                  <div key={idx} className="text-sm">
                    <span className="font-semibold">{lang.name || "Language"}</span>
                    {lang.proficiency && <span className="text-gray-600 ml-2">- {lang.proficiency}</span>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Certifications */}
          {data.certifications && data.certifications.length > 0 && (
            <div className="border-l-2 border-gray-300 pl-6 mb-8">
              <h2 className="text-base font-bold uppercase tracking-wider mb-4 border-b-2 border-gray-800 pb-2">Certifications</h2>
              <div className="space-y-3">
                {data.certifications.map((cert, idx) => (
                  <div key={idx} className="text-sm">
                    <div className="font-semibold">{cert.name || "Certification"}</div>
                    <div className="text-xs text-gray-600">{cert.issuer || "Issuer"}</div>
                    <div className="text-xs text-gray-500 mt-1">
                      {formatDate(cert.issueDate)}
                      {cert.expiryDate && ` - ${formatDate(cert.expiryDate)}`}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Projects - Full Width */}
      {data.projects && data.projects.length > 0 && (
        <div className="mt-8 mb-8">
          <h2 className="text-base font-bold uppercase tracking-wider mb-6 border-b-2 border-gray-800 pb-2">Projects</h2>
          <div className="relative pl-6 border-l-2 border-gray-400">
            {data.projects.map((proj, idx) => (
              <div key={idx} className="mb-6 relative">
                <div className="absolute -left-9 top-1 w-4 h-4 bg-gray-800 rounded-full border-2 border-white"></div>
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="font-bold text-base">{proj.name || "Project"}</h3>
                    {proj.technologies && <p className="text-sm text-gray-600">{proj.technologies}</p>}
                  </div>
                  <span className="text-xs text-gray-600 font-medium bg-gray-100 px-2 py-1 rounded">
                    {formatDate(proj.startDate)} - {proj.current ? "Present" : formatDate(proj.endDate)}
                  </span>
                </div>
                {proj.description && (
                  <p className="text-sm leading-relaxed text-gray-700 mt-2">{proj.description}</p>
                )}
                {proj.url && (
                  <a href={proj.url} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline mt-1 inline-block">
                    View Project →
                  </a>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Achievements - Full Width */}
      {data.achievements && data.achievements.length > 0 && (
        <div className="mb-8">
          <h2 className="text-base font-bold uppercase tracking-wider mb-6 border-b-2 border-gray-800 pb-2">Achievements</h2>
          <div className="relative pl-6 border-l-2 border-gray-400">
            {data.achievements.map((ach, idx) => (
              <div key={idx} className="mb-5 relative">
                <div className="absolute -left-9 top-1 w-4 h-4 bg-gray-800 rounded-full border-2 border-white"></div>
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-bold text-base">{ach.title || "Achievement"}</h3>
                    {ach.organization && <p className="text-sm text-gray-700 font-semibold">{ach.organization}</p>}
                  </div>
                  {ach.date && (
                    <span className="text-xs text-gray-600 font-medium bg-gray-100 px-2 py-1 rounded">
                      {formatDate(ach.date)}
                    </span>
                  )}
                </div>
                {ach.description && (
                  <p className="text-sm leading-relaxed text-gray-700 mt-2">{ach.description}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* References - Full Width */}
      {data.references && data.references.length > 0 && (
        <div>
          <h2 className="text-base font-bold uppercase tracking-wider mb-6 border-b-2 border-gray-800 pb-2">References</h2>
          <div className="grid grid-cols-2 gap-4">
            {data.references.map((ref, idx) => (
              <div key={idx} className="text-sm">
                <h3 className="font-bold">{ref.name || "Reference Name"}</h3>
                <p className="text-gray-700">{ref.position || "Position"}{ref.company && ` at ${ref.company}`}</p>
                {ref.email && <p className="text-xs text-gray-600">{ref.email}</p>}
                {ref.phone && <p className="text-xs text-gray-600">{ref.phone}</p>}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

