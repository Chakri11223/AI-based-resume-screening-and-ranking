import { Card } from "@/components/ui/card";
import { BarChart3, TrendingUp, Users } from "lucide-react";
import { useEffect, useState } from "react";

interface AnalyticsData {
  totalCandidates: number;
  averageScore: number;
  positionsFilled: number;
  scoreDistribution: Array<{
    range: string;
    count: number;
    color: string;
    percentage: number;
  }>;
  topSkills: Array<{
    skill: string;
    count: number;
  }>;
}

interface ShortlistedCandidate {
  id: string;
  name: string;
  score: number;
  experience: string;
  skills: string[];
}

const Analytics = () => {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [shortlistedCandidates, setShortlistedCandidates] = useState<ShortlistedCandidate[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const response = await fetch('/api/analytics');
        if (response.ok) {
          const result = await response.json();
          setAnalyticsData(result.data);
        }

        const shortlistedResponse = await fetch('/api/candidates/shortlisted');
        if (shortlistedResponse.ok) {
          const result = await shortlistedResponse.json();
          setShortlistedCandidates(result.data);
        }
      } catch (error) {
        console.error('Failed to fetch analytics:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
    // Refresh every 30 seconds
    const interval = setInterval(fetchAnalytics, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="p-8 space-y-8 animate-fade-in">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-2">Analytics</h1>
          <p className="text-muted-foreground">Loading insights...</p>
        </div>
      </div>
    );
  }

  const data = analyticsData || {
    totalCandidates: 0,
    averageScore: 0,
    positionsFilled: 0,
    scoreDistribution: [],
    topSkills: [],
  };

  return (
    <div className="p-8 space-y-8 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold tracking-tight mb-2">Analytics</h1>
        <p className="text-muted-foreground">Real-time insights into your hiring process</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6 glass border-white/10">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg gradient-primary flex items-center justify-center">
              <Users className="w-5 h-5 text-white" />
            </div>
            <h3 className="font-semibold">Total Candidates</h3>
          </div>
          <p className="text-3xl font-bold">{data.totalCandidates}</p>
          <p className="text-sm text-accent mt-2">Based on uploaded resumes</p>
        </Card>

        <Card className="p-6 glass border-white/10">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg gradient-accent flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-white" />
            </div>
            <h3 className="font-semibold">Avg Match Score</h3>
          </div>
          <p className="text-3xl font-bold">{data.averageScore}%</p>
          <p className="text-sm text-accent mt-2">Average across all candidates</p>
        </Card>

        <Card className="p-6 glass border-white/10">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg gradient-primary flex items-center justify-center">
              <BarChart3 className="w-5 h-5 text-white" />
            </div>
            <h3 className="font-semibold">Positions Filled</h3>
          </div>
          <p className="text-3xl font-bold">{data.positionsFilled}</p>
          <p className="text-sm text-accent mt-2">Candidates hired</p>
        </Card>
      </div>

      <Card className="p-6 glass border-white/10">
        <h3 className="text-lg font-semibold mb-6">Score Distribution</h3>
        <div className="space-y-4">
          {data.scoreDistribution.length > 0 ? (
            data.scoreDistribution.map((item) => (
              <div key={item.range} className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>{item.range}</span>
                  <span className="text-muted-foreground">{item.count} candidate{item.count !== 1 ? 's' : ''}</span>
                </div>
                <div className="h-3 bg-card/50 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${item.color} rounded-full transition-all duration-500`}
                    style={{ width: `${item.percentage}%` }}
                  />
                </div>
              </div>
            ))
          ) : (
            <p className="text-muted-foreground text-center py-8">No candidates uploaded yet</p>
          )}
        </div>
      </Card>

      {shortlistedCandidates.length > 0 && (
        <Card className="p-6 glass border-white/10">
          <h3 className="text-lg font-semibold mb-6">Shortlisted Candidates</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-secondary/50">
                <tr>
                  <th className="text-left p-4 font-semibold">Candidate</th>
                  <th className="text-left p-4 font-semibold">Score</th>
                  <th className="text-left p-4 font-semibold">Experience</th>
                  <th className="text-left p-4 font-semibold">Skills</th>
                </tr>
              </thead>
              <tbody>
                {shortlistedCandidates.map((candidate) => (
                  <tr key={candidate.id} className="border-b hover:bg-secondary/30 transition-colors">
                    <td className="p-4 font-medium">{candidate.name}</td>
                    <td className="p-4 text-accent font-semibold">{candidate.score}%</td>
                    <td className="p-4 text-muted-foreground">{candidate.experience}</td>
                    <td className="p-4 text-sm text-muted-foreground">
                      {candidate.skills.slice(0, 3).join(', ')}
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

export default Analytics;
