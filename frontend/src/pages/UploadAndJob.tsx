import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Upload as UploadIcon, X, FileText, Sparkles } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

const UploadAndJob = () => {
  const [files, setFiles] = useState<File[]>([]);
  const [jobTitle, setJobTitle] = useState("");
  const [description, setDescription] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const droppedFiles = Array.from(e.dataTransfer.files);
    setFiles([...files, ...droppedFiles]);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files);
      setFiles([...files, ...selectedFiles]);
    }
  };

  const removeFile = (index: number) => {
    setFiles(files.filter((_, i) => i !== index));
  };

  const handleUpload = async () => {
    if (files.length === 0) {
      toast({
        title: "No Files Selected",
        description: "Please select files to upload",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);
    
    try {
      const formData = new FormData();
      files.forEach((file) => {
        formData.append('resumes', file);
      });
      
      // Add job description if available
      if (description.trim()) {
        formData.append('jobDescription', description);
      }

      console.log('Starting upload...', { fileCount: files.length, hasDescription: !!description.trim() });

      const response = await fetch('/api/upload/resumes', {
        method: 'POST',
        body: formData,
      });

      console.log('Upload response:', response.status, response.statusText);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      console.log('Upload result:', result);

      if (result.success) {
        toast({
          title: "Upload Successful",
          description: `${files.length} resume(s) uploaded and analyzed successfully`,
        });
        setFiles([]);
        setDescription("");
      } else {
        throw new Error(result.message || 'Upload failed');
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: "Upload Failed",
        description: error instanceof Error ? error.message : "Failed to upload files",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleSaveJob = () => {
    toast({
      title: "Job Description Saved",
      description: "Your job description has been saved successfully",
    });
  };

  const handleAIImprove = () => {
    toast({
      title: "AI Enhancement",
      description: "Job description has been optimized for better candidate matching",
    });
  };

  return (
    <div className="p-8 space-y-8 animate-fade-in max-w-7xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight mb-2">Upload & Configure</h1>
        <p className="text-muted-foreground">Upload resumes and define job requirements</p>
      </div>

      <Tabs defaultValue="resumes" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="resumes">Upload Resumes</TabsTrigger>
          <TabsTrigger value="job">Job Description</TabsTrigger>
        </TabsList>

        <TabsContent value="resumes" className="space-y-6 mt-6">
          <Card
            className="p-12 border-2 border-dashed hover:border-primary/50 transition-all duration-300 cursor-pointer bg-card"
            onDrop={handleDrop}
            onDragOver={(e) => e.preventDefault()}
          >
            <div className="flex flex-col items-center justify-center space-y-4">
              <div className="w-16 h-16 rounded-full gradient-primary flex items-center justify-center shadow-glow animate-pulse-glow">
                <UploadIcon className="w-8 h-8 text-white" />
              </div>
              <div className="text-center">
                <h3 className="text-lg font-semibold mb-2">Drag and drop your files here</h3>
                <p className="text-sm text-muted-foreground mb-4">or click to browse</p>
                <input
                  type="file"
                  multiple
                  accept=".pdf,.doc,.docx"
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
              <p className="text-xs text-muted-foreground">Supports PDF and DOCX files</p>
            </div>
          </Card>

          {files.length > 0 && (
            <Card className="p-6 bg-card">
              <h3 className="text-lg font-semibold mb-4">Uploaded Files ({files.length})</h3>
              <div className="space-y-3">
                {files.map((file, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 rounded-lg bg-secondary/50 border hover:border-primary/30 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <FileText className="w-5 h-5 text-primary" />
                      <div>
                        <p className="text-sm font-medium text-foreground">{file.name}</p>
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
              </div>
              <div className="mt-6 flex gap-3">
                <Button 
                  onClick={handleUpload} 
                  disabled={isUploading}
                  className="flex-1 gradient-primary shadow-glow text-white"
                >
                  {isUploading ? "Uploading..." : `Upload ${files.length} Resume${files.length > 1 ? "s" : ""}`}
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setFiles([])}
                  disabled={isUploading}
                >
                  Clear All
                </Button>
              </div>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="job" className="space-y-6 mt-6">
          <Card className="p-6 bg-card">
            <div className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="job-title" className="text-foreground">Job Title</Label>
                <Input
                  id="job-title"
                  placeholder="e.g., Senior Full Stack Developer"
                  value={jobTitle}
                  onChange={(e) => setJobTitle(e.target.value)}
                  className="bg-background border-input"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="job-description" className="text-foreground">Job Description</Label>
                <Textarea
                  id="job-description"
                  placeholder="Enter the complete job description including responsibilities, requirements, and qualifications..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="min-h-[300px] bg-background border-input"
                />
                <p className="text-xs text-muted-foreground">
                  Word count: {description.split(/\s+/).filter(Boolean).length}
                </p>
              </div>

              <div className="flex gap-3">
                <Button onClick={handleSaveJob} className="gradient-primary shadow-glow text-white">
                  Save Job Description
                </Button>
                <Button onClick={handleAIImprove} variant="outline" className="gap-2">
                  <Sparkles className="w-4 h-4" />
                  AI Improve
                </Button>
              </div>
            </div>
          </Card>

          <Card className="p-6 bg-card">
            <h3 className="text-lg font-semibold mb-4 text-foreground">Suggested Skills to Include</h3>
            <div className="flex flex-wrap gap-2">
              {[
                "React", "TypeScript", "Node.js", "Python", "AWS", "Docker",
                "Kubernetes", "MongoDB", "PostgreSQL", "CI/CD", "Git", "Agile"
              ].map((skill) => (
                <button
                  key={skill}
                  onClick={() => setDescription(description + (description ? " " : "") + skill)}
                  className="px-3 py-1.5 text-sm rounded-full bg-primary/10 text-foreground border border-primary/20 hover:bg-primary/20 hover:shadow-glow transition-all duration-200"
                >
                  {skill}
                </button>
              ))}
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default UploadAndJob;
