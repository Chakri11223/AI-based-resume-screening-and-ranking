import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Mic, MicOff, Play, Square, Volume2, Loader2 } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';

interface VoiceScreenerProps {
    candidateName: string;
    jobTitle: string;
    onComplete: (summary: string) => void;
    onClose: () => void;
}

interface Message {
    role: 'ai' | 'user';
    text: string;
}

const VoiceScreener: React.FC<VoiceScreenerProps> = ({ candidateName, jobTitle, onComplete, onClose }) => {
    const [isRecording, setIsRecording] = useState(false);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [transcript, setTranscript] = useState<Message[]>([]);
    const [currentQuestion, setCurrentQuestion] = useState('');
    const [questionCount, setQuestionCount] = useState(0);
    const questionCountRef = useRef(0);

    const recognitionRef = useRef<any>(null);
    const synthRef = useRef<SpeechSynthesis>(window.speechSynthesis);

    // Update ref when state changes
    useEffect(() => {
        questionCountRef.current = questionCount;
    }, [questionCount]);

    useEffect(() => {
        // Initialize Speech Recognition
        if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
            const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
            recognitionRef.current = new SpeechRecognition();
            recognitionRef.current.continuous = false;
            recognitionRef.current.interimResults = false;
            recognitionRef.current.lang = 'en-US';

            recognitionRef.current.onresult = (event: any) => {
                const text = event.results[0][0].transcript;
                handleUserAnswer(text);
            };

            recognitionRef.current.onerror = (event: any) => {
                console.error('Speech recognition error', event.error);
                setIsRecording(false);
                toast({
                    title: "Microphone Error",
                    description: "Could not hear you. Please try again.",
                    variant: "destructive"
                });
            };

            recognitionRef.current.onend = () => {
                setIsRecording(false);
            };
        } else {
            toast({
                title: "Not Supported",
                description: "Your browser does not support speech recognition. Please use Chrome or Edge.",
                variant: "destructive"
            });
        }

        // Start the interview
        startInterview();

        return () => {
            if (synthRef.current) {
                synthRef.current.cancel();
            }
        };
    }, []);

    const speak = (text: string, onEnd?: () => void) => {
        if (synthRef.current) {
            synthRef.current.cancel(); // Stop any previous speech
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.onstart = () => setIsSpeaking(true);
            utterance.onend = () => {
                setIsSpeaking(false);
                if (onEnd) onEnd();
            };
            synthRef.current.speak(utterance);
        }
    };

    const startInterview = async () => {
        const intro = `Hi ${candidateName}. I'm the AI recruiter for the ${jobTitle} position. I have just 3 quick questions for you. Are you ready?`;
        setTranscript([{ role: 'ai', text: intro }]);
        setCurrentQuestion(intro);
        speak(intro);
    };

    const startListening = () => {
        if (recognitionRef.current && !isSpeaking && !isProcessing) {
            try {
                recognitionRef.current.start();
                setIsRecording(true);
            } catch (e) {
                console.error(e);
            }
        }
    };

    const stopListening = () => {
        if (recognitionRef.current) {
            recognitionRef.current.stop();
            setIsRecording(false);
        }
    };

    const handleUserAnswer = async (answer: string) => {
        setTranscript(prev => [...prev, { role: 'user', text: answer }]);
        setIsProcessing(true);

        try {
            // Send to backend to get next question
            const currentCount = questionCountRef.current;
            const response = await fetch('/api/interview/process', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    history: [...transcript, { role: 'user', text: answer }],
                    candidateName,
                    jobTitle,
                    questionCount: currentCount
                })
            });

            const data = await response.json();

            if (data.isComplete) {
                const closing = "Thank you for your time. I've recorded your responses and will pass them to the hiring manager. Have a great day!";
                setTranscript(prev => [...prev, { role: 'ai', text: closing }]);
                setCurrentQuestion(closing);

                // Finalize in background
                try {
                    await fetch('/api/interview/finalize', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            history: [...transcript, { role: 'user', text: answer }, { role: 'ai', text: closing }],
                            candidateName,
                            jobTitle
                        })
                    });
                    toast({ title: "Interview Saved", description: "Results have been analyzed and stored." });
                } catch (err) {
                    console.error('Finalize error', err);
                }

                speak(closing, () => {
                    onComplete(data.summary);
                });
            } else {
                setTranscript(prev => [...prev, { role: 'ai', text: data.nextQuestion }]);
                setCurrentQuestion(data.nextQuestion);
                setQuestionCount(prev => prev + 1);
                speak(data.nextQuestion);
            }
        } catch (error) {
            console.error('Error processing interview:', error);
            toast({
                title: "Connection Error",
                description: "Failed to connect to the AI interviewer.",
                variant: "destructive"
            });
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <Card className="w-full max-w-2xl h-[600px] flex flex-col shadow-2xl border-primary/20 animate-in fade-in zoom-in duration-300">
                {/* Header */}
                <div className="p-6 border-b flex items-center justify-between bg-secondary/30">
                    <div className="flex items-center gap-3">
                        <div className={`w-3 h-3 rounded-full ${isRecording ? 'bg-red-500 animate-pulse' : 'bg-slate-300'}`} />
                        <div>
                            <h2 className="text-xl font-bold">AI Phone Screen</h2>
                            <p className="text-sm text-muted-foreground">Interviewing for {jobTitle}</p>
                        </div>
                    </div>
                    <Button variant="ghost" size="sm" onClick={onClose}>End Call</Button>
                </div>

                {/* Visualizer / Avatar */}
                <div className="flex-1 flex flex-col items-center justify-center p-8 bg-gradient-to-b from-background to-secondary/20 relative overflow-hidden">
                    <div className={`w-32 h-32 rounded-full flex items-center justify-center mb-6 transition-all duration-500 ${isSpeaking ? 'scale-110 shadow-[0_0_40px_rgba(var(--primary),0.5)]' : 'shadow-lg'}`}>
                        <div className="w-full h-full rounded-full bg-primary/10 flex items-center justify-center border-4 border-primary/20">
                            {isSpeaking ? (
                                <Volume2 className="w-12 h-12 text-primary animate-pulse" />
                            ) : (
                                <Mic className={`w-12 h-12 ${isRecording ? 'text-red-500' : 'text-muted-foreground'}`} />
                            )}
                        </div>
                    </div>

                    <div className="text-center max-w-md space-y-4">
                        {isSpeaking ? (
                            <p className="text-lg font-medium text-primary animate-pulse">AI Recruiter is speaking...</p>
                        ) : isRecording ? (
                            <p className="text-lg font-medium text-red-500 animate-pulse">Listening...</p>
                        ) : isProcessing ? (
                            <div className="flex items-center justify-center gap-2 text-muted-foreground">
                                <Loader2 className="w-4 h-4 animate-spin" />
                                <span>Thinking...</span>
                            </div>
                        ) : (
                            <p className="text-muted-foreground">Tap the microphone to answer</p>
                        )}

                        <p className="text-sm text-foreground/80 font-medium italic">
                            "{currentQuestion}"
                        </p>
                    </div>
                </div>

                {/* Controls */}
                <div className="p-6 border-t bg-card flex items-center justify-center gap-6">
                    <Button
                        size="lg"
                        variant={isRecording ? "destructive" : "default"}
                        className={`w-16 h-16 rounded-full shadow-lg transition-all duration-300 ${isRecording ? 'scale-110' : 'hover:scale-105'}`}
                        onClick={isRecording ? stopListening : startListening}
                        disabled={isSpeaking || isProcessing}
                    >
                        {isRecording ? (
                            <Square className="w-6 h-6 fill-current" />
                        ) : (
                            <Mic className="w-8 h-8" />
                        )}
                    </Button>
                </div>
            </Card>
        </div>
    );
};

export default VoiceScreener;
