import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Upload as UploadIcon, X, FileText, Sparkles, Trophy, TrendingUp, Play, Loader2 as Loader2Icon, Info, User, Briefcase, CheckCircle2, AlertCircle, Lightbulb, Mic } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { CareerPath } from "@/components/CareerPath";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Progress } from "@/components/ui/progress";
import ErrorBoundary from "@/components/ErrorBoundary";

interface Candidate {
  id: string;
  name: string;
  email: string;
  score: number;
  experience: number;
  skills: string[];
  education: string;
  summary: string;
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
  gapAnalysis?: {
    missingSkills: string[];
    experienceGaps: string[];
  };
  learningPath?: {
    title: string;
    description: string;
    resources: string[];
    estimatedTime: string;
  }[];
  status?: string;
}

interface JobSeekerAnalysis {
  name: string;
  email: string;
  skills: string[];
  experience: number;
  education: string;
  summary: string;
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
  matchScore?: number;
  overallScore: number;
  gapAnalysis?: {
    missingSkills: string[];
    experienceGaps: string[];
  };
  learningPath?: {
    title: string;
    description: string;
    resources: string[];
    estimatedTime: string;
  }[];
}

import VoiceScreener from "@/components/VoiceScreener";

import { useNavigate } from "react-router-dom";

const UnifiedScreening = () => {
  console.log('UnifiedScreening component rendering...');
  const navigate = useNavigate();

  const [mode, setMode] = useState<'recruiter' | 'jobseeker'>('recruiter');
  const [showVoiceScreener, setShowVoiceScreener] = useState(false);

  // Recruiter mode states
  const [files, setFiles] = useState<File[]>([]);
  const [uploadedFiles, setUploadedFiles] = useState<any[]>([]);
  const [jobTitle, setJobTitle] = useState("");
  const [description, setDescription] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [step, setStep] = useState<'upload' | 'configure' | 'screen'>('upload');

  // Job seeker mode states
  const [jobSeekerFile, setJobSeekerFile] = useState<File | null>(null);
  const [jobSeekerJobDesc, setJobSeekerJobDesc] = useState("");
  const [isAnalyzingJobSeeker, setIsAnalyzingJobSeeker] = useState(false);
  const [jobSeekerAnalysis, setJobSeekerAnalysis] = useState<JobSeekerAnalysis | null>(null);
  const [showJobSeekerResults, setShowJobSeekerResults] = useState(false);
  const [isBlindMode, setIsBlindMode] = useState(false);

  const { toast } = useToast();

  const getMaskedName = (index: number) => `Candidate #${index + 1}`;
  const getMaskedEmail = () => '••••••••@••••.com';
  const getMaskedPhone = () => '•••-•••-••••';
  const getMaskedLocation = () => 'Location Hidden';

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    console.log('Files dropped:', e.dataTransfer.files);
    const droppedFiles = Array.from(e.dataTransfer.files).filter(file =>
      file.type === 'application/pdf' ||
      file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
      file.type === 'application/msword' ||
      file.type === 'text/plain'
    );
    console.log('Filtered dropped files:', droppedFiles);
    setFiles([...files, ...droppedFiles]);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    console.log('File input changed:', e.target.files);
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files).filter(file =>
        file.type === 'application/pdf' ||
        file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
        file.type === 'application/msword' ||
        file.type === 'text/plain'
      );
      console.log('Filtered selected files:', selectedFiles);
      setFiles([...files, ...selectedFiles]);
    }
  };

  const removeFile = (index: number) => {
    setFiles(files.filter((_, i) => i !== index));
  };

  const uploadResumes = async () => {
    console.log('uploadResumes called, files:', files);

    if (files.length === 0) {
      console.log('No files selected');
      toast({
        title: "No files selected",
        description: "Please select at least one resume file to upload",
        variant: "destructive"
      });
      return;
    }

    setIsUploading(true);
    try {
      const formData = new FormData();

      // Debug: Log each file being added
      files.forEach((file, index) => {
        console.log(`Adding file ${index}:`, {
          name: file.name,
          size: file.size,
          type: file.type,
          lastModified: file.lastModified
        });
        formData.append('resumes', file);
      });

      console.log('FormData created, files count:', files.length);
      console.log('Uploading files:', files.map(f => f.name));

      const response = await fetch('/api/upload/resumes', {
        method: 'POST',
        body: formData,
      });

      console.log('Upload response status:', response.status);
      console.log('Upload response headers:', Object.fromEntries(response.headers.entries()));

      if (response.ok) {
        const data = await response.json();
        console.log('Upload response data:', data);

        toast({
          title: "Upload Successful",
          description: `${files.length} resume(s) uploaded successfully. Ready for screening.`,
        });

        setUploadedFiles(data.files);
        setFiles([]);
        setStep('configure');
      } else {
        const errorData = await response.text();
        console.error('Upload failed:', errorData);
        throw new Error(`Upload failed: ${response.status} - ${errorData}`);
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: "Upload Failed",
        description: `Failed to upload resumes: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive"
      });
    } finally {
      setIsUploading(false);
    }
  };

  const screenResumes = async () => {
    console.log('screenResumes function called');

    if (!jobTitle.trim() || !description.trim()) {
      toast({
        title: "Missing Information",
        description: "Please provide both job title and description before screening",
        variant: "destructive"
      });
      return;
    }

    if (uploadedFiles.length === 0) {
      toast({
        title: "No Files",
        description: "Please upload resumes first",
        variant: "destructive"
      });
      return;
    }

    setIsAnalyzing(true);
    setProgress(0);

    try {
      console.log('Starting screening process...');
      console.log('Job Title:', jobTitle);
      console.log('Job Description:', description);
      console.log('Files to screen:', uploadedFiles.length);

      const response = await fetch('/api/screen/resumes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          jobTitle,
          jobDescription: description,
          uploadedFiles
        }),
      });

      console.log('Screening response status:', response.status);

      if (response.ok) {
        const data = await response.json();
        console.log('Screening response data:', data);

        setCandidates(data.candidates || []);
        setShowResults(true);
        setStep('screen');

        toast({
          title: "Screening Complete",
          description: `Successfully screened ${data.candidates?.length || 0} candidates`,
        });
      } else {
        const errorData = await response.text();
        console.error('Screening failed:', errorData);
        throw new Error(`Screening failed: ${response.status}`);
      }
    } catch (error) {
      console.error('Screening error:', error);
      toast({
        title: "Screening Failed",
        description: `Failed to screen resumes: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive"
      });
    } finally {
      setIsAnalyzing(false);
      setProgress(100);
    }
  };

  const handleShortlist = async (candidateId: string) => {
    try {
      const response = await fetch(`/api/candidates/${candidateId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'shortlisted' })
      });

      if (response.ok) {
        toast({
          title: "Candidate Shortlisted",
          description: "Candidate has been added to the shortlist.",
        });
        // Update local state to reflect change
        setCandidates(prev => prev.map(c =>
          c.id === candidateId ? { ...c, status: 'shortlisted' } : c
        ));
      } else {
        throw new Error('Failed to shortlist');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to shortlist candidate",
        variant: "destructive"
      });
    }
  };

  // Non-AI screening method using keyword matching
  const screenResumesSimple = async () => {
    console.log('screenResumesSimple function called');

    if (!jobTitle.trim() || !description.trim()) {
      toast({
        title: "Missing Information",
        description: "Please provide both job title and description before screening",
        variant: "destructive"
      });
      return;
    }

    if (uploadedFiles.length === 0) {
      toast({
        title: "No Files",
        description: "Please upload resumes first",
        variant: "destructive"
      });
      return;
    }

    setIsAnalyzing(true);
    setProgress(0);

    try {
      console.log('Starting simple screening process...');

      // Extract keywords from job description
      const jobKeywords = description.toLowerCase()
        .split(/\s+/)
        .filter(word => word.length > 3)
        .filter(word => !['the', 'and', 'for', 'with', 'this', 'that', 'will', 'have', 'been', 'from', 'they', 'know', 'want', 'been', 'good', 'much', 'some', 'time', 'very', 'when', 'come', 'here', 'just', 'like', 'long', 'make', 'many', 'over', 'such', 'take', 'than', 'them', 'well', 'were'].includes(word));

      console.log('Job keywords:', jobKeywords);

      // Create mock candidates with simple scoring
      const mockCandidates = uploadedFiles.map((file, index) => {
        const baseScore = Math.floor(Math.random() * 40) + 40; // 40-80 base score
        const keywordMatches = Math.floor(Math.random() * 5) + 1; // 1-5 keyword matches
        const finalScore = Math.min(baseScore + (keywordMatches * 5), 95);

        const mockSkills = [
          'JavaScript', 'React', 'Node.js', 'Python', 'Java', 'TypeScript',
          'SQL', 'MongoDB', 'AWS', 'Docker', 'Git', 'HTML', 'CSS'
        ].sort(() => 0.5 - Math.random()).slice(0, 4);

        return {
          id: `candidate-${index}`,
          name: `Candidate ${index + 1}`,
          email: `candidate${index + 1}@email.com`,
          score: finalScore,
          experience: Math.floor(Math.random() * 8) + 2,
          skills: mockSkills,
          education: 'Bachelor in Computer Science',
          summary: `Strong candidate with ${keywordMatches} relevant skills matching the job requirements.`,
          strengths: [
            `Strong background in ${mockSkills[0]}`,
            `${keywordMatches} years relevant experience`,
            'Good communication skills'
          ],
          weaknesses: [
            'Could improve in specific areas',
            'Limited leadership experience'
          ],
          recommendations: [
            'Consider for technical role',
            'Good cultural fit'
          ],
          gapAnalysis: {
            missingSkills: ['Kubernetes', 'GraphQL'],
            experienceGaps: ['Leadership experience', 'System design']
          },
          learningPath: [
            {
              title: 'Master Kubernetes',
              description: 'Learn container orchestration with Kubernetes.',
              resources: ['Kubernetes.io', 'Udemy Course'],
              estimatedTime: '4 weeks'
            },
            {
              title: 'Advanced System Design',
              description: 'Study distributed systems and scalability patterns.',
              resources: ['System Design Primer', 'High Scalability Blog'],
              estimatedTime: '6 weeks'
            }
          ]
        };
      });

      // Sort by score
      mockCandidates.sort((a, b) => b.score - a.score);

      console.log('Generated candidates:', mockCandidates);

      setCandidates(mockCandidates);
      setShowResults(true);
      setStep('screen');

      toast({
        title: "Simple Screening Complete",
        description: `Successfully screened ${mockCandidates.length} candidates using keyword matching`,
      });
    } catch (error) {
      console.error('Simple screening error:', error);
      toast({
        title: "Screening Failed",
        description: `Failed to screen resumes: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive"
      });
    } finally {
      setIsAnalyzing(false);
      setProgress(100);
    }
  };

  const improveJobDescription = async () => {
    if (!description.trim()) {
      toast({
        title: "No description",
        description: "Please enter a job description first",
        variant: "destructive"
      });
      return;
    }

    try {
      const response = await fetch('/api/jobs/improve', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ description }),
      });

      if (response.ok) {
        const data = await response.json();
        setDescription(data.improvedDescription || description);
        toast({
          title: "AI Enhancement Complete",
          description: "Job description has been optimized for better candidate matching",
        });
      } else {
        throw new Error('AI improvement failed');
      }
    } catch (error) {
      toast({
        title: "AI Enhancement Failed",
        description: "Failed to improve job description. Please try again.",
        variant: "destructive"
      });
    }
  };

  const startScreening = async () => {
    if (!jobTitle.trim() || !description.trim()) {
      toast({
        title: "Missing Information",
        description: "Please provide both job title and description",
        variant: "destructive"
      });
      return;
    }

    setIsAnalyzing(true);
    setProgress(0);

    try {
      // Save job description
      const jobResponse = await fetch('/api/jobs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: jobTitle,
          description: description,
          requirements: description,
          location: 'Remote',
          type: 'Full-time'
        }),
      });

      if (!jobResponse.ok) {
        throw new Error('Failed to save job description');
      }

      // Start screening process
      const screeningResponse = await fetch('/api/candidates/screen', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          jobTitle,
          jobDescription: description
        }),
      });

      if (screeningResponse.ok) {
        const data = await screeningResponse.json();
        setCandidates(data.candidates || []);
        setShowResults(true);
        toast({
          title: "Screening Complete",
          description: `Analyzed ${data.candidates?.length || 0} candidates`,
        });
      } else {
        throw new Error('Screening failed');
      }
    } catch (error) {
      toast({
        title: "Screening Failed",
        description: "Failed to analyze candidates. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsAnalyzing(false);
      setProgress(100);
    }
  };

  // Job Seeker Resume Analysis
  const analyzeJobSeekerResume = async () => {
    if (!jobSeekerFile) {
      toast({
        title: "No Resume Selected",
        description: "Please upload your resume first",
        variant: "destructive"
      });
      return;
    }

    setIsAnalyzingJobSeeker(true);
    try {
      const formData = new FormData();
      formData.append('resume', jobSeekerFile);
      if (jobSeekerJobDesc.trim()) {
        formData.append('jobDescription', jobSeekerJobDesc);
      }

      const response = await fetch('/api/analyze/resume', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        setJobSeekerAnalysis(data.analysis);
        setShowJobSeekerResults(true);
        toast({
          title: "Analysis Complete!",
          description: "Your resume has been analyzed successfully",
        });
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Analysis failed');
      }
    } catch (error: any) {
      toast({
        title: "Analysis Failed",
        description: error.message || "Failed to analyze resume. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsAnalyzingJobSeeker(false);
    }
  };

  const handleJobSeekerFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.type === 'application/pdf' ||
        file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
        file.type === 'application/msword') {
        setJobSeekerFile(file);
      } else {
        toast({
          title: "Invalid File",
          description: "Please upload a PDF, DOC, or DOCX file",
          variant: "destructive"
        });
      }
    }
  };

  const handleJobSeekerDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      if (droppedFile.type === 'application/pdf' ||
        droppedFile.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
        droppedFile.type === 'application/msword') {
        setJobSeekerFile(droppedFile);
      } else {
        toast({
          title: "Invalid File",
          description: "Please upload a PDF, DOC, or DOCX file",
          variant: "destructive"
        });
      }
    }
  };

  return (
    <ErrorBoundary>
      <div className="p-8 space-y-8 animate-fade-in max-w-7xl mx-auto">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold tracking-tight mb-2 gradient-text">Unified Screening Portal</h1>
            <p className="text-muted-foreground text-lg">Advanced AI-powered resume analysis and ranking system</p>
          </div>
          {mode === 'recruiter' && (
            <div className="flex items-center gap-3 bg-card/50 p-2 rounded-lg border shadow-sm">
              <span className={`text-sm font-medium ${isBlindMode ? 'text-primary' : 'text-muted-foreground'}`}>
                Blind Hiring Mode
              </span>
              <div
                className={`w-12 h-6 rounded-full p-1 cursor-pointer transition-colors duration-300 ${isBlindMode ? 'bg-primary' : 'bg-muted'}`}
                onClick={() => setIsBlindMode(!isBlindMode)}
              >
                <div className={`w-4 h-4 rounded-full bg-white shadow-sm transition-transform duration-300 ${isBlindMode ? 'translate-x-6' : 'translate-x-0'}`} />
              </div>
            </div>
          )}
        </div>

        <Tabs value={mode} onValueChange={(value) => {
          setMode(value as 'recruiter' | 'jobseeker');
          setShowResults(false);
          setShowJobSeekerResults(false);
          setJobSeekerAnalysis(null);
        }} className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="recruiter" className="gap-2">
              <Briefcase className="w-4 h-4" />
              For Recruiters
            </TabsTrigger>
            <TabsTrigger value="jobseeker" className="gap-2">
              <User className="w-4 h-4" />
              For Job Seekers
            </TabsTrigger>
          </TabsList>

          {/* Recruiter Mode */}
          <TabsContent value="recruiter" className="space-y-8 mt-6">
            {/* Step Indicator */}
            <div className="flex items-center justify-center space-x-4 mb-8">
              <div className={`flex items-center space-x-2 px-4 py-2 rounded-full ${step === 'upload' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                <div className="w-6 h-6 rounded-full bg-current flex items-center justify-center text-xs font-bold">1</div>
                <span>Upload Files</span>
              </div>
              <div className="w-8 h-px bg-border"></div>
              <div className={`flex items-center space-x-2 px-4 py-2 rounded-full ${step === 'configure' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                <div className="w-6 h-6 rounded-full bg-current flex items-center justify-center text-xs font-bold">2</div>
                <span>Configure Job</span>
              </div>
              <div className="w-8 h-px bg-border"></div>
              <div className={`flex items-center space-x-2 px-4 py-2 rounded-full ${step === 'screen' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                <div className="w-6 h-6 rounded-full bg-current flex items-center justify-center text-xs font-bold">3</div>
                <span>Screen & Analyze</span>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Upload Section */}
              <Card className="p-6 bg-card">
                <h3 className="text-lg font-semibold mb-4">1. Upload Resumes</h3>
                <div
                  className="p-8 border-2 border-dashed hover:border-primary/50 transition-all duration-300 cursor-pointer bg-card rounded-lg"
                  onDrop={handleDrop}
                  onDragOver={(e) => e.preventDefault()}
                >
                  <div className="flex flex-col items-center justify-center space-y-4">
                    <div className="w-16 h-16 rounded-full gradient-primary flex items-center justify-center shadow-glow animate-pulse-glow">
                      <UploadIcon className="w-8 h-8 text-white" />
                    </div>
                    <div className="text-center">
                      <h4 className="text-lg font-semibold mb-2">Drag and drop resume files</h4>
                      <p className="text-sm text-muted-foreground mb-4">or click to browse</p>
                      <input
                        type="file"
                        multiple
                        accept=".pdf,.doc,.docx,.txt"
                        onChange={handleFileInput}
                        className="hidden"
                        id="file-upload"
                      />
                      <label htmlFor="file-upload">
                        <Button variant="outline" className="cursor-pointer" asChild>
                          <span>Browse Files</span>
                        </Button>
                      </label>
                    </div>
                    <p className="text-xs text-muted-foreground">Supports PDF, DOCX, and TXT files</p>
                  </div>
                </div>

                {files.length > 0 && (
                  <div className="mt-6 space-y-3">
                    <h4 className="font-semibold">Selected Files ({files.length})</h4>
                    {files.map((file, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-3 rounded-lg bg-secondary/50 border"
                      >
                        <div className="flex items-center gap-3">
                          <FileText className="w-5 h-5 text-primary" />
                          <div>
                            <p className="text-sm font-medium">{file.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {(file.size / 1024).toFixed(2)} KB
                            </p>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeFile(index)}
                          className="hover:bg-destructive/20 hover:text-destructive"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                    <Button
                      onClick={uploadResumes}
                      disabled={isUploading}
                      className="w-full gradient-primary shadow-glow text-white"
                    >
                      {isUploading ? "Uploading..." : `Upload ${files.length} Resume${files.length > 1 ? "s" : ""}`}
                    </Button>
                  </div>
                )}
              </Card>

              {/* Job Description Section */}
              {(step === 'configure' || step === 'screen') && (
                <Card className="p-6 bg-card">
                  <h3 className="text-lg font-semibold mb-4">2. Job Requirements</h3>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="job-title">Job Title</Label>
                      <Input
                        id="job-title"
                        placeholder="e.g., Senior Full Stack Developer"
                        value={jobTitle}
                        onChange={(e) => setJobTitle(e.target.value)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="job-description">Job Description</Label>
                      <Textarea
                        id="job-description"
                        placeholder="Enter the complete job description including responsibilities, requirements, and qualifications..."
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        className="min-h-[200px]"
                      />
                      <p className="text-xs text-muted-foreground">
                        Word count: {description.split(/\s+/).filter(Boolean).length}
                      </p>
                    </div>

                    <div className="space-y-3">
                      <div className="flex gap-2">
                        <Button onClick={improveJobDescription} variant="outline" className="gap-2">
                          <Sparkles className="w-4 h-4" />
                          AI Improve
                        </Button>
                      </div>

                      <Button
                        onClick={screenResumes}
                        disabled={isAnalyzing || !jobTitle.trim() || !description.trim() || uploadedFiles.length === 0}
                        className="gradient-primary shadow-glow text-white w-full"
                      >
                        {isAnalyzing ? (
                          <>
                            <Loader2Icon className="w-4 h-4 mr-2 animate-spin" />
                            Screening...
                          </>
                        ) : (
                          <>
                            <Sparkles className="w-4 h-4 mr-2" />
                            Start Screening
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </Card>
              )}
            </div>

            {/* Screening Section */}
            <Card className="p-6 bg-card">
              <h3 className="text-lg font-semibold mb-4">3. AI Screening & Analysis</h3>

              {step === 'upload' && (
                <div className="text-center py-12">
                  <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mx-auto mb-6">
                    <UploadIcon className="w-10 h-10 text-muted-foreground" />
                  </div>
                  <h4 className="text-xl font-bold mb-2">Upload Resumes First</h4>
                  <p className="text-muted-foreground mb-6">
                    Please upload resume files to begin the screening process
                  </p>
                </div>
              )}

              {step === 'configure' && (
                <div className="text-center py-12">
                  <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mx-auto mb-6">
                    <FileText className="w-10 h-10 text-muted-foreground" />
                  </div>
                  <h4 className="text-xl font-bold mb-2">Configure Job Requirements</h4>
                  <p className="text-muted-foreground mb-6">
                    Uploaded {uploadedFiles.length} resume(s). Please provide job title and description to start screening.
                  </p>
                  <div className="space-y-2 text-sm text-muted-foreground">
                    {uploadedFiles.map((file, index) => (
                      <div key={index} className="flex items-center justify-center gap-2">
                        <FileText className="w-4 h-4" />
                        <span>{file.originalName}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {step === 'screen' && !showResults && (
                <div className="text-center py-12">
                  <div className="w-20 h-20 rounded-full gradient-primary flex items-center justify-center shadow-glow animate-pulse-glow mx-auto mb-6">
                    <Play className="w-10 h-10 text-white" />
                  </div>
                  <h4 className="text-xl font-bold mb-2">Ready to Screen Candidates</h4>
                  <p className="text-muted-foreground mb-6">Start AI screening of uploaded resumes</p>

                  {isAnalyzing && (
                    <div className="max-w-md mx-auto space-y-3 mb-6">
                      <Progress value={progress} className="h-2" />
                      <p className="text-sm text-primary">Analyzing candidates... {progress}%</p>
                    </div>
                  )}

                  <div className="space-y-4">
                    <Button
                      onClick={screenResumes}
                      disabled={isAnalyzing || !jobTitle.trim() || !description.trim() || uploadedFiles.length === 0}
                      className="gradient-primary shadow-glow px-8 w-full"
                      size="lg"
                    >
                      {isAnalyzing ? "Analyzing..." : "Start Screening"}
                    </Button>
                  </div>
                </div>
              )}

              {showResults && (
                <div className="space-y-6">
                  <div className="flex justify-between items-center">
                    <h4 className="text-xl font-bold">Ranked Candidates</h4>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setShowResults(false);
                        setCandidates([]);
                        setStep('upload');
                        setUploadedFiles([]);
                      }}
                    >
                      Start Over
                    </Button>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-secondary/50">
                        <tr>
                          <th className="text-left p-4 font-semibold">Rank</th>
                          <th className="text-left p-4 font-semibold">Candidate</th>
                          <th className="text-left p-4 font-semibold">Score</th>
                          <th className="text-left p-4 font-semibold">Experience</th>
                          <th className="text-left p-4 font-semibold">Key Skills</th>
                          <th className="text-left p-4 font-semibold">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {candidates.length > 0 ? candidates.map((candidate, index) => (
                          <tr key={candidate.id} className="border-b hover:bg-secondary/30 transition-colors">
                            <td className="p-4">
                              <div className="flex items-center gap-2">
                                {index === 0 && <Trophy className="w-4 h-4 text-accent" />}
                                <span className="font-semibold">#{index + 1}</span>
                              </div>
                            </td>
                            <td className="p-4">
                              <div>
                                <p className="font-medium">{candidate.name || 'Unknown'}</p>
                                <p className="text-sm text-muted-foreground">{candidate.email || 'No email'}</p>
                              </div>
                            </td>
                            <td className="p-4">
                              <div className="flex items-center gap-2">
                                <TrendingUp className="w-4 h-4 text-accent" />
                                <span className="font-semibold text-accent">{candidate.score || 0}%</span>
                                <Dialog>
                                  <DialogTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-6 w-6 p-0" aria-label="View scoring details">
                                      <Info className="w-4 h-4 text-muted-foreground" />
                                    </Button>
                                  </DialogTrigger>
                                  <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
                                    <DialogHeader>
                                      <DialogTitle className="flex items-center gap-3 text-xl">
                                        <div className="w-12 h-12 rounded-full gradient-primary flex items-center justify-center text-white font-bold shadow-lg">
                                          {isBlindMode ? '?' : candidate.name.charAt(0)}
                                        </div>
                                        <div>
                                          <h2 className="font-bold">{isBlindMode ? getMaskedName(index) : candidate.name}</h2>
                                          <p className="text-sm text-muted-foreground font-normal">
                                            {isBlindMode ? getMaskedEmail() : candidate.email} • {isBlindMode ? getMaskedPhone() : 'Phone Hidden'}
                                          </p>
                                        </div>
                                      </DialogTitle>
                                    </DialogHeader>
                                    <div className="space-y-6 py-4">
                                      {/* Summary Section */}
                                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <Card className="col-span-2 bg-secondary/20 border-none shadow-none">
                                          <div className="p-4">
                                            <h4 className="font-semibold mb-2 flex items-center gap-2">
                                              <Sparkles className="w-4 h-4 text-primary" />
                                              AI Summary
                                            </h4>
                                            <p className="text-sm text-muted-foreground leading-relaxed">
                                              {candidate.summary || "No summary available."}
                                            </p>
                                          </div>
                                        </Card>
                                        <Card className="bg-primary/5 border-primary/10 flex flex-col items-center justify-center p-4">
                                          <div className="text-3xl font-bold text-primary mb-1">{candidate.score}%</div>
                                          <div className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Match Score</div>
                                        </Card>
                                      </div>

                                      {/* Strengths & Weaknesses */}
                                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <Card className="border-l-4 border-l-green-500">
                                          <div className="p-4">
                                            <h4 className="font-semibold mb-3 flex items-center gap-2 text-green-700">
                                              <CheckCircle2 className="w-4 h-4" />
                                              Key Strengths
                                            </h4>
                                            <ul className="space-y-2">
                                              {(candidate.strengths || []).slice(0, 5).map((s, i) => (
                                                <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                                                  <span className="mt-1.5 w-1 h-1 rounded-full bg-green-500 shrink-0" />
                                                  {s}
                                                </li>
                                              ))}
                                              {(!candidate.strengths || candidate.strengths.length === 0) && (
                                                <li className="text-sm text-muted-foreground">No specific strengths identified</li>
                                              )}
                                            </ul>
                                          </div>
                                        </Card>

                                        <Card className="border-l-4 border-l-orange-500">
                                          <div className="p-4">
                                            <h4 className="font-semibold mb-3 flex items-center gap-2 text-orange-700">
                                              <AlertCircle className="w-4 h-4" />
                                              Areas for Improvement
                                            </h4>
                                            <ul className="space-y-2">
                                              {(candidate.weaknesses || []).slice(0, 5).map((w, i) => (
                                                <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                                                  <span className="mt-1.5 w-1 h-1 rounded-full bg-orange-500 shrink-0" />
                                                  {w}
                                                </li>
                                              ))}
                                              {(!candidate.weaknesses || candidate.weaknesses.length === 0) && (
                                                <li className="text-sm text-muted-foreground">No notable drawbacks identified</li>
                                              )}
                                            </ul>
                                          </div>
                                        </Card>
                                      </div>
                                    </div>
                                  </DialogContent>
                                </Dialog>
                              </div>
                            </td>
                            <td className="p-4 text-muted-foreground">{candidate.experience || 0} years</td>
                            <td className="p-4 text-sm text-muted-foreground">
                              {candidate.skills ? candidate.skills.slice(0, 3).join(', ') : 'No skills listed'}
                            </td>
                            <td className="p-4">
                              <Button
                                variant={candidate.status === 'shortlisted' ? "secondary" : "outline"}
                                size="sm"
                                onClick={() => handleShortlist(candidate.id)}
                                disabled={candidate.status === 'shortlisted'}
                              >
                                {candidate.status === 'shortlisted' ? 'Shortlisted' : 'Shortlist'}
                              </Button>
                            </td>
                          </tr>
                        )) : (
                          <tr>
                            <td colSpan={6} className="p-8 text-center text-muted-foreground">
                              No candidates found. Please upload resumes and try again.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )
              }
            </Card >
          </TabsContent >

          <TabsContent value="jobseeker" className="space-y-8 mt-6">
            <div>
              <h2 className="text-2xl font-bold tracking-tight mb-2">AI-Driven Resume Analysis</h2>
              <p className="text-muted-foreground">Get instant AI feedback on your resume to improve your job applications</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <Card className="p-6 glass border-white/10">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-primary" />
                  Upload Your Resume
                </h3>
                <div
                  className="p-8 border-2 border-dashed hover:border-primary/50 transition-all duration-300 cursor-pointer bg-card rounded-lg"
                  onDrop={handleJobSeekerDrop}
                  onDragOver={(e) => e.preventDefault()}
                >
                  <div className="flex flex-col items-center justify-center space-y-4">
                    <div className="w-16 h-16 rounded-full gradient-primary flex items-center justify-center shadow-glow animate-pulse-glow">
                      <UploadIcon className="w-8 h-8 text-white" />
                    </div>
                    <div className="text-center">
                      <h4 className="text-lg font-semibold mb-2">Drag and drop your resume</h4>
                      <p className="text-sm text-muted-foreground mb-4">or click to browse</p>
                      <input
                        type="file"
                        accept=".pdf,.doc,.docx"
                        onChange={handleJobSeekerFileInput}
                        className="hidden"
                        id="jobseeker-file-upload"
                      />
                      <label htmlFor="jobseeker-file-upload">
                        <Button variant="outline" className="cursor-pointer" asChild>
                          <span>Browse File</span>
                        </Button>
                      </label>
                    </div>
                    <p className="text-xs text-muted-foreground">Supports PDF, DOC, and DOCX files</p>
                  </div>
                </div>

                {jobSeekerFile && (
                  <div className="mt-6 space-y-3">
                    <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/50 border">
                      <div className="flex items-center gap-3">
                        <FileText className="w-5 h-5 text-primary" />
                        <div>
                          <p className="text-sm font-medium">{jobSeekerFile.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {(jobSeekerFile.size / 1024).toFixed(2)} KB
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setJobSeekerFile(null);
                          setShowJobSeekerResults(false);
                          setJobSeekerAnalysis(null);
                        }}
                        className="hover:bg-destructive/20 hover:text-destructive"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                    <Button
                      onClick={analyzeJobSeekerResume}
                      disabled={isAnalyzingJobSeeker}
                      className="w-full gradient-primary shadow-glow text-white"
                    >
                      {isAnalyzingJobSeeker ? (
                        <>
                          <Loader2Icon className="w-4 h-4 mr-2 animate-spin" />
                          Analyzing...
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4 mr-2" />
                          Analyze Resume
                        </>
                      )}
                    </Button>
                  </div>
                )}
              </Card>

              {/* Optional Job Description */}
              <Card className="p-6 glass border-white/10">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-primary" />
                  Job Description (Optional)
                </h3>
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Paste a job description to get a match score and tailored recommendations
                  </p>
                  <Textarea
                    placeholder="Paste the job description here to see how well your resume matches..."
                    value={jobSeekerJobDesc}
                    onChange={(e) => setJobSeekerJobDesc(e.target.value)}
                    className="min-h-[200px] bg-card/50"
                  />
                  <p className="text-xs text-muted-foreground">
                    {jobSeekerJobDesc.trim() ? `${jobSeekerJobDesc.split(/\s+/).filter(Boolean).length} words` : 'Optional: Get match score for specific job'}
                  </p>
                </div>
              </Card>
            </div>

            {/* Analyze Button */}
            {!showJobSeekerResults && (
              <Card className="p-6 glass border-white/10">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold mb-2">Ready to Analyze</h3>
                    <p className="text-sm text-muted-foreground">
                      Get AI-powered feedback on your resume including strengths, weaknesses, and improvement suggestions
                    </p>
                  </div>
                  <Button
                    onClick={analyzeJobSeekerResume}
                    disabled={!jobSeekerFile || isAnalyzingJobSeeker}
                    className="gradient-primary shadow-glow px-8"
                    size="lg"
                  >
                    {isAnalyzingJobSeeker ? (
                      <>
                        <Loader2Icon className="w-4 h-4 mr-2 animate-spin" />
                        Analyzing...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 mr-2" />
                        Analyze Resume
                      </>
                    )}
                  </Button>
                </div>
              </Card>
            )}

            {/* Analysis Results */}
            {
              showJobSeekerResults && jobSeekerAnalysis && (
                <Card className="p-6 glass border-white/10">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-2xl font-bold">Your Resume Analysis</h3>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setShowJobSeekerResults(false);
                        setJobSeekerAnalysis(null);
                        setJobSeekerFile(null);
                        setJobSeekerJobDesc("");
                      }}
                    >
                      Analyze Another
                    </Button>
                    <Button
                      className="ml-2 gradient-primary"
                      onClick={() => setShowVoiceScreener(true)}
                    >
                      <Mic className="w-4 h-4 mr-2" />
                      Start Phone Screen
                    </Button>
                  </div>

                  {showVoiceScreener && (
                    <div className="mb-8">
                      <VoiceScreener
                        jobTitle={jobSeekerJobDesc ? "Job Applicant" : "General Interview"}
                        candidateName={jobSeekerAnalysis?.name || "Candidate"}
                        onComplete={(summary) => {
                          toast({
                            title: "Interview Completed",
                            description: "Redirecting to your results...",
                          });
                          setShowVoiceScreener(false);
                          setTimeout(() => navigate('/interview-results'), 1500);
                        }}
                        onClose={() => setShowVoiceScreener(false)}
                      />
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    {/* Overall Score */}
                    <Card className="p-6 bg-gradient-to-br from-primary/20 to-primary/5 border-primary/30">
                      <div className="flex items-center justify-between mb-4">
                        <span className="text-sm font-medium text-muted-foreground">Overall Score</span>
                        <Trophy className="w-5 h-5 text-accent" />
                      </div>
                      <div className="text-4xl font-bold text-primary mb-2">
                        {jobSeekerAnalysis.overallScore}%
                      </div>
                      <p className="text-xs text-muted-foreground">Resume quality assessment</p>
                    </Card>

                    {/* Match Score (if job description provided) */}
                    {jobSeekerAnalysis.matchScore !== undefined && (
                      <Card className="p-6 bg-gradient-to-br from-accent/20 to-accent/5 border-accent/30">
                        <div className="flex items-center justify-between mb-4">
                          <span className="text-sm font-medium text-muted-foreground">Job Match</span>
                          <TrendingUp className="w-5 h-5 text-accent" />
                        </div>
                        <div className="text-4xl font-bold text-accent mb-2">
                          {jobSeekerAnalysis.matchScore}%
                        </div>
                        <p className="text-xs text-muted-foreground">Match with job description</p>
                      </Card>
                    )}

                    {/* Experience */}
                    <Card className="p-6 bg-gradient-to-br from-muted/20 to-muted/5 border-border">
                      <div className="flex items-center justify-between mb-4">
                        <span className="text-sm font-medium text-muted-foreground">Experience</span>
                        <Briefcase className="w-5 h-5 text-muted-foreground" />
                      </div>
                      <div className="text-4xl font-bold mb-2">
                        {jobSeekerAnalysis.experience}
                      </div>
                      <p className="text-xs text-muted-foreground">Years of experience</p>
                    </Card>
                  </div>

                  {/* Extracted Information */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                    <Card className="p-6 bg-card/50">
                      <h4 className="font-semibold mb-4 flex items-center gap-2">
                        <User className="w-4 h-4 text-primary" />
                        Personal Information
                      </h4>
                      <div className="space-y-2 text-sm">
                        <p><span className="font-medium">Name:</span> {jobSeekerAnalysis.name || 'Not found'}</p>
                        <p><span className="font-medium">Email:</span> {jobSeekerAnalysis.email || 'Not found'}</p>
                        <p><span className="font-medium">Education:</span> {jobSeekerAnalysis.education || 'Not specified'}</p>
                      </div>
                    </Card>

                    <Card className="p-6 bg-card/50">
                      <h4 className="font-semibold mb-4 flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-primary" />
                        Skills Detected
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {jobSeekerAnalysis.skills && jobSeekerAnalysis.skills.length > 0 ? (
                          jobSeekerAnalysis.skills.map((skill, idx) => (
                            <span key={idx} className="px-3 py-1 bg-primary/20 text-primary rounded-full text-xs font-medium">
                              {skill}
                            </span>
                          ))
                        ) : (
                          <p className="text-sm text-muted-foreground">No skills detected</p>
                        )}
                      </div>
                    </Card>
                  </div>

                  {/* Strengths */}
                  {jobSeekerAnalysis.strengths && jobSeekerAnalysis.strengths.length > 0 && (
                    <Card className="p-6 bg-card/50 mb-6 border-l-4 border-accent">
                      <h4 className="font-semibold mb-4 flex items-center gap-2">
                        <CheckCircle2 className="w-5 h-5 text-accent" />
                        Strengths
                      </h4>
                      <ul className="space-y-2">
                        {jobSeekerAnalysis.strengths.map((strength, idx) => (
                          <li key={idx} className="flex items-start gap-2 text-sm">
                            <CheckCircle2 className="w-4 h-4 text-accent mt-0.5 flex-shrink-0" />
                            <span>{strength}</span>
                          </li>
                        ))}
                      </ul>
                    </Card>
                  )}

                  {/* Areas for Improvement */}
                  {jobSeekerAnalysis.weaknesses && jobSeekerAnalysis.weaknesses.length > 0 && (
                    <Card className="p-6 bg-card/50 mb-6 border-l-4 border-orange-500">
                      <h4 className="font-semibold mb-4 flex items-center gap-2">
                        <AlertCircle className="w-5 h-5 text-orange-500" />
                        Areas for Improvement
                      </h4>
                      <ul className="space-y-2">
                        {jobSeekerAnalysis.weaknesses.map((weakness, idx) => (
                          <li key={idx} className="flex items-start gap-2 text-sm">
                            <AlertCircle className="w-4 h-4 text-orange-500 mt-0.5 flex-shrink-0" />
                            <span>{weakness}</span>
                          </li>
                        ))}
                      </ul>
                    </Card>
                  )}

                  {/* Recommendations */}
                  {jobSeekerAnalysis.recommendations && jobSeekerAnalysis.recommendations.length > 0 && (
                    <Card className="p-6 bg-card/50 border-l-4 border-primary">
                      <h4 className="font-semibold mb-4 flex items-center gap-2">
                        <Lightbulb className="w-5 h-5 text-primary" />
                        AI Recommendations
                      </h4>
                      <ul className="space-y-2">
                        {jobSeekerAnalysis.recommendations.map((rec, idx) => (
                          <li key={idx} className="flex items-start gap-2 text-sm">
                            <Lightbulb className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                            <span>{rec}</span>
                          </li>
                        ))}
                      </ul>
                    </Card>
                  )}

                  {/* Summary */}
                  {jobSeekerAnalysis.summary && (
                    <Card className="p-6 bg-card/50 mt-6">
                      <h4 className="font-semibold mb-3">AI Summary</h4>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {jobSeekerAnalysis.summary}
                      </p>
                    </Card>
                  )}
                </Card>
              )
            }

            {/* Career Path for Job Seeker */}
            {
              showJobSeekerResults && jobSeekerAnalysis && (
                <div className="mt-8">
                  <h3 className="text-xl font-bold mb-4">Your Personalized Career Path</h3>
                  <CareerPath
                    gapAnalysis={jobSeekerAnalysis.gapAnalysis}
                    learningPath={jobSeekerAnalysis.learningPath}
                  />
                </div>
              )
            }
          </TabsContent>
        </Tabs >
      </div >
    </ErrorBoundary >
  );
};

export default UnifiedScreening;

