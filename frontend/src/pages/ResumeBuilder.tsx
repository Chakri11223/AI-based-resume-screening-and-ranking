import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Download, Plus, Trash2, FileText, Sparkles, Eye, ZoomIn, ZoomOut, Maximize } from "lucide-react";
import { ResumeTemplate1 } from "@/components/resume/ResumeTemplate1";
import { ResumeTemplate2 } from "@/components/resume/ResumeTemplate2";
import { ResumeTemplate3 } from "@/components/resume/ResumeTemplate3";
import { ResumeTemplate4 } from "@/components/resume/ResumeTemplate4";

interface PersonalInfo {
  fullName: string;
  email: string;
  phone: string;
  address: string;
  linkedin: string;
  website: string;
}

interface Experience {
  id: string;
  company: string;
  position: string;
  startDate: string;
  endDate: string;
  description: string;
  current: boolean;
}

interface Education {
  id: string;
  institution: string;
  degree: string;
  field: string;
  startDate: string;
  endDate: string;
  gpa: string;
}

interface Skill {
  id: string;
  name: string;
  level: string;
}

interface Certification {
  id: string;
  name: string;
  issuer: string;
  issueDate: string;
  expiryDate: string;
  credentialId: string;
  url: string;
}

interface Achievement {
  id: string;
  title: string;
  description: string;
  date: string;
  organization: string;
}

interface Project {
  id: string;
  name: string;
  description: string;
  technologies: string;
  startDate: string;
  endDate: string;
  url: string;
  current: boolean;
}

interface Language {
  id: string;
  name: string;
  proficiency: string;
}

interface Reference {
  id: string;
  name: string;
  position: string;
  company: string;
  email: string;
  phone: string;
}

// Sample data for template previews
const getSampleData = () => ({
  personalInfo: {
    fullName: "John Doe",
    email: "john.doe@example.com",
    phone: "+1 (555) 123-4567",
    address: "New York, NY, USA",
    linkedin: "linkedin.com/in/johndoe",
    website: "www.johndoe.com",
  },
  summary: "Experienced software engineer with 5+ years of expertise in full-stack development, cloud architecture, and team leadership. Passionate about building scalable applications and mentoring junior developers.",
  experiences: [
    {
      id: "1",
      company: "Tech Solutions Inc.",
      position: "Senior Software Engineer",
      startDate: "2020-01",
      endDate: "",
      description: "Led development of microservices architecture serving 1M+ users. Mentored team of 5 junior developers and improved system performance by 40%.",
      current: true,
    },
    {
      id: "2",
      company: "StartupXYZ",
      position: "Full Stack Developer",
      startDate: "2018-06",
      endDate: "2019-12",
      description: "Developed and maintained web applications using React, Node.js, and PostgreSQL. Implemented CI/CD pipelines reducing deployment time by 60%.",
      current: false,
    },
  ],
  educations: [
    {
      id: "1",
      institution: "State University",
      degree: "Bachelor of Science",
      field: "Computer Science",
      startDate: "2014-09",
      endDate: "2018-05",
      gpa: "3.8/4.0",
    },
  ],
  skills: [
    { id: "1", name: "JavaScript", level: "expert" },
    { id: "2", name: "React", level: "expert" },
    { id: "3", name: "Node.js", level: "advanced" },
    { id: "4", name: "Python", level: "advanced" },
    { id: "5", name: "AWS", level: "intermediate" },
  ],
  certifications: [
    {
      id: "1",
      name: "AWS Certified Solutions Architect",
      issuer: "Amazon Web Services",
      issueDate: "2021-03",
      expiryDate: "2024-03",
      credentialId: "AWS-12345",
      url: "https://aws.amazon.com/certification",
    },
    {
      id: "2",
      name: "Google Cloud Professional Developer",
      issuer: "Google Cloud",
      issueDate: "2020-08",
      expiryDate: "",
      credentialId: "GCP-67890",
      url: "https://cloud.google.com/certification",
    },
  ],
  achievements: [
    {
      id: "1",
      title: "Employee of the Year",
      description: "Recognized for outstanding performance and leadership in 2022",
      date: "2022-12",
      organization: "Tech Solutions Inc.",
    },
    {
      id: "2",
      title: "Best Innovation Award",
      description: "Won for developing a revolutionary microservices architecture",
      date: "2021-06",
      organization: "Tech Industry Awards",
    },
  ],
  projects: [
    {
      id: "1",
      name: "E-Commerce Platform",
      description: "Built a scalable e-commerce platform using React and Node.js, handling 10K+ daily transactions",
      technologies: "React, Node.js, MongoDB, AWS",
      startDate: "2020-01",
      endDate: "2020-12",
      url: "https://github.com/johndoe/ecommerce",
      current: false,
    },
  ],
  languages: [
    { id: "1", name: "English", proficiency: "Native" },
    { id: "2", name: "Spanish", proficiency: "Fluent" },
    { id: "3", name: "French", proficiency: "Intermediate" },
  ],
  references: [
    {
      id: "1",
      name: "Jane Smith",
      position: "Engineering Manager",
      company: "Tech Solutions Inc.",
      email: "jane.smith@techsolutions.com",
      phone: "+1 (555) 987-6543",
    },
  ],
});

const ResumeBuilder = () => {
  /* Resume states */
  const [activeTab, setActiveTab] = useState("personal");
  const [hasSelectedTemplate, setHasSelectedTemplate] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState("classic1");
  const [previewingTemplate, setPreviewingTemplate] = useState<string | null>(null);
  const [zoom, setZoom] = useState(0.65); // Default zoom level
  const [personalInfo, setPersonalInfo] = useState<PersonalInfo>({
    fullName: "",
    email: "",
    phone: "",
    address: "",
    linkedin: "",
    website: "",
  });
  const [summary, setSummary] = useState("");
  const [experiences, setExperiences] = useState<Experience[]>([]);
  const [educations, setEducations] = useState<Education[]>([]);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [certifications, setCertifications] = useState<Certification[]>([]);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [languages, setLanguages] = useState<Language[]>([]);
  const [references, setReferences] = useState<Reference[]>([]);

  // AI Analysis State
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<any>(null);

  // Resume Title State
  const [resumeTitle, setResumeTitle] = useState("My Resume");
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const { toast } = useToast();

  const addExperience = () => {
    setExperiences([
      ...experiences,
      {
        id: Date.now().toString(),
        company: "",
        position: "",
        startDate: "",
        endDate: "",
        description: "",
        current: false,
      },
    ]);
  };

  const removeExperience = (id: string) => {
    setExperiences(experiences.filter((exp) => exp.id !== id));
  };

  const updateExperience = (id: string, field: keyof Experience, value: any) => {
    setExperiences(
      experiences.map((exp) => (exp.id === id ? { ...exp, [field]: value } : exp))
    );
  };

  const addEducation = () => {
    setEducations([
      ...educations,
      {
        id: Date.now().toString(),
        institution: "",
        degree: "",
        field: "",
        startDate: "",
        endDate: "",
        gpa: "",
      },
    ]);
  };

  const removeEducation = (id: string) => {
    setEducations(educations.filter((edu) => edu.id !== id));
  };

  const updateEducation = (id: string, field: keyof Education, value: any) => {
    setEducations(
      educations.map((edu) => (edu.id === id ? { ...edu, [field]: value } : edu))
    );
  };

  const addSkill = () => {
    setSkills([
      ...skills,
      {
        id: Date.now().toString(),
        name: "",
        level: "intermediate",
      },
    ]);
  };

  const removeSkill = (id: string) => {
    setSkills(skills.filter((skill) => skill.id !== id));
  };

  const updateSkill = (id: string, field: keyof Skill, value: any) => {
    setSkills(skills.map((skill) => (skill.id === id ? { ...skill, [field]: value } : skill)));
  };

  // Certifications
  const addCertification = () => {
    setCertifications([
      ...certifications,
      {
        id: Date.now().toString(),
        name: "",
        issuer: "",
        issueDate: "",
        expiryDate: "",
        credentialId: "",
        url: "",
      },
    ]);
  };

  const removeCertification = (id: string) => {
    setCertifications(certifications.filter((cert) => cert.id !== id));
  };

  const updateCertification = (id: string, field: keyof Certification, value: any) => {
    setCertifications(certifications.map((cert) => (cert.id === id ? { ...cert, [field]: value } : cert)));
  };

  // Achievements
  const addAchievement = () => {
    setAchievements([
      ...achievements,
      {
        id: Date.now().toString(),
        title: "",
        description: "",
        date: "",
        organization: "",
      },
    ]);
  };

  const removeAchievement = (id: string) => {
    setAchievements(achievements.filter((ach) => ach.id !== id));
  };

  const updateAchievement = (id: string, field: keyof Achievement, value: any) => {
    setAchievements(achievements.map((ach) => (ach.id === id ? { ...ach, [field]: value } : ach)));
  };

  // Projects
  const addProject = () => {
    setProjects([
      ...projects,
      {
        id: Date.now().toString(),
        name: "",
        description: "",
        technologies: "",
        startDate: "",
        endDate: "",
        url: "",
        current: false,
      },
    ]);
  };

  const removeProject = (id: string) => {
    setProjects(projects.filter((proj) => proj.id !== id));
  };

  const updateProject = (id: string, field: keyof Project, value: any) => {
    setProjects(projects.map((proj) => (proj.id === id ? { ...proj, [field]: value } : proj)));
  };

  // Languages
  const addLanguage = () => {
    setLanguages([
      ...languages,
      {
        id: Date.now().toString(),
        name: "",
        proficiency: "intermediate",
      },
    ]);
  };

  const removeLanguage = (id: string) => {
    setLanguages(languages.filter((lang) => lang.id !== id));
  };

  const updateLanguage = (id: string, field: keyof Language, value: any) => {
    setLanguages(languages.map((lang) => (lang.id === id ? { ...lang, [field]: value } : lang)));
  };

  // References
  const addReference = () => {
    setReferences([
      ...references,
      {
        id: Date.now().toString(),
        name: "",
        position: "",
        company: "",
        email: "",
        phone: "",
      },
    ]);
  };

  const removeReference = (id: string) => {
    setReferences(references.filter((ref) => ref.id !== id));
  };

  const updateReference = (id: string, field: keyof Reference, value: any) => {
    setReferences(references.map((ref) => (ref.id === id ? { ...ref, [field]: value } : ref)));
  };

  const downloadPDF = async () => {
    try {
      const resumeElement = document.getElementById("resume-preview");
      if (!resumeElement) {
        toast({
          title: "Error",
          description: "Resume preview not found",
          variant: "destructive",
        });
        return;
      }

      // Dynamic import of html2pdf
      const html2pdf = (await import("html2pdf.js")).default;

      const opt = {
        margin: 0.5,
        filename: `${personalInfo.fullName || "resume"}-resume.pdf`,
        image: { type: "jpeg" as "jpeg", quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: "in", format: "letter", orientation: "portrait" as "portrait" },
      };

      await html2pdf().set(opt).from(resumeElement).save();

      toast({
        title: "Success",
        description: "Resume downloaded successfully!",
      });
    } catch (error) {
      console.error("PDF generation error:", error);
      // Fallback: open print dialog
      toast({
        title: "Info",
        description: "Opening print dialog. You can save as PDF from there.",
      });
      window.print();
    }
  };

  const handleAIReview = async () => {
    setIsAnalyzing(true);
    try {
      // Construct resume text
      const resumeText = `
      Name: ${personalInfo.fullName}
      Email: ${personalInfo.email}
      Phone: ${personalInfo.phone}
      Address: ${personalInfo.address}
      LinkedIn: ${personalInfo.linkedin}
      Website: ${personalInfo.website}
      
      Professional Summary:
      ${summary}
      
      Work Experience:
      ${experiences.map(exp => `
      - ${exp.position} at ${exp.company} (${exp.startDate} to ${exp.current ? 'Present' : exp.endDate})
        ${exp.description}
      `).join('\n')}
      
      Education:
      ${educations.map(edu => `
      - ${edu.degree} in ${edu.field} at ${edu.institution} (${edu.startDate} to ${edu.endDate})
        GPA: ${edu.gpa}
      `).join('\n')}
      
      Skills:
      ${skills.map(skill => `${skill.name} (${skill.level})`).join(', ')}
      
      Certifications:
      ${certifications.map(cert => `${cert.name} by ${cert.issuer} (${cert.issueDate})`).join('\n')}
      
      Achievements:
      ${achievements.map(ach => `${ach.title}: ${ach.description}`).join('\n')}

      Projects:
      ${projects.map(proj => `${proj.name}: ${proj.description} (Tech: ${proj.technologies})`).join('\n')}
      
      Languages:
      ${languages.map(lang => `${lang.name} (${lang.proficiency})`).join(', ')}
      `;

      const response = await fetch('/api/interview/analyze-resume', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          resumeText,
          // jobDescription is optional now
        }),
      });

      const data = await response.json();

      if (data.success && data.analysis) {
        setAnalysisResult(data.analysis);
        toast({
          title: "Analysis Complete",
          description: "Your resume has been successfully analyzed.",
        });
      } else {
        throw new Error(data.message || "Failed to analyze resume");
      }

    } catch (error) {
      console.error("AI Review error:", error);
      toast({
        title: "Error",
        description: "Failed to generate AI review. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const renderTemplate = (templateId: string, useSampleData: boolean = false) => {
    const resumeData = useSampleData
      ? getSampleData()
      : {
        personalInfo,
        summary,
        experiences,
        educations,
        skills,
        certifications,
        achievements,
        projects,
        languages,
        references,
      };

    switch (templateId) {
      case "classic1":
        return <ResumeTemplate1 data={resumeData} />;
      case "classic2":
        return <ResumeTemplate2 data={resumeData} />;
      case "modern1":
        return <ResumeTemplate3 data={resumeData} />;
      case "modern2":
        return <ResumeTemplate4 data={resumeData} />;
      default:
        return <ResumeTemplate1 data={resumeData} />;
    }
  };


  const handleSelectTemplate = (templateId: string) => {
    setSelectedTemplate(templateId);
    // Don't auto confirm - let user click confirm
  };

  const confirmSelection = () => {
    setHasSelectedTemplate(true);
    setActiveTab("personal");
  };

  const renderTemplatePreview = (templateId: string) => {
    return (
      <div
        className="bg-white"
        style={{
          width: "8.5in",
          minHeight: "11in",
          transform: "scale(0.35)",
          transformOrigin: "top left",
        }}
      >
        {renderTemplate(templateId, true)}
      </div>
    );
  };

  if (!hasSelectedTemplate) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-gray-50/50 p-6 relative">
        {/* Modal-like container */}
        <div className="bg-white rounded-xl shadow-2xl p-8 max-w-5xl w-full border border-gray-200">
          <div className="mb-6">
            <h1 className="text-2xl font-bold tracking-tight mb-1">Select a template</h1>
            <p className="text-muted-foreground">Choose a template and start creating resume with us.</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
            {["classic1", "classic2", "modern1", "modern2"].map((tempId) => (
              <div key={tempId} className="flex flex-col gap-3 group">
                <div
                  className={`relative aspect-[8.5/11] bg-gray-50 rounded-lg border-2 overflow-hidden cursor-pointer transition-all duration-200 ${selectedTemplate === tempId ? "border-primary shadow-md ring-1 ring-primary" : "border-border hover:border-gray-300"
                    }`}
                  onClick={() => handleSelectTemplate(tempId)}
                >
                  <div className="absolute inset-0 overflow-auto pointer-events-none">
                    <div style={{ transform: "scale(0.35)", transformOrigin: "top left", width: "8.5in", minHeight: "11in" }}>
                      {renderTemplate(tempId, true)}
                    </div>
                  </div>

                  {/* Eye Icon for Preview */}
                  <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                    <Button
                      size="icon"
                      variant="secondary"
                      className="h-8 w-8 rounded-full shadow-md bg-white hover:bg-gray-100"
                      onClick={(e) => {
                        e.stopPropagation();
                        setPreviewingTemplate(tempId);
                      }}
                    >
                      <Eye className="w-4 h-4 text-gray-700" />
                    </Button>
                  </div>
                </div>

                {/* Radio selection */}
                <div
                  className="flex items-center gap-2 cursor-pointer"
                  onClick={() => handleSelectTemplate(tempId)}
                >
                  <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${selectedTemplate === tempId ? "border-primary" : "border-gray-300"
                    }`}>
                    {selectedTemplate === tempId && <div className="w-2.5 h-2.5 rounded-full bg-primary" />}
                  </div>
                  <span className={`text-sm font-medium ${selectedTemplate === tempId ? "text-primary" : "text-gray-600"}`}>
                    {tempId.replace(/(\d+)/, " $1").replace(/\b\w/g, l => l.toUpperCase())}
                  </span>
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
            <Button variant="outline" className="min-w-[100px]" onClick={() => {/* Cancel logic if needed */ }}>Cancel</Button>
            <Button className="min-w-[100px] bg-green-700 hover:bg-green-800 text-white" onClick={confirmSelection}>Confirm</Button>
          </div>
        </div>

        {/* Full Screen Preview Modal */}
        {previewingTemplate && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-lg shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
              <div className="p-4 border-b flex items-center justify-between bg-gray-50/50">
                <h3 className="font-semibold text-lg capitalize">{previewingTemplate.replace(/(\d+)/, " $1")} Preview</h3>
                <Button variant="ghost" size="icon" onClick={() => setPreviewingTemplate(null)}>
                  <span className="sr-only">Close</span>
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
                </Button>
              </div>
              <div className="flex-1 overflow-auto p-8 bg-gray-100 flex justify-center">
                <div className="bg-white shadow-lg pointer-events-none" style={{ width: "8.5in", minHeight: "11in" }}>
                  {renderTemplate(previewingTemplate, true)}
                </div>
              </div>
              <div className="p-4 border-t flex justify-end gap-2 bg-gray-50/50">
                <Button variant="outline" onClick={() => setPreviewingTemplate(null)}>Close</Button>
                <Button onClick={() => { handleSelectTemplate(previewingTemplate); setPreviewingTemplate(null); }}>Select This Template</Button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-gray-100/50">
      <div className="flex items-center justify-between px-6 py-4 bg-white border-b border-gray-200 shadow-sm">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>Dashboard</span>
            <span>{">"}</span>
            <span>Resume Builder</span>
          </div>
          <div className="flex items-center gap-3">
            {isEditingTitle ? (
              <Input
                value={resumeTitle}
                onChange={(e) => setResumeTitle(e.target.value)}
                onBlur={() => setIsEditingTitle(false)}
                onKeyDown={(e) => e.key === "Enter" && setIsEditingTitle(false)}
                autoFocus
                className="h-8 w-64 font-bold text-xl tracking-tight text-gray-900 border-gray-300 focus-visible:ring-primary"
              />
            ) : (
              <h1
                className="text-xl font-bold tracking-tight text-gray-900 cursor-pointer hover:underline decoration-dashed underline-offset-4"
                onClick={() => setIsEditingTitle(true)}
              >
                {resumeTitle}
              </h1>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 text-gray-400 hover:text-gray-700"
              onClick={() => setIsEditingTitle(true)}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" /></svg>
            </Button>
            <span className="text-xs text-green-600 flex items-center gap-1 font-medium bg-green-50 px-2 py-0.5 rounded-full">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3 h-3"><path d="M20 6 9 17l-5-5" /></svg>
              Updated just now
            </span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="ghost" className="text-primary hover:text-primary/80 font-medium" onClick={() => setHasSelectedTemplate(false)}>
            Change Template
          </Button>
          <Button
            variant="outline"
            className="gap-2 text-gray-700 border-gray-300 shadow-sm"
            onClick={handleAIReview}
            disabled={isAnalyzing}
          >
            <Sparkles className={`w-4 h-4 ${isAnalyzing ? 'animate-spin' : ''}`} />
            {isAnalyzing ? 'Analyzing...' : 'Try AI Review'}
          </Button>
          <Button onClick={downloadPDF} className="bg-green-700 hover:bg-green-800 text-white shadow-sm gap-2 font-medium px-6">
            <Download className="w-4 h-4" />
            Download
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-hidden flex">
        {/* Left Panel - Form */}
        <div className="w-1/2 border-r border-border overflow-y-auto p-6">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="w-full justify-start overflow-x-auto flex-nowrap shrink-0 h-auto p-1 bg-muted/50">
              <TabsTrigger value="personal" className="shrink-0">Personal</TabsTrigger>
              <TabsTrigger value="experience" className="shrink-0">Experience</TabsTrigger>
              <TabsTrigger value="education" className="shrink-0">Education</TabsTrigger>
              <TabsTrigger value="skills" className="shrink-0">Skills</TabsTrigger>
              <TabsTrigger value="certifications" className="shrink-0">Certifications</TabsTrigger>
              <TabsTrigger value="achievements" className="shrink-0">Achievements</TabsTrigger>
              <TabsTrigger value="projects" className="shrink-0">Projects</TabsTrigger>
              <TabsTrigger value="languages" className="shrink-0">Languages</TabsTrigger>
            </TabsList>

            <TabsContent value="personal" className="space-y-4 mt-4">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="fullName">Full Name *</Label>
                  <Input
                    id="fullName"
                    value={personalInfo.fullName}
                    onChange={(e) => setPersonalInfo({ ...personalInfo, fullName: e.target.value })}
                    placeholder="John Doe"
                    className="bg-card/50"
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={personalInfo.email}
                    onChange={(e) => setPersonalInfo({ ...personalInfo, email: e.target.value })}
                    placeholder="john.doe@example.com"
                    className="bg-card/50"
                  />
                </div>
                <div>
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    value={personalInfo.phone}
                    onChange={(e) => setPersonalInfo({ ...personalInfo, phone: e.target.value })}
                    placeholder="+1 (555) 123-4567"
                    className="bg-card/50"
                  />
                </div>
                <div>
                  <Label htmlFor="address">Address</Label>
                  <Input
                    id="address"
                    value={personalInfo.address}
                    onChange={(e) => setPersonalInfo({ ...personalInfo, address: e.target.value })}
                    placeholder="City, State, Country"
                    className="bg-card/50"
                  />
                </div>
                <div>
                  <Label htmlFor="linkedin">LinkedIn</Label>
                  <Input
                    id="linkedin"
                    value={personalInfo.linkedin}
                    onChange={(e) => setPersonalInfo({ ...personalInfo, linkedin: e.target.value })}
                    placeholder="linkedin.com/in/johndoe"
                    className="bg-card/50"
                  />
                </div>
                <div>
                  <Label htmlFor="website">Website/Portfolio</Label>
                  <Input
                    id="website"
                    value={personalInfo.website}
                    onChange={(e) => setPersonalInfo({ ...personalInfo, website: e.target.value })}
                    placeholder="www.johndoe.com"
                    className="bg-card/50"
                  />
                </div>
                <div>
                  <Label htmlFor="summary">Professional Summary</Label>
                  <Textarea
                    id="summary"
                    value={summary}
                    onChange={(e) => setSummary(e.target.value)}
                    placeholder="Write a brief summary of your professional background..."
                    className="bg-card/50 min-h-[120px]"
                    rows={5}
                  />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="experience" className="space-y-4 mt-4">
              <div className="flex items-center justify-between mb-4">
                <Label className="text-lg font-semibold">Work Experience</Label>
                <Button onClick={addExperience} size="sm" className="gap-2">
                  <Plus className="w-4 h-4" />
                  Add Experience
                </Button>
              </div>
              <div className="space-y-4">
                {experiences.map((exp) => (
                  <Card key={exp.id} className="p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="font-semibold">Experience {experiences.indexOf(exp) + 1}</h4>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeExperience(exp.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                    <div>
                      <Label>Position/Title *</Label>
                      <Input
                        value={exp.position}
                        onChange={(e) => updateExperience(exp.id, "position", e.target.value)}
                        placeholder="Software Engineer"
                        className="bg-card/50"
                      />
                    </div>
                    <div>
                      <Label>Company *</Label>
                      <Input
                        value={exp.company}
                        onChange={(e) => updateExperience(exp.id, "company", e.target.value)}
                        placeholder="Tech Company Inc."
                        className="bg-card/50"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label>Start Date</Label>
                        <Input
                          type="month"
                          value={exp.startDate}
                          onChange={(e) => updateExperience(exp.id, "startDate", e.target.value)}
                          className="bg-card/50"
                        />
                      </div>
                      <div>
                        <Label>End Date</Label>
                        <Input
                          type="month"
                          value={exp.endDate}
                          onChange={(e) => updateExperience(exp.id, "endDate", e.target.value)}
                          disabled={exp.current}
                          className="bg-card/50"
                        />
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id={`current-${exp.id}`}
                        checked={exp.current}
                        onChange={(e) => updateExperience(exp.id, "current", e.target.checked)}
                        className="w-4 h-4"
                      />
                      <Label htmlFor={`current-${exp.id}`} className="text-sm">
                        Currently working here
                      </Label>
                    </div>
                    <div>
                      <Label>Description</Label>
                      <Textarea
                        value={exp.description}
                        onChange={(e) => updateExperience(exp.id, "description", e.target.value)}
                        placeholder="Describe your responsibilities and achievements..."
                        className="bg-card/50 min-h-[100px]"
                        rows={4}
                      />
                    </div>
                  </Card>
                ))}
                {experiences.length === 0 && (
                  <Card className="p-8 text-center text-muted-foreground">
                    <FileText className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>No experience added yet. Click "Add Experience" to get started.</p>
                  </Card>
                )}
              </div>
            </TabsContent>

            <TabsContent value="education" className="space-y-4 mt-4">
              <div className="flex items-center justify-between mb-4">
                <Label className="text-lg font-semibold">Education</Label>
                <Button onClick={addEducation} size="sm" className="gap-2">
                  <Plus className="w-4 h-4" />
                  Add Education
                </Button>
              </div>
              <div className="space-y-4">
                {educations.map((edu) => (
                  <Card key={edu.id} className="p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="font-semibold">Education {educations.indexOf(edu) + 1}</h4>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeEducation(edu.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                    <div>
                      <Label>Institution *</Label>
                      <Input
                        value={edu.institution}
                        onChange={(e) => updateEducation(edu.id, "institution", e.target.value)}
                        placeholder="University Name"
                        className="bg-card/50"
                      />
                    </div>
                    <div>
                      <Label>Degree *</Label>
                      <Input
                        value={edu.degree}
                        onChange={(e) => updateEducation(edu.id, "degree", e.target.value)}
                        placeholder="Bachelor's, Master's, etc."
                        className="bg-card/50"
                      />
                    </div>
                    <div>
                      <Label>Field of Study</Label>
                      <Input
                        value={edu.field}
                        onChange={(e) => updateEducation(edu.id, "field", e.target.value)}
                        placeholder="Computer Science"
                        className="bg-card/50"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label>Start Date</Label>
                        <Input
                          type="month"
                          value={edu.startDate}
                          onChange={(e) => updateEducation(edu.id, "startDate", e.target.value)}
                          className="bg-card/50"
                        />
                      </div>
                      <div>
                        <Label>End Date</Label>
                        <Input
                          type="month"
                          value={edu.endDate}
                          onChange={(e) => updateEducation(edu.id, "endDate", e.target.value)}
                          className="bg-card/50"
                        />
                      </div>
                    </div>
                    <div>
                      <Label>GPA (Optional)</Label>
                      <Input
                        value={edu.gpa}
                        onChange={(e) => updateEducation(edu.id, "gpa", e.target.value)}
                        placeholder="3.8/4.0"
                        className="bg-card/50"
                      />
                    </div>
                  </Card>
                ))}
                {educations.length === 0 && (
                  <Card className="p-8 text-center text-muted-foreground">
                    <FileText className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>No education added yet. Click "Add Education" to get started.</p>
                  </Card>
                )}
              </div>
            </TabsContent>

            <TabsContent value="skills" className="space-y-4 mt-4">
              <div className="flex items-center justify-between mb-4">
                <Label className="text-lg font-semibold">Skills</Label>
                <Button onClick={addSkill} size="sm" className="gap-2">
                  <Plus className="w-4 h-4" />
                  Add Skill
                </Button>
              </div>
              <div className="space-y-3">
                {skills.map((skill) => (
                  <Card key={skill.id} className="p-3">
                    <div className="flex items-center gap-2">
                      <Input
                        value={skill.name}
                        onChange={(e) => updateSkill(skill.id, "name", e.target.value)}
                        placeholder="Skill name"
                        className="flex-1 bg-card/50"
                      />
                      <select
                        value={skill.level}
                        onChange={(e) => updateSkill(skill.id, "level", e.target.value)}
                        className="h-10 px-3 rounded-md border border-input bg-card/50 text-sm"
                      >
                        <option value="beginner">Beginner</option>
                        <option value="intermediate">Intermediate</option>
                        <option value="advanced">Advanced</option>
                        <option value="expert">Expert</option>
                      </select>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeSkill(skill.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </Card>
                ))}
                {skills.length === 0 && (
                  <Card className="p-8 text-center text-muted-foreground">
                    <FileText className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>No skills added yet. Click "Add Skill" to get started.</p>
                  </Card>
                )}
              </div>
            </TabsContent>

            <TabsContent value="certifications" className="space-y-4 mt-4">
              <div className="flex items-center justify-between mb-4">
                <Label className="text-lg font-semibold">Certifications</Label>
                <Button onClick={addCertification} size="sm" className="gap-2">
                  <Plus className="w-4 h-4" />
                  Add Certification
                </Button>
              </div>
              <div className="space-y-4">
                {certifications.map((cert) => (
                  <Card key={cert.id} className="p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="font-semibold">Certification {certifications.indexOf(cert) + 1}</h4>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeCertification(cert.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                    <div>
                      <Label>Certification Name *</Label>
                      <Input
                        value={cert.name}
                        onChange={(e) => updateCertification(cert.id, "name", e.target.value)}
                        placeholder="AWS Certified Solutions Architect"
                        className="bg-card/50"
                      />
                    </div>
                    <div>
                      <Label>Issuing Organization *</Label>
                      <Input
                        value={cert.issuer}
                        onChange={(e) => updateCertification(cert.id, "issuer", e.target.value)}
                        placeholder="Amazon Web Services"
                        className="bg-card/50"
                      />
                    </div>
                    <div className="grid grid-cols-1 gap-2">
                      <div>
                        <Label>Issue Date</Label>
                        <Input
                          type="month"
                          value={cert.issueDate}
                          onChange={(e) => updateCertification(cert.id, "issueDate", e.target.value)}
                          className="bg-card/50"
                        />
                      </div>
                      <div>
                        <Label>Expiry Date (Optional)</Label>
                        <Input
                          type="month"
                          value={cert.expiryDate}
                          onChange={(e) => updateCertification(cert.id, "expiryDate", e.target.value)}
                          className="bg-card/50"
                        />
                      </div>
                    </div>
                    <div>
                      <Label>Credential ID (Optional)</Label>
                      <Input
                        value={cert.credentialId}
                        onChange={(e) => updateCertification(cert.id, "credentialId", e.target.value)}
                        placeholder="AWS-12345"
                        className="bg-card/50"
                      />
                    </div>
                    <div>
                      <Label>Credential URL (Optional)</Label>
                      <Input
                        type="url"
                        value={cert.url}
                        onChange={(e) => updateCertification(cert.id, "url", e.target.value)}
                        placeholder="https://aws.amazon.com/certification"
                        className="bg-card/50"
                      />
                    </div>
                  </Card>
                ))}
                {certifications.length === 0 && (
                  <Card className="p-8 text-center text-muted-foreground">
                    <FileText className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>No certifications added yet. Click "Add Certification" to get started.</p>
                  </Card>
                )}
              </div>
            </TabsContent>

            <TabsContent value="achievements" className="space-y-4 mt-4">
              <div className="flex items-center justify-between mb-4">
                <Label className="text-lg font-semibold">Achievements & Awards</Label>
                <Button onClick={addAchievement} size="sm" className="gap-2">
                  <Plus className="w-4 h-4" />
                  Add Achievement
                </Button>
              </div>
              <div className="space-y-4">
                {achievements.map((ach) => (
                  <Card key={ach.id} className="p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="font-semibold">Achievement {achievements.indexOf(ach) + 1}</h4>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeAchievement(ach.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                    <div>
                      <Label>Title *</Label>
                      <Input
                        value={ach.title}
                        onChange={(e) => updateAchievement(ach.id, "title", e.target.value)}
                        placeholder="Employee of the Year"
                        className="bg-card/50"
                      />
                    </div>
                    <div>
                      <Label>Description</Label>
                      <Textarea
                        value={ach.description}
                        onChange={(e) => updateAchievement(ach.id, "description", e.target.value)}
                        placeholder="Recognized for outstanding performance..."
                        className="bg-card/50 min-h-[80px]"
                        rows={3}
                      />
                    </div>
                    <div className="grid grid-cols-1 gap-2">
                      <div>
                        <Label>Date</Label>
                        <Input
                          type="month"
                          value={ach.date}
                          onChange={(e) => updateAchievement(ach.id, "date", e.target.value)}
                          className="bg-card/50"
                        />
                      </div>
                      <div>
                        <Label>Organization</Label>
                        <Input
                          value={ach.organization}
                          onChange={(e) => updateAchievement(ach.id, "organization", e.target.value)}
                          placeholder="Company Name"
                          className="bg-card/50"
                        />
                      </div>
                    </div>
                  </Card>
                ))}
                {achievements.length === 0 && (
                  <Card className="p-8 text-center text-muted-foreground">
                    <FileText className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>No achievements added yet. Click "Add Achievement" to get started.</p>
                  </Card>
                )}
              </div>
            </TabsContent>

            <TabsContent value="projects" className="space-y-4 mt-4">
              <div className="flex items-center justify-between mb-4">
                <Label className="text-lg font-semibold">Projects</Label>
                <Button onClick={addProject} size="sm" className="gap-2">
                  <Plus className="w-4 h-4" />
                  Add Project
                </Button>
              </div>
              <div className="space-y-4">
                {projects.map((proj) => (
                  <Card key={proj.id} className="p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="font-semibold">Project {projects.indexOf(proj) + 1}</h4>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeProject(proj.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                    <div>
                      <Label>Project Name *</Label>
                      <Input
                        value={proj.name}
                        onChange={(e) => updateProject(proj.id, "name", e.target.value)}
                        placeholder="E-Commerce Platform"
                        className="bg-card/50"
                      />
                    </div>
                    <div>
                      <Label>Description</Label>
                      <Textarea
                        value={proj.description}
                        onChange={(e) => updateProject(proj.id, "description", e.target.value)}
                        placeholder="Describe your project..."
                        className="bg-card/50 min-h-[100px]"
                        rows={4}
                      />
                    </div>
                    <div>
                      <Label>Technologies Used</Label>
                      <Input
                        value={proj.technologies}
                        onChange={(e) => updateProject(proj.id, "technologies", e.target.value)}
                        placeholder="React, Node.js, MongoDB, AWS"
                        className="bg-card/50"
                      />
                    </div>
                    <div className="grid grid-cols-1 gap-2">
                      <div>
                        <Label>Start Date</Label>
                        <Input
                          type="month"
                          value={proj.startDate}
                          onChange={(e) => updateProject(proj.id, "startDate", e.target.value)}
                          className="bg-card/50"
                        />
                      </div>
                      <div>
                        <Label>End Date</Label>
                        <Input
                          type="month"
                          value={proj.endDate}
                          onChange={(e) => updateProject(proj.id, "endDate", e.target.value)}
                          disabled={proj.current}
                          className="bg-card/50"
                        />
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id={`current-proj-${proj.id}`}
                        checked={proj.current}
                        onChange={(e) => updateProject(proj.id, "current", e.target.checked)}
                        className="w-4 h-4"
                      />
                      <Label htmlFor={`current-proj-${proj.id}`} className="text-sm">
                        Currently working on this project
                      </Label>
                    </div>
                    <div>
                      <Label>Project URL (Optional)</Label>
                      <Input
                        type="url"
                        value={proj.url}
                        onChange={(e) => updateProject(proj.id, "url", e.target.value)}
                        placeholder="https://github.com/username/project"
                        className="bg-card/50"
                      />
                    </div>
                  </Card>
                ))}
                {projects.length === 0 && (
                  <Card className="p-8 text-center text-muted-foreground">
                    <FileText className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>No projects added yet. Click "Add Project" to get started.</p>
                  </Card>
                )}
              </div>
            </TabsContent>

            <TabsContent value="languages" className="space-y-4 mt-4">
              <div className="flex items-center justify-between mb-4">
                <Label className="text-lg font-semibold">Languages</Label>
                <Button onClick={addLanguage} size="sm" className="gap-2">
                  <Plus className="w-4 h-4" />
                  Add Language
                </Button>
              </div>
              <div className="space-y-3">
                {languages.map((lang) => (
                  <Card key={lang.id} className="p-3">
                    <div className="flex items-center gap-2">
                      <Input
                        value={lang.name}
                        onChange={(e) => updateLanguage(lang.id, "name", e.target.value)}
                        placeholder="Language name"
                        className="flex-1 bg-card/50"
                      />
                      <select
                        value={lang.proficiency}
                        onChange={(e) => updateLanguage(lang.id, "proficiency", e.target.value)}
                        className="h-10 px-3 rounded-md border border-input bg-card/50 text-sm"
                      >
                        <option value="basic">Basic</option>
                        <option value="intermediate">Intermediate</option>
                        <option value="fluent">Fluent</option>
                        <option value="native">Native</option>
                      </select>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeLanguage(lang.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </Card>
                ))}
                {languages.length === 0 && (
                  <Card className="p-8 text-center text-muted-foreground">
                    <FileText className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>No languages added yet. Click "Add Language" to get started.</p>
                  </Card>
                )}
              </div>
            </TabsContent>
          </Tabs >
        </div >

        {/* Right Panel - Preview */}
        < div className="w-1/2 overflow-hidden flex flex-col bg-gray-50 border-l border-border relative" >
          <div className="p-4 border-b border-border bg-white flex items-center justify-between z-10 shrink-0">
            <div>
              <h3 className="font-semibold">Resume Preview</h3>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={() => setZoom(Math.max(0.25, zoom - 0.1))}
                disabled={zoom <= 0.25}
                className="h-8 w-8"
              >
                <ZoomOut className="w-4 h-4" />
              </Button>
              <span className="text-sm font-medium w-12 text-center">{Math.round(zoom * 100)}%</span>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setZoom(Math.min(2, zoom + 0.1))}
                disabled={zoom >= 2}
                className="h-8 w-8"
              >
                <ZoomIn className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setZoom(0.55)}
                className="h-8 px-2 text-xs gap-1"
                title="Fit to Screen"
              >
                <Maximize className="w-3 h-3" />
                Fit
              </Button>
            </div>
          </div>

          <div className="flex-1 overflow-auto p-8 flex justify-center items-start">
            <div
              style={{
                width: `${8.5 * zoom}in`,
                height: `${11 * zoom}in`,
                transition: 'width 0.2s, height 0.2s'
              }}
              className="shrink-0" // prevent flex shrinking
            >
              <div
                id="resume-preview"
                className="bg-white shadow-lg origin-top-left"
                style={{
                  minHeight: "11in",
                  width: "8.5in",
                  transform: `scale(${zoom})`,
                  transition: 'transform 0.2s'
                }}
              >
                {renderTemplate(selectedTemplate, false)}
              </div>
            </div>
          </div>
        </div >
      </div >

      {/* Full Template Preview Modal */}
      {
        previewingTemplate && (
          <div
            className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
            onClick={() => setPreviewingTemplate(null)}
          >
            <div
              className="bg-white rounded-lg shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="sticky top-0 bg-white border-b border-border p-4 flex items-center justify-between z-10">
                <h3 className="text-lg font-semibold">
                  Template Preview: {previewingTemplate === "classic1" ? "Classic 1" : previewingTemplate === "classic2" ? "Classic 2" : previewingTemplate === "modern1" ? "Modern 1" : "Modern 2"}
                </h3>
                <div className="flex gap-2">
                  <Button
                    onClick={() => {
                      setSelectedTemplate(previewingTemplate as any);
                      setPreviewingTemplate(null);
                      toast({
                        title: "Template Selected",
                        description: "Template has been selected. You can now customize it.",
                      });
                    }}
                    className="gradient-primary"
                  >
                    Use This Template
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setPreviewingTemplate(null)}
                  >
                    Close
                  </Button>
                </div>
              </div>
              <div className="p-6 bg-gray-50">
                <div className="bg-white shadow-lg mx-auto" style={{ minHeight: "11in", width: "8.5in" }}>
                  {renderTemplate(previewingTemplate, true)}
                </div>
              </div>
            </div>
          </div>
        )
      }
      {/* AI Analysis Modal */}
      {
        analysisResult && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
              <div className="p-6 border-b flex items-center justify-between bg-primary/5">
                <div>
                  <h3 className="text-xl font-bold flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-primary" />
                    AI Resume Review
                  </h3>
                  <p className="text-sm text-muted-foreground">Detailed feedback to improve your score</p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex flex-col items-end">
                    <span className="text-xs text-muted-foreground uppercase font-semibold">Resume Score</span>
                    <span className={`text-2xl font-bold ${analysisResult.overallScore >= 80 ? 'text-green-600' : analysisResult.overallScore >= 60 ? 'text-yellow-600' : 'text-red-600'}`}>
                      {analysisResult.overallScore}/100
                    </span>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => setAnalysisResult(null)} className="h-8 w-8 rounded-full">
                    <Eye className="w-5 h-5" />
                  </Button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {/* Summary */}
                <div className="bg-blue-50/50 p-4 rounded-lg border border-blue-100">
                  <h4 className="font-semibold text-blue-900 mb-2">Analysis Summary</h4>
                  <p className="text-sm text-blue-800 leading-relaxed">{analysisResult.summary}</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Strengths */}
                  <div className="space-y-3">
                    <h4 className="font-semibold text-green-700 flex items-center gap-2">
                      <Sparkles className="w-5 h-5" />
                      Strengths
                    </h4>
                    <ul className="space-y-2">
                      {analysisResult.strengths?.map((str: string, i: number) => (
                        <li key={i} className="text-sm bg-green-50 p-2 rounded border border-green-100 text-green-800 flex items-start gap-2">
                          <span className="mt-1 block w-1.5 h-1.5 rounded-full bg-green-400 shrink-0" />
                          {str}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Weaknesses */}
                  <div className="space-y-3">
                    <h4 className="font-semibold text-amber-700 flex items-center gap-2">
                      <Eye className="w-5 h-5" />
                      Improvements
                    </h4>
                    <ul className="space-y-2">
                      {analysisResult.weaknesses?.map((weak: string, i: number) => (
                        <li key={i} className="text-sm bg-amber-50 p-2 rounded border border-amber-100 text-amber-800 flex items-start gap-2">
                          <span className="mt-1 block w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />
                          {weak}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Recommendations */}
                <div className="space-y-3 pt-2">
                  <h4 className="font-semibold text-primary flex items-center gap-2">
                    <Sparkles className="w-5 h-5" />
                    Strategic Recommendations
                  </h4>
                  <ul className="grid grid-cols-1 gap-2">
                    {analysisResult.recommendations?.map((rec: string, i: number) => (
                      <li key={i} className="text-sm bg-gray-50 p-3 rounded-lg border border-gray-100 text-gray-700 flex items-start gap-3">
                        <span className="font-bold text-primary/40 text-lg leading-none">{(i + 1).toString().padStart(2, '0')}</span>
                        {rec}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="p-4 border-t bg-gray-50 flex justify-end">
                <Button onClick={() => setAnalysisResult(null)} className="min-w-[100px]">Got it</Button>
              </div>
            </div>
          </div>
        )
      }
    </div >
  );
};

export default ResumeBuilder;

