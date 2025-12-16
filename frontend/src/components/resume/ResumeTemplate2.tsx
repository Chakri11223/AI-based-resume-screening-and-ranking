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

interface ResumeTemplate2Props {
  data: ResumeData;
}

export const ResumeTemplate2 = ({ data }: ResumeTemplate2Props) => {
  const formatDate = (date: string) => {
    if (!date) return "";
    const d = new Date(date);
    return d.toLocaleDateString("en-US", { month: "short", year: "numeric" });
  };

  return (
    <div className="p-8 text-gray-900" style={{ fontFamily: "'Calibri', 'Segoe UI', Arial, sans-serif" }}>
      {/* Two-Column Professional Layout */}
      <div className="flex gap-8">
        {/* Left Sidebar - Contact & Skills */}
        <div className="w-48 border-r-2 border-gray-300 pr-6">
          {/* Header in Sidebar */}
          <div className="mb-6">
            <h1 className="text-2xl font-bold mb-4 border-b-2 border-gray-800 pb-2">{data.personalInfo.fullName || "Your Name"}</h1>
            <div className="space-y-2 text-xs">
              {data.personalInfo.email && <div className="border-b border-gray-200 pb-1">{data.personalInfo.email}</div>}
              {data.personalInfo.phone && <div className="border-b border-gray-200 pb-1">{data.personalInfo.phone}</div>}
              {data.personalInfo.address && <div className="border-b border-gray-200 pb-1">{data.personalInfo.address}</div>}
              {data.personalInfo.linkedin && <div className="border-b border-gray-200 pb-1">{data.personalInfo.linkedin}</div>}
              {data.personalInfo.website && <div className="border-b border-gray-200 pb-1">{data.personalInfo.website}</div>}
            </div>
          </div>

          {/* Skills in Sidebar */}
          {data.skills && data.skills.length > 0 && (
            <div className="mt-6">
              <h2 className="text-sm font-bold uppercase tracking-wide mb-3 border-b border-gray-800 pb-1">Skills</h2>
              <div className="space-y-2">
                {data.skills.map((skill, idx) => (
                  <div key={idx} className="text-xs">
                    <div className="font-semibold mb-1">{skill.name || "Skill"}</div>
                    <div className="w-full bg-gray-200 rounded-full h-1.5">
                      <div
                        className={`h-1.5 rounded-full bg-gray-800 ${
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

          {/* Languages in Sidebar */}
          {data.languages && data.languages.length > 0 && (
            <div className="mt-6">
              <h2 className="text-sm font-bold uppercase tracking-wide mb-3 border-b border-gray-800 pb-1">Languages</h2>
              <div className="space-y-2">
                {data.languages.map((lang, idx) => (
                  <div key={idx} className="text-xs">
                    <div className="font-semibold">{lang.name || "Language"}</div>
                    <div className="text-gray-600 capitalize">{lang.proficiency || "Proficiency"}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Main Content */}
        <div className="flex-1">
          {/* Summary */}
          {data.summary && (
            <div className="mb-6 pb-4 border-b-2 border-gray-300">
              <h2 className="text-sm font-bold uppercase tracking-wide mb-2">Professional Summary</h2>
              <p className="text-sm leading-relaxed">{data.summary}</p>
            </div>
          )}

          {/* Experience */}
          {data.experiences.length > 0 && (
            <div className="mb-6">
              <h2 className="text-sm font-bold uppercase tracking-wide mb-4 border-b-2 border-gray-800 pb-1">Professional Experience</h2>
              {data.experiences.map((exp, idx) => (
                <div key={idx} className="mb-5 pb-4 border-b border-gray-200 last:border-0">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="font-bold text-base">{exp.position || "Position"}</h3>
                      <p className="text-sm text-gray-700 font-semibold">{exp.company || "Company"}</p>
                    </div>
                    <p className="text-xs text-gray-600 font-medium">
                      {formatDate(exp.startDate)} - {exp.current ? "Present" : formatDate(exp.endDate)}
                    </p>
                  </div>
                  {exp.description && (
                    <p className="text-sm leading-relaxed mt-2 text-gray-700">{exp.description}</p>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Education */}
          {data.educations.length > 0 && (
            <div className="mb-6">
              <h2 className="text-sm font-bold uppercase tracking-wide mb-4 border-b-2 border-gray-800 pb-1">Education</h2>
              {data.educations.map((edu, idx) => (
                <div key={idx} className="mb-4 pb-3 border-b border-gray-200 last:border-0">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-bold text-base">{edu.degree || "Degree"}</h3>
                      <p className="text-sm text-gray-700">{edu.field && `${edu.field}, `}{edu.institution || "Institution"}</p>
                    </div>
                    <p className="text-xs text-gray-600">
                      {formatDate(edu.startDate)} - {formatDate(edu.endDate)}
                    </p>
                  </div>
                  {edu.gpa && <p className="text-sm mt-1 text-gray-600">GPA: {edu.gpa}</p>}
                </div>
              ))}
            </div>
          )}

          {/* Certifications */}
          {data.certifications && data.certifications.length > 0 && (
            <div className="mb-6">
              <h2 className="text-sm font-bold uppercase tracking-wide mb-4 border-b-2 border-gray-800 pb-1">Certifications</h2>
              {data.certifications.map((cert, idx) => (
                <div key={idx} className="mb-4 pb-3 border-b border-gray-200 last:border-0">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-bold text-base">{cert.name || "Certification"}</h3>
                      <p className="text-sm text-gray-700">{cert.issuer || "Issuing Organization"}</p>
                      {cert.credentialId && <p className="text-xs text-gray-600 mt-1">ID: {cert.credentialId}</p>}
                    </div>
                    <p className="text-xs text-gray-600">
                      {formatDate(cert.issueDate)}
                      {cert.expiryDate && ` - ${formatDate(cert.expiryDate)}`}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Achievements */}
          {data.achievements && data.achievements.length > 0 && (
            <div className="mb-6">
              <h2 className="text-sm font-bold uppercase tracking-wide mb-4 border-b-2 border-gray-800 pb-1">Achievements</h2>
              {data.achievements.map((ach, idx) => (
                <div key={idx} className="mb-4 pb-3 border-b border-gray-200 last:border-0">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="font-bold text-base">{ach.title || "Achievement"}</h3>
                      {ach.organization && <p className="text-sm text-gray-700 font-semibold">{ach.organization}</p>}
                    </div>
                    {ach.date && <p className="text-xs text-gray-600">{formatDate(ach.date)}</p>}
                  </div>
                  {ach.description && (
                    <p className="text-sm leading-relaxed text-gray-700 mt-1">{ach.description}</p>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Projects */}
          {data.projects && data.projects.length > 0 && (
            <div className="mb-6">
              <h2 className="text-sm font-bold uppercase tracking-wide mb-4 border-b-2 border-gray-800 pb-1">Projects</h2>
              {data.projects.map((proj, idx) => (
                <div key={idx} className="mb-5 pb-4 border-b border-gray-200 last:border-0">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="font-bold text-base">{proj.name || "Project"}</h3>
                      {proj.technologies && <p className="text-sm text-gray-600">{proj.technologies}</p>}
                    </div>
                    <p className="text-xs text-gray-600 font-medium">
                      {formatDate(proj.startDate)} - {proj.current ? "Present" : formatDate(proj.endDate)}
                    </p>
                  </div>
                  {proj.description && (
                    <p className="text-sm leading-relaxed text-gray-700 mt-2">{proj.description}</p>
                  )}
                  {proj.url && (
                    <a href={proj.url} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline mt-1 inline-block">
                      View Project →
                    </a>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* References */}
          {data.references && data.references.length > 0 && (
            <div>
              <h2 className="text-sm font-bold uppercase tracking-wide mb-4 border-b-2 border-gray-800 pb-1">References</h2>
              {data.references.map((ref, idx) => (
                <div key={idx} className="mb-4 pb-3 border-b border-gray-200 last:border-0">
                  <h3 className="font-bold text-base">{ref.name || "Reference Name"}</h3>
                  <p className="text-sm text-gray-700">{ref.position || "Position"}{ref.company && ` at ${ref.company}`}</p>
                  {ref.email && <p className="text-xs text-gray-600">{ref.email}</p>}
                  {ref.phone && <p className="text-xs text-gray-600">{ref.phone}</p>}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

