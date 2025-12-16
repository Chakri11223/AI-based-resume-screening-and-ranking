import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, BookOpen, Clock, AlertTriangle, ExternalLink } from "lucide-react";

interface CareerPathProps {
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

export const CareerPath = ({ gapAnalysis, learningPath }: CareerPathProps) => {
    if ((!gapAnalysis || (!gapAnalysis.missingSkills.length && !gapAnalysis.experienceGaps.length)) &&
        (!learningPath || learningPath.length === 0)) {
        return null;
    }

    return (
        <div className="space-y-6 animate-fade-in">
            {gapAnalysis && (gapAnalysis.missingSkills.length > 0 || gapAnalysis.experienceGaps.length > 0) && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Card className="bg-red-50/50 border-red-100 shadow-sm">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-red-600 flex items-center gap-2">
                                <AlertTriangle className="w-4 h-4" />
                                Missing Skills
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex flex-wrap gap-2">
                                {gapAnalysis.missingSkills.map((skill, i) => (
                                    <span key={i} className="px-2 py-1 bg-white border border-red-200 rounded-md text-xs text-red-600 font-medium shadow-sm">
                                        {skill}
                                    </span>
                                ))}
                                {gapAnalysis.missingSkills.length === 0 && (
                                    <span className="text-sm text-muted-foreground">No critical skills missing</span>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-orange-50/50 border-orange-100 shadow-sm">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-orange-600 flex items-center gap-2">
                                <Clock className="w-4 h-4" />
                                Experience Gaps
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <ul className="text-sm space-y-2 text-orange-700">
                                {gapAnalysis.experienceGaps.map((gap, i) => (
                                    <li key={i} className="flex items-start gap-2">
                                        <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-orange-400 shrink-0" />
                                        <span>{gap}</span>
                                    </li>
                                ))}
                                {gapAnalysis.experienceGaps.length === 0 && (
                                    <li className="text-muted-foreground">Experience aligns with requirements</li>
                                )}
                            </ul>
                        </CardContent>
                    </Card>
                </div>
            )}

            {learningPath && learningPath.length > 0 && (
                <Card className="border-primary/10 shadow-md overflow-hidden">
                    <CardHeader className="bg-primary/5 border-b border-primary/10">
                        <CardTitle className="flex items-center gap-2 text-primary">
                            <BookOpen className="w-5 h-5" />
                            Recommended Learning Path
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6">
                        <div className="relative space-y-8 before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-primary/20 before:via-primary/20 before:to-transparent">
                            {learningPath.map((step, i) => (
                                <div key={i} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group">
                                    <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-white bg-primary text-primary-foreground shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10">
                                        <span className="font-bold text-sm">{i + 1}</span>
                                    </div>
                                    <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 rounded-xl border bg-card shadow-sm hover:shadow-md transition-shadow">
                                        <div className="flex items-center justify-between mb-2">
                                            <h4 className="font-bold text-foreground">{step.title}</h4>
                                            <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-primary/10 text-primary whitespace-nowrap">
                                                {step.estimatedTime}
                                            </span>
                                        </div>
                                        <p className="text-sm text-muted-foreground mb-3">{step.description}</p>
                                        {step.resources.length > 0 && (
                                            <div className="bg-secondary/30 rounded-lg p-3">
                                                <p className="text-xs font-semibold text-foreground/80 mb-2 flex items-center gap-1">
                                                    <ExternalLink className="w-3 h-3" />
                                                    Resources:
                                                </p>
                                                <ul className="text-xs space-y-1.5">
                                                    {step.resources.map((res, j) => (
                                                        <li key={j} className="flex items-start gap-2 text-blue-600 hover:underline cursor-pointer">
                                                            <span className="mt-1 w-1 h-1 rounded-full bg-blue-600 shrink-0" />
                                                            <a href={res.startsWith('http') ? res : `https://www.google.com/search?q=${encodeURIComponent(res)}`} target="_blank" rel="noopener noreferrer">
                                                                {res}
                                                            </a>
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
};
