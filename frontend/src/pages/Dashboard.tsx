import { StatCard } from "@/components/StatCard";
import { FileText, Users, TrendingUp, CheckCircle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { useEffect, useState } from "react";

interface DashboardData {
  overview: {
    totalResumes: number;
    totalCandidates: number;
    averageScore: number;
    shortlistedCount: number;
    hiredCount: number;
  };
  scoreDistribution: Array<{ range: string; count: number }>;
  recentActivity: Array<{ action: string; candidate?: string; role?: string; candidates?: string; time: string }>;
}

const Dashboard = () => {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const response = await fetch('/api/dashboard');
        if (response.ok) {
          const data = await response.json();
          setDashboardData(data.data);
        }
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="p-8 space-y-8 animate-fade-in">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-2">Dashboard</h1>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  const data = dashboardData || {
    overview: { totalResumes: 0, totalCandidates: 0, averageScore: 0, shortlistedCount: 0, hiredCount: 0 },
    scoreDistribution: [],
    recentActivity: []
  };

  return (
    <div className="p-8 space-y-8 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold tracking-tight mb-2">Dashboard</h1>
        <p className="text-muted-foreground">Welcome to AI Resume Screening - Your intelligent hiring assistant</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Resumes"
          value={data.overview.totalResumes.toString()}
          icon={FileText}
          trend="+12% from last month"
        />
        <StatCard
          title="Candidates Ranked"
          value={data.overview.totalCandidates.toString()}
          icon={Users}
          trend="+8% from last week"
        />
        <StatCard
          title="Avg Match Score"
          value={`${data.overview.averageScore}%`}
          icon={TrendingUp}
          trend="+5% improvement"
        />
        <StatCard
          title="Shortlisted"
          value={data.overview.shortlistedCount.toString()}
          icon={CheckCircle}
          trend="Ready for interview"
        />
      </div>

      <Card className="p-6 glass border-white/10">
        <h3 className="text-lg font-semibold mb-4">Recent Activity</h3>
        <div className="space-y-4">
          {data.recentActivity.length > 0 ? (
            data.recentActivity.map((activity, index) => (
              <div key={index} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                <div>
                  <p className="text-sm font-medium">{activity.action}</p>
                  <p className="text-xs text-muted-foreground">
                    {activity.candidate || activity.role || activity.candidates}
                  </p>
                </div>
                <span className="text-xs text-muted-foreground">{activity.time}</span>
              </div>
            ))
          ) : (
            <p className="text-muted-foreground text-center py-4">No recent activity</p>
          )}
        </div>
      </Card>

      <Card className="p-6 glass border-white/10">
        <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button className="p-4 rounded-lg border border-primary/20 hover:border-primary hover:shadow-glow transition-all duration-200">
            <FileText className="w-8 h-8 text-primary mb-2" />
            <h4 className="font-medium mb-1">Upload Resumes</h4>
            <p className="text-xs text-muted-foreground">Add new candidate resumes</p>
          </button>
          <button className="p-4 rounded-lg border border-accent/20 hover:border-accent hover:shadow-accent-glow transition-all duration-200">
            <Users className="w-8 h-8 text-accent mb-2" />
            <h4 className="font-medium mb-1">Start Screening</h4>
            <p className="text-xs text-muted-foreground">Analyze and rank candidates</p>
          </button>
          <button className="p-4 rounded-lg border border-primary/20 hover:border-primary hover:shadow-glow transition-all duration-200">
            <CheckCircle className="w-8 h-8 text-primary mb-2" />
            <h4 className="font-medium mb-1">View Results</h4>
            <p className="text-xs text-muted-foreground">Check ranked candidates</p>
          </button>
        </div>
      </Card>
    </div>
  );
};

export default Dashboard;
