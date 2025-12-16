import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sparkles, Trophy, TrendingUp } from "lucide-react";
import { useState } from "react";
import { Progress } from "@/components/ui/progress";

const mockCandidates = [
  { name: "Sarah Johnson", score: 94, experience: "5 years", skills: "React, TypeScript, AWS" },
  { name: "Michael Chen", score: 89, experience: "4 years", skills: "Node.js, Python, Docker" },
  { name: "Emily Rodriguez", score: 86, experience: "6 years", skills: "Full Stack, DevOps" },
  { name: "David Kim", score: 82, experience: "3 years", skills: "React, Node.js, MongoDB" },
  { name: "Lisa Anderson", score: 78, experience: "4 years", skills: "Frontend, UI/UX" },
];

const Screen = () => {
  const [isScanning, setIsScanning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [showResults, setShowResults] = useState(false);

  const handleStartScreening = () => {
    setIsScanning(true);
    setProgress(0);
    
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsScanning(false);
          setShowResults(true);
          return 100;
        }
        return prev + 10;
      });
    }, 300);
  };

  return (
    <div className="p-8 space-y-8 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold tracking-tight mb-2">Screen & Rank</h1>
        <p className="text-muted-foreground">AI-powered candidate screening and ranking</p>
      </div>

      {!showResults && (
        <Card className="p-12 glass border-white/10 text-center">
          <div className="flex flex-col items-center space-y-6 max-w-md mx-auto">
            <div className="w-20 h-20 rounded-full gradient-primary flex items-center justify-center shadow-glow animate-pulse-glow">
              <Sparkles className="w-10 h-10 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold mb-2">Ready to Screen Candidates</h2>
              <p className="text-muted-foreground">
                Our AI will analyze all uploaded resumes against your job description
              </p>
            </div>
            
            {isScanning && (
              <div className="w-full space-y-3">
                <Progress value={progress} className="h-2" />
                <p className="text-sm text-primary">Analyzing candidates... {progress}%</p>
              </div>
            )}
            
            <Button
              onClick={handleStartScreening}
              disabled={isScanning}
              className="gradient-primary shadow-glow px-8"
              size="lg"
            >
              {isScanning ? "Scanning..." : "Start AI Screening"}
            </Button>
          </div>
        </Card>
      )}

      {showResults && (
        <Card className="glass border-white/10 overflow-hidden">
          <div className="p-6 border-b border-white/10">
            <h2 className="text-xl font-bold">Ranked Candidates</h2>
            <p className="text-sm text-muted-foreground">Based on AI analysis and job requirements</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-card/50">
                <tr className="border-b border-white/10">
                  <th className="text-left p-4 font-semibold">Rank</th>
                  <th className="text-left p-4 font-semibold">Candidate</th>
                  <th className="text-left p-4 font-semibold">Score</th>
                  <th className="text-left p-4 font-semibold">Experience</th>
                  <th className="text-left p-4 font-semibold">Key Skills</th>
                  <th className="text-left p-4 font-semibold">Action</th>
                </tr>
              </thead>
              <tbody>
                {mockCandidates.map((candidate, index) => (
                  <tr key={index} className="border-b border-white/5 hover:bg-card/30 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        {index === 0 && <Trophy className="w-4 h-4 text-accent" />}
                        <span className="font-semibold">#{index + 1}</span>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                          <span className="text-sm font-semibold">
                            {candidate.name.split(' ').map(n => n[0]).join('')}
                          </span>
                        </div>
                        <span className="font-medium">{candidate.name}</span>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-accent" />
                        <span className="font-semibold text-accent">{candidate.score}%</span>
                      </div>
                    </td>
                    <td className="p-4 text-muted-foreground">{candidate.experience}</td>
                    <td className="p-4 text-sm text-muted-foreground max-w-xs truncate">
                      {candidate.skills}
                    </td>
                    <td className="p-4">
                      <Button variant="outline" size="sm">
                        Shortlist
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
};

export default Screen;
