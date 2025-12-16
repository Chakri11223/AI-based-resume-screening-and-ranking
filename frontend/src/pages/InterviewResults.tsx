
import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2, User, Trophy, Calendar } from 'lucide-react';

const InterviewResults = () => {
    const [candidates, setCandidates] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchResults();
    }, []);

    const fetchResults = async () => {
        try {
            const res = await fetch('/api/candidates?status=Phone Screened,shortlisted');
            const data = await res.json();
            if (data.success) {
                // Filter for candidates with interview scores and sort
                const sorted = (data.data || [])
                    .filter(c => c.interviewScore !== undefined && c.interviewScore !== null)
                    .sort((a, b) => (b.interviewScore || 0) - (a.interviewScore || 0));
                setCandidates(sorted);
            }
        } catch (error) {
            console.error('Failed to fetch results:', error);
        } finally {
            setLoading(false);
        }
    };

    const getScoreColor = (score) => {
        if (score >= 80) return "bg-green-100 text-green-800 hover:bg-green-100";
        if (score >= 60) return "bg-yellow-100 text-yellow-800 hover:bg-yellow-100";
        return "bg-red-100 text-red-800 hover:bg-red-100";
    };

    if (loading) {
        return (
            <div className="flex h-96 items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="container mx-auto p-6 space-y-8 animate-in fade-in duration-500">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Interview Results</h1>
                    <p className="text-muted-foreground mt-2">AI-graded performance of phone screen candidates.</p>
                </div>
                <Button onClick={fetchResults} variant="outline" size="sm">
                    Refresh
                </Button>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Interviews</CardTitle>
                        <User className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{candidates.length}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Average Score</CardTitle>
                        <Trophy className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {candidates.length > 0
                                ? Math.round(candidates.reduce((acc, c) => acc + (c.interviewScore || 0), 0) / candidates.length)
                                : 0}%
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Card className="shadow-lg">
                <CardHeader>
                    <CardTitle>Candidate Leaderboard</CardTitle>
                </CardHeader>
                <CardContent>
                    {candidates.length === 0 ? (
                        <div className="text-center py-10 text-muted-foreground">
                            No completed interviews found yet.
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Rank</TableHead>
                                    <TableHead>Candidate</TableHead>
                                    <TableHead>Role</TableHead>
                                    <TableHead>Date</TableHead>
                                    <TableHead>AI Summary</TableHead>
                                    <TableHead className="text-right">Score</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {candidates.map((candidate, index) => (
                                    <TableRow key={candidate.id || index} className="group hover:bg-muted/50 transition-colors">
                                        <TableCell className="font-medium text-muted-foreground">#{index + 1}</TableCell>
                                        <TableCell className="font-semibold text-primary">{candidate.name}</TableCell>
                                        <TableCell>{candidate.jobRole}</TableCell>
                                        <TableCell className="text-muted-foreground text-sm">
                                            <div className="flex items-center gap-1">
                                                <Calendar className="w-3 h-3" />
                                                {new Date(candidate.interviewDate || candidate.createdAt).toLocaleDateString()}
                                            </div>
                                        </TableCell>
                                        <TableCell className="max-w-md truncate text-muted-foreground" title={candidate.interviewSummary}>
                                            {candidate.interviewSummary || "No summary available"}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Badge variant="outline" className={`${getScoreColor(candidate.interviewScore || 0)} border-0 font-bold px-3 py-1 text-sm`}>
                                                {candidate.interviewScore || 0}%
                                            </Badge>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>
        </div>
    );
};

export default InterviewResults;
