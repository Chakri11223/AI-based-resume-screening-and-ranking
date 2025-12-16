import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle } from "lucide-react";

const Skills = () => {
  const requiredSkills = [
    { name: "React", count: 89, required: true },
    { name: "TypeScript", count: 76, required: true },
    { name: "Node.js", count: 82, required: true },
    { name: "Python", count: 45, required: false },
    { name: "AWS", count: 62, required: true },
    { name: "Docker", count: 71, required: false },
    { name: "MongoDB", count: 54, required: false },
    { name: "GraphQL", count: 38, required: false },
  ];

  return (
    <div className="p-8 space-y-8 animate-fade-in max-w-6xl">
      <div>
        <h1 className="text-3xl font-bold tracking-tight mb-2">Skill Insights</h1>
        <p className="text-muted-foreground">Analyze skill distribution across candidates</p>
      </div>

      <Card className="p-6 glass border-white/10">
        <h3 className="text-lg font-semibold mb-6">Skill Coverage</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {requiredSkills.map((skill) => (
            <div
              key={skill.name}
              className="p-4 rounded-lg bg-card/50 border border-white/5 hover:border-primary/20 transition-all"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{skill.name}</span>
                  {skill.required && (
                    <Badge variant="outline" className="text-xs">Required</Badge>
                  )}
                </div>
                {skill.count > 50 ? (
                  <CheckCircle className="w-5 h-5 text-accent" />
                ) : (
                  <XCircle className="w-5 h-5 text-destructive" />
                )}
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Candidates</span>
                  <span className="font-semibold">{skill.count}</span>
                </div>
                <div className="h-2 bg-card rounded-full overflow-hidden">
                  <div
                    className={`h-full ${
                      skill.count > 70
                        ? "bg-accent"
                        : skill.count > 50
                        ? "bg-primary"
                        : "bg-destructive"
                    } transition-all duration-500`}
                    style={{ width: `${(skill.count / 100) * 100}%` }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Card className="p-6 glass border-white/10">
        <h3 className="text-lg font-semibold mb-4">Skill Gaps</h3>
        <div className="space-y-3">
          <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/20">
            <h4 className="font-medium text-destructive mb-2">Critical Gap</h4>
            <p className="text-sm text-muted-foreground">
              Only 38% of candidates have GraphQL experience, but it's becoming essential for modern applications.
            </p>
          </div>
          <div className="p-4 rounded-lg bg-accent/10 border border-accent/20">
            <h4 className="font-medium text-accent mb-2">Strong Coverage</h4>
            <p className="text-sm text-muted-foreground">
              89% of candidates are proficient in React, exceeding our requirements.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default Skills;
