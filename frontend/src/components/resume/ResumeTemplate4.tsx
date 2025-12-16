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

interface ResumeTemplate4Props {
  data: ResumeData;
}

export const ResumeTemplate4 = ({ data }: ResumeTemplate4Props) => {
  const formatDate = (date: string) => {
    if (!date) return "";
    const d = new Date(date);
    return d.toLocaleDateString("en-US", { month: "short", year: "numeric" });
  };

  return (
    <div className="p-8 text-gray-900 bg-white" style={{ fontFamily: "'Cambria', 'Georgia', serif" }}>
      {/* Compact Header */}
      <div className="mb-6 pb-4 border-b border-gray-400">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold mb-2">{data.personalInfo.fullName || "Your Name"}</h1>
            <div className="text-xs text-gray-600 space-y-0.5">
              {data.personalInfo.email && <div>{data.personalInfo.email}</div>}
              {data.personalInfo.phone && <div>{data.personalInfo.phone}</div>}
              {data.personalInfo.address && <div>{data.personalInfo.address}</div>}
            </div>
          </div>
          <div className="text-right text-xs text-gray-600 space-y-0.5">
            {data.personalInfo.linkedin && <div>{data.personalInfo.linkedin}</div>}
            {data.personalInfo.website && <div>{data.personalInfo.website}</div>}
          </div>
        </div>
      </div>

      {/* Summary */}
      {data.summary && (
        <div className="mb-6 pb-4 border-b border-gray-300">
          <h2 className="text-xs font-bold uppercase tracking-widest mb-2">Summary</h2>
          <p className="text-xs leading-relaxed text-gray-700">{data.summary}</p>
        </div>
      )}

      <div className="grid grid-cols-5 gap-6">
        <div className="col-span-3">
          {/* Experience - Compact Format */}
          {data.experiences.length > 0 && (
            <div className="mb-6">
              <h2 className="text-xs font-bold uppercase tracking-widest mb-3 border-b border-gray-800 pb-1">Experience</h2>
              {data.experiences.map((exp, idx) => (
                <div key={idx} className="mb-4">
                  <div className="flex justify-between items-baseline mb-1">
                    <div>
                      <span className="font-bold text-sm">{exp.position || "Position"}</span>
                      <span className="text-xs text-gray-600"> • {exp.company || "Company"}</span>
                    </div>
                    <span className="text-xs text-gray-500">
                      {formatDate(exp.startDate)} - {exp.current ? "Present" : formatDate(exp.endDate)}
                    </span>
                  </div>
                  {exp.description && (
                    <p className="text-xs leading-relaxed text-gray-700 mt-1 pl-2 border-l-2 border-gray-300">{exp.description}</p>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Education - Compact Format */}
          {data.educations.length > 0 && (
            <div className="mb-6">
              <h2 className="text-xs font-bold uppercase tracking-widest mb-3 border-b border-gray-800 pb-1">Education</h2>
              {data.educations.map((edu, idx) => (
                <div key={idx} className="mb-3">
                  <div className="flex justify-between items-baseline">
                    <div>
                      <span className="font-bold text-sm">{edu.degree || "Degree"}</span>
                      <span className="text-xs text-gray-600"> • {edu.field && `${edu.field}, `}{edu.institution || "Institution"}</span>
                    </div>
                    <span className="text-xs text-gray-500">
                      {formatDate(edu.startDate)} - {formatDate(edu.endDate)}
                    </span>
                  </div>
                  {edu.gpa && <p className="text-xs mt-0.5 text-gray-600 pl-2">GPA: {edu.gpa}</p>}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="col-span-2 border-l border-gray-300 pl-6">
          {/* Skills - Compact List */}
          {data.skills && data.skills.length > 0 && (
            <div className="mb-6">
              <h2 className="text-xs font-bold uppercase tracking-widest mb-3 border-b border-gray-800 pb-1">Skills</h2>
              <div className="space-y-2">
                {data.skills.map((skill, idx) => (
                  <div key={idx} className="text-xs">
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-medium">{skill.name || "Skill"}</span>
                      <span className="text-gray-500 text-xs capitalize">{skill.level}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-1">
                      <div
                        className={`h-1 rounded-full bg-gray-800 ${
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
            <div className="mb-6">
              <h2 className="text-xs font-bold uppercase tracking-widest mb-3 border-b border-gray-800 pb-1">Languages</h2>
              <div className="space-y-1.5">
                {data.languages.map((lang, idx) => (
                  <div key={idx} className="text-xs">
                    <span className="font-medium">{lang.name || "Language"}</span>
                    {lang.proficiency && <span className="text-gray-500 ml-1">- {lang.proficiency}</span>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Certifications */}
          {data.certifications && data.certifications.length > 0 && (
            <div className="mb-6">
              <h2 className="text-xs font-bold uppercase tracking-widest mb-3 border-b border-gray-800 pb-1">Certifications</h2>
              <div className="space-y-2">
                {data.certifications.map((cert, idx) => (
                  <div key={idx} className="text-xs">
                    <div className="font-medium">{cert.name || "Certification"}</div>
                    <div className="text-gray-600">{cert.issuer || "Issuer"}</div>
                    <div className="text-gray-500">
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

      {/* Projects - Full Width Below */}
      {data.projects && data.projects.length > 0 && (
        <div className="mt-6 mb-6">
          <h2 className="text-xs font-bold uppercase tracking-widest mb-3 border-b border-gray-800 pb-1">Projects</h2>
          {data.projects.map((proj, idx) => (
            <div key={idx} className="mb-4">
              <div className="flex justify-between items-baseline mb-1">
                <div>
                  <span className="font-bold text-sm">{proj.name || "Project"}</span>
                  {proj.technologies && <span className="text-xs text-gray-600"> • {proj.technologies}</span>}
                </div>
                <span className="text-xs text-gray-500">
                  {formatDate(proj.startDate)} - {proj.current ? "Present" : formatDate(proj.endDate)}
                </span>
              </div>
              {proj.description && (
                <p className="text-xs leading-relaxed text-gray-700 mt-1 pl-2 border-l-2 border-gray-300">{proj.description}</p>
              )}
              {proj.url && (
                <a href={proj.url} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline mt-1 inline-block">
                  View →
                </a>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Achievements - Full Width */}
      {data.achievements && data.achievements.length > 0 && (
        <div className="mb-6">
          <h2 className="text-xs font-bold uppercase tracking-widest mb-3 border-b border-gray-800 pb-1">Achievements</h2>
          {data.achievements.map((ach, idx) => (
            <div key={idx} className="mb-3">
              <div className="flex justify-between items-baseline mb-1">
                <div>
                  <span className="font-bold text-sm">{ach.title || "Achievement"}</span>
                  {ach.organization && <span className="text-xs text-gray-600"> • {ach.organization}</span>}
                </div>
                {ach.date && <span className="text-xs text-gray-500">{formatDate(ach.date)}</span>}
              </div>
              {ach.description && (
                <p className="text-xs leading-relaxed text-gray-700 mt-1 pl-2 border-l-2 border-gray-300">{ach.description}</p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* References - Full Width */}
      {data.references && data.references.length > 0 && (
        <div>
          <h2 className="text-xs font-bold uppercase tracking-widest mb-3 border-b border-gray-800 pb-1">References</h2>
          <div className="grid grid-cols-2 gap-4">
            {data.references.map((ref, idx) => (
              <div key={idx} className="text-xs">
                <div className="font-medium">{ref.name || "Reference Name"}</div>
                <div className="text-gray-600">{ref.position || "Position"}{ref.company && ` at ${ref.company}`}</div>
                {ref.email && <div className="text-gray-500">{ref.email}</div>}
                {ref.phone && <div className="text-gray-500">{ref.phone}</div>}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

