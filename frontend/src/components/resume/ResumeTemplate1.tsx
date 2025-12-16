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

interface ResumeTemplate1Props {
  data: ResumeData;
}

export const ResumeTemplate1 = ({ data }: ResumeTemplate1Props) => {
  const formatDate = (date: string) => {
    if (!date) return "";
    const d = new Date(date);
    return d.toLocaleDateString("en-US", { month: "short", year: "numeric" });
  };

  return (
    <div className="p-8 text-gray-900" style={{ fontFamily: "'Times New Roman', Times, serif" }}>
      {/* Header */}
      <div className="text-center border-b-2 border-gray-800 pb-4 mb-6">
        <h1 className="text-4xl font-bold mb-2">{data.personalInfo.fullName || "Your Name"}</h1>
        <div className="flex justify-center gap-4 text-sm">
          {data.personalInfo.email && <span>{data.personalInfo.email}</span>}
          {data.personalInfo.phone && <span>• {data.personalInfo.phone}</span>}
          {data.personalInfo.address && <span>• {data.personalInfo.address}</span>}
        </div>
        <div className="flex justify-center gap-4 text-sm mt-2">
          {data.personalInfo.linkedin && <span>LinkedIn: {data.personalInfo.linkedin}</span>}
          {data.personalInfo.website && <span>• {data.personalInfo.website}</span>}
        </div>
      </div>

      {/* Summary */}
      {data.summary && (
        <div className="mb-6">
          <h2 className="text-xl font-bold uppercase border-b border-gray-400 pb-1 mb-3">Professional Summary</h2>
          <p className="text-sm leading-relaxed">{data.summary}</p>
        </div>
      )}

      {/* Experience */}
      {data.experiences.length > 0 && (
        <div className="mb-6">
          <h2 className="text-xl font-bold uppercase border-b border-gray-400 pb-1 mb-3">Professional Experience</h2>
          {data.experiences.map((exp, idx) => (
            <div key={idx} className="mb-4">
              <div className="flex justify-between items-start mb-1">
                <div>
                  <h3 className="font-bold text-lg">{exp.position || "Position"}</h3>
                  <p className="text-sm font-semibold">{exp.company || "Company"}</p>
                </div>
                <p className="text-sm">
                  {formatDate(exp.startDate)} - {exp.current ? "Present" : formatDate(exp.endDate)}
                </p>
              </div>
              {exp.description && (
                <p className="text-sm leading-relaxed mt-2">{exp.description}</p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Education */}
      {data.educations.length > 0 && (
        <div className="mb-6">
          <h2 className="text-xl font-bold uppercase border-b border-gray-400 pb-1 mb-3">Education</h2>
          {data.educations.map((edu, idx) => (
            <div key={idx} className="mb-3">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-bold">{edu.degree || "Degree"}</h3>
                  <p className="text-sm">{edu.field && `${edu.field}, `}{edu.institution || "Institution"}</p>
                </div>
                <p className="text-sm">
                  {formatDate(edu.startDate)} - {formatDate(edu.endDate)}
                </p>
              </div>
              {edu.gpa && <p className="text-sm mt-1">GPA: {edu.gpa}</p>}
            </div>
          ))}
        </div>
      )}

      {/* Skills */}
      {data.skills && data.skills.length > 0 && (
        <div className="mb-6">
          <h2 className="text-xl font-bold uppercase border-b border-gray-400 pb-1 mb-3">Skills</h2>
          <div className="flex flex-wrap gap-2">
            {data.skills.map((skill, idx) => (
              <span key={idx} className="text-sm bg-gray-100 px-3 py-1 rounded">
                {skill.name || "Skill"}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Certifications */}
      {data.certifications && data.certifications.length > 0 && (
        <div className="mb-6">
          <h2 className="text-xl font-bold uppercase border-b border-gray-400 pb-1 mb-3">Certifications</h2>
          {data.certifications.map((cert, idx) => (
            <div key={idx} className="mb-3">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-bold">{cert.name || "Certification"}</h3>
                  <p className="text-sm">{cert.issuer || "Issuing Organization"}</p>
                  {cert.credentialId && <p className="text-xs text-gray-600 mt-1">Credential ID: {cert.credentialId}</p>}
                </div>
                <p className="text-sm">
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
          <h2 className="text-xl font-bold uppercase border-b border-gray-400 pb-1 mb-3">Achievements & Awards</h2>
          {data.achievements.map((ach, idx) => (
            <div key={idx} className="mb-3">
              <div className="flex justify-between items-start mb-1">
                <div>
                  <h3 className="font-bold">{ach.title || "Achievement"}</h3>
                  {ach.organization && <p className="text-sm font-semibold">{ach.organization}</p>}
                </div>
                {ach.date && <p className="text-sm">{formatDate(ach.date)}</p>}
              </div>
              {ach.description && (
                <p className="text-sm leading-relaxed mt-1">{ach.description}</p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Projects */}
      {data.projects && data.projects.length > 0 && (
        <div className="mb-6">
          <h2 className="text-xl font-bold uppercase border-b border-gray-400 pb-1 mb-3">Projects</h2>
          {data.projects.map((proj, idx) => (
            <div key={idx} className="mb-4">
              <div className="flex justify-between items-start mb-1">
                <div>
                  <h3 className="font-bold text-lg">{proj.name || "Project"}</h3>
                  {proj.technologies && <p className="text-sm text-gray-600">{proj.technologies}</p>}
                </div>
                <p className="text-sm">
                  {formatDate(proj.startDate)} - {proj.current ? "Present" : formatDate(proj.endDate)}
                </p>
              </div>
              {proj.description && (
                <p className="text-sm leading-relaxed mt-2">{proj.description}</p>
              )}
              {proj.url && (
                <a href={proj.url} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline mt-1 inline-block">
                  View Project →
                </a>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Languages */}
      {data.languages && data.languages.length > 0 && (
        <div className="mb-6">
          <h2 className="text-xl font-bold uppercase border-b border-gray-400 pb-1 mb-3">Languages</h2>
          <div className="flex flex-wrap gap-3">
            {data.languages.map((lang, idx) => (
              <span key={idx} className="text-sm">
                <span className="font-semibold">{lang.name || "Language"}</span>
                {lang.proficiency && <span className="text-gray-600"> - {lang.proficiency}</span>}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* References */}
      {data.references && data.references.length > 0 && (
        <div>
          <h2 className="text-xl font-bold uppercase border-b border-gray-400 pb-1 mb-3">References</h2>
          {data.references.map((ref, idx) => (
            <div key={idx} className="mb-3">
              <h3 className="font-bold">{ref.name || "Reference Name"}</h3>
              <p className="text-sm">{ref.position || "Position"}{ref.company && ` at ${ref.company}`}</p>
              {ref.email && <p className="text-sm text-gray-600">{ref.email}</p>}
              {ref.phone && <p className="text-sm text-gray-600">{ref.phone}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

