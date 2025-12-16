import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, Mail, Star } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useEffect, useState } from "react";

interface ShortlistedCandidate {
  id: string;
  name: string;
  score: number;
  experience: string;
  email: string;
  skills: string[];
}

const Shortlisted = () => {
  const { toast } = useToast();
  const [candidates, setCandidates] = useState<ShortlistedCandidate[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchShortlisted = async () => {
      try {
        const response = await fetch('/api/candidates/shortlisted');
        if (response.ok) {
          const result = await response.json();
          setCandidates(result.data || []);
        }
      } catch (error) {
        console.error('Failed to fetch shortlisted candidates:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchShortlisted();
    // Refresh every 30 seconds
    const interval = setInterval(fetchShortlisted, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleExport = () => {
    if (candidates.length === 0) {
      toast({
        title: "No Candidates",
        description: "No shortlisted candidates to export",
        variant: "destructive",
      });
      return;
    }

    // Create CSV content
    const csvContent = [
      ['Name', 'Email', 'Score', 'Experience', 'Skills'].join(','),
      ...candidates.map(c => [
        c.name,
        c.email,
        c.score,
        c.experience,
        c.skills.join('; ')
      ].join(','))
    ].join('\n');

    // Download CSV
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `shortlisted-candidates-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);

    toast({
      title: "Export Successful",
      description: "Shortlisted candidates exported to CSV",
    });
  };

  const handleEmail = (name: string) => {
    toast({
      title: "Email Sent",
      description: `Interview invitation sent to ${name}`,
    });
  };

  if (loading) {
    return (
      <div className="p-8 space-y-8 animate-fade-in max-w-6xl">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-2">Shortlisted Candidates</h1>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-8 animate-fade-in max-w-6xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-2">Shortlisted Candidates</h1>
          <p className="text-muted-foreground">
            {candidates.length > 0 
              ? `${candidates.length} candidate${candidates.length !== 1 ? 's' : ''} ready for interview`
              : 'No shortlisted candidates yet'}
          </p>
        </div>
        {candidates.length > 0 && (
          <Button onClick={handleExport} className="gradient-primary shadow-glow gap-2">
            <Download className="w-4 h-4" />
            Export All
          </Button>
        )}
      </div>

      {candidates.length === 0 ? (
        <Card className="p-12 text-center glass border-white/10">
          <Star className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
          <h3 className="text-xl font-semibold mb-2">No Shortlisted Candidates</h3>
          <p className="text-muted-foreground">
            Shortlist candidates from the screening results to see them here.
          </p>
        </Card>
      ) : (
        <div className="space-y-4">
          {candidates.map((candidate) => (
            <Card key={candidate.id} className="p-6 glass border-white/10 hover:border-primary/20 transition-all">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center">
                    <span className="text-xl font-semibold">
                      {candidate.name.split(' ').map(n => n[0]).join('')}
                    </span>
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-lg font-semibold">{candidate.name}</h3>
                      <Star className="w-5 h-5 text-accent fill-accent" />
                    </div>
                    <p className="text-sm text-muted-foreground">{candidate.email}</p>
                    <div className="flex items-center gap-4 mt-2">
                      <span className="text-sm">
                        <span className="text-muted-foreground">Score:</span>{" "}
                        <span className="text-accent font-semibold">{candidate.score}%</span>
                      </span>
                      <span className="text-sm text-muted-foreground">
                        {candidate.experience} experience
                      </span>
                      {candidate.skills.length > 0 && (
                        <span className="text-sm text-muted-foreground">
                          {candidate.skills.slice(0, 3).join(', ')}
                          {candidate.skills.length > 3 && '...'}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => handleEmail(candidate.name)}>
                    <Mail className="w-4 h-4 mr-2" />
                    Send Invite
                  </Button>
                  <Button className="gradient-primary">
                    View Resume
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default Shortlisted;
