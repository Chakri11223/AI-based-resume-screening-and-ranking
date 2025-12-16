import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Send, Sparkles, Bot, User, TrendingUp, Clock, Mic, MicOff, Volume2, VolumeX, FileText, MessageSquare, X, Award, BarChart3 } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";

interface Message {
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

interface InterviewSession {
  id: string;
  jobTitle: string;
  startTime: Date;
  messages: Message[];
  averageScore: number;
  totalQuestions: number;
}

const Interview = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "Hello! I'm your AI Interview Assistant. I can help you practice for your interview. What position are you interviewing for?",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [jobTitle, setJobTitle] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [resumeText, setResumeText] = useState("");
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [resumeAnalysis, setResumeAnalysis] = useState<any>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [candidateSkills, setCandidateSkills] = useState<string[]>([]);
  const [sessionStats, setSessionStats] = useState({
    averageScore: 0,
    totalQuestions: 0,
    totalResponses: 0,
  });
  const [isTyping, setIsTyping] = useState(false);
  const [showSetup, setShowSetup] = useState(true);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isVoiceEnabled, setIsVoiceEnabled] = useState(true);
  const [isVoiceSupported, setIsVoiceSupported] = useState(false);
  const [inputMode, setInputMode] = useState<'voice' | 'text'>('voice'); // Default to voice
  const [showReportCard, setShowReportCard] = useState(false);
  const [sessionStartTime] = useState(new Date());
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const recognitionRef = useRef<any>(null);
  const synthesisRef = useRef<SpeechSynthesis | null>(null);
  const handleSendFromVoiceRef = useRef<((transcript: string) => Promise<void>) | null>(null);
  const inputModeRef = useRef<'voice' | 'text'>('voice');
  const silenceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const finalTranscriptRef = useRef<string>('');
  const spokenMessagesRef = useRef<Set<number>>(new Set()); // Track which messages have been spoken
  const isSpeakingRef = useRef<boolean>(false); // Track if currently speaking
  
  // Keep ref in sync with state
  useEffect(() => {
    inputModeRef.current = inputMode;
  }, [inputMode]);
  const { toast } = useToast();

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Initialize Voice Recognition and Synthesis
  useEffect(() => {
    // Check for browser support
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const speechSynthesis = window.speechSynthesis;

    if (SpeechRecognition) {
      setIsVoiceSupported(true);
      const recognition = new SpeechRecognition();
      recognition.continuous = true; // Keep listening continuously
      recognition.interimResults = true; // Get interim results while speaking
      recognition.lang = 'en-US';
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        setIsListening(true);
        finalTranscriptRef.current = '';
        // Clear any existing timeout
        if (silenceTimeoutRef.current) {
          clearTimeout(silenceTimeoutRef.current);
          silenceTimeoutRef.current = null;
        }
      };

      recognition.onresult = (event: any) => {
        let interimTranscript = '';

        // Process all results
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscriptRef.current += transcript + ' ';
          } else {
            interimTranscript += transcript;
          }
        }

        // If we have final results, clear and reset the silence timeout
        if (finalTranscriptRef.current.trim()) {
          // Clear existing timeout
          if (silenceTimeoutRef.current) {
            clearTimeout(silenceTimeoutRef.current);
          }
          
          // Set a new timeout - wait 3 seconds of silence before ending
          silenceTimeoutRef.current = setTimeout(() => {
            if (finalTranscriptRef.current.trim() && handleSendFromVoiceRef.current) {
              // Stop recognition
              if (recognitionRef.current) {
                recognitionRef.current.stop();
              }
              setIsListening(false);
              // Send the final transcript
              const transcriptToSend = finalTranscriptRef.current.trim();
              finalTranscriptRef.current = ''; // Clear after sending
              handleSendFromVoiceRef.current(transcriptToSend);
            }
          }, 3000); // Wait 3 seconds of silence
        }
      };
      
      recognition.onend = () => {
        setIsListening(false);
        if (silenceTimeoutRef.current) {
          clearTimeout(silenceTimeoutRef.current);
          silenceTimeoutRef.current = null;
        }
        // If we have a final transcript that wasn't sent, send it now
        if (finalTranscriptRef.current.trim() && handleSendFromVoiceRef.current) {
          const transcriptToSend = finalTranscriptRef.current.trim();
          finalTranscriptRef.current = ''; // Clear after sending
          handleSendFromVoiceRef.current(transcriptToSend);
        }
      };

      recognition.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
        if (event.error !== 'aborted' && event.error !== 'no-speech') {
          toast({
            title: "Voice Input Error",
            description: event.error === 'not-allowed' 
              ? "Microphone permission denied. Please allow microphone access." 
              : "Could not process voice input. Please try typing instead.",
            variant: "destructive"
          });
        }
      };

      recognitionRef.current = recognition;
    }

    if (speechSynthesis) {
      synthesisRef.current = speechSynthesis;
    }

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {
          // Ignore errors when stopping
        }
      }
      if (synthesisRef.current) {
        synthesisRef.current.cancel();
      }
    };
  }, []);

  // Speak initial message if voice is enabled (only after setup is complete)
  useEffect(() => {
    if (isVoiceEnabled && synthesisRef.current && messages.length === 1 && isVoiceSupported && !showSetup) {
      const messageIndex = 0;
      // Only speak if not already spoken and not currently speaking
      if (!spokenMessagesRef.current.has(messageIndex) && !isSpeakingRef.current) {
        const utterance = new SpeechSynthesisUtterance(messages[0].content);
        utterance.rate = 1.3; // Faster speech rate
        utterance.pitch = 1;
        utterance.volume = 1;
        utterance.lang = 'en-US';
        utterance.onstart = () => {
          setIsSpeaking(true);
          isSpeakingRef.current = true;
          spokenMessagesRef.current.add(messageIndex);
        };
        utterance.onend = () => {
          setIsSpeaking(false);
          isSpeakingRef.current = false;
          // Do not auto-start listening - user must manually click to record
        };
        utterance.onerror = () => {
          setIsSpeaking(false);
          isSpeakingRef.current = false;
        };
        synthesisRef.current.speak(utterance);
      }
    }
  }, [isVoiceEnabled, isVoiceSupported, showSetup, messages.length]);

  // Speak AI responses automatically - only new assistant messages
  useEffect(() => {
    if (isVoiceEnabled && synthesisRef.current && messages.length > 1 && !isLoading) {
      const lastMessage = messages[messages.length - 1];
      const lastMessageIndex = messages.length - 1;
      
      // Only speak if:
      // 1. It's an assistant message
      // 2. It hasn't been spoken yet
      // 3. We're not currently speaking
      // 4. We're not listening (to avoid interrupting)
      if (
        lastMessage.role === 'assistant' && 
        !spokenMessagesRef.current.has(lastMessageIndex) && 
        !isSpeakingRef.current && 
        !isListening
      ) {
        // Cancel any ongoing speech (safety check)
        if (synthesisRef.current.speaking) {
          synthesisRef.current.cancel();
        }
        
        const utterance = new SpeechSynthesisUtterance(lastMessage.content);
        utterance.rate = 1.3; // Faster speech rate
        utterance.pitch = 1;
        utterance.volume = 1;
        utterance.lang = 'en-US';
        
        utterance.onstart = () => {
          setIsSpeaking(true);
          isSpeakingRef.current = true;
          spokenMessagesRef.current.add(lastMessageIndex);
        };
        
        utterance.onend = () => {
          setIsSpeaking(false);
          isSpeakingRef.current = false;
          // Do not auto-start listening - user must manually click to record
        };
        
        utterance.onerror = (event) => {
          console.error('Speech synthesis error:', event);
          setIsSpeaking(false);
          isSpeakingRef.current = false;
        };
        
        synthesisRef.current.speak(utterance);
      }
    }
  }, [messages.length, isVoiceEnabled, isLoading, isListening]); // Only depend on message count, not full messages array

  const startVoiceInput = () => {
    if (recognitionRef.current && !isListening && !isSpeaking) {
      try {
        // Clear any existing timeout
        if (silenceTimeoutRef.current) {
          clearTimeout(silenceTimeoutRef.current);
          silenceTimeoutRef.current = null;
        }
        finalTranscriptRef.current = '';
        recognitionRef.current.start();
      } catch (error: any) {
        console.error('Error starting voice recognition:', error);
        if (error.name === 'InvalidStateError') {
          // Already started, ignore
          return;
        }
        toast({
          title: "Voice Input Error",
          description: "Could not start voice recognition. Please try again.",
          variant: "destructive"
        });
      }
    }
  };

  const stopVoiceInput = () => {
    if (recognitionRef.current && isListening) {
      // Clear timeout
      if (silenceTimeoutRef.current) {
        clearTimeout(silenceTimeoutRef.current);
        silenceTimeoutRef.current = null;
      }
      recognitionRef.current.stop();
      setIsListening(false);
      
      // If we have a final transcript, send it immediately when user stops manually
      if (finalTranscriptRef.current.trim() && handleSendFromVoiceRef.current) {
        const transcriptToSend = finalTranscriptRef.current.trim();
        finalTranscriptRef.current = ''; // Clear after sending
        handleSendFromVoiceRef.current(transcriptToSend);
      }
    }
  };

  const toggleVoiceOutput = () => {
    setIsVoiceEnabled(prev => {
      const newValue = !prev;
      
      // Always cancel any ongoing speech when toggling
      if (synthesisRef.current) {
        synthesisRef.current.cancel();
        setIsSpeaking(false);
        isSpeakingRef.current = false;
      }
      
      // If disabling voice, also stop any listening
      if (!newValue && isListening && recognitionRef.current) {
        recognitionRef.current.stop();
        setIsListening(false);
      }
      
      return newValue;
    });
  };

  const handleSendFromVoice = async (transcript: string) => {
    if (!transcript.trim() || isLoading) return;

    const userMessage: Message = {
      role: "user",
      content: transcript.trim(),
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput("");
    
    // This should not happen in new flow, but keep for backward compatibility
    if (messages.length === 1 && !jobTitle) {
      setJobTitle(transcript.trim());
    }

    setIsLoading(true);
    setIsTyping(true);

    try {
      const conversationHistory = [...messages, userMessage].map(msg => ({
        role: msg.role,
        content: msg.content
      }));

      const response = await fetch('/api/interview/conversation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMessage.content,
          conversationHistory: conversationHistory.slice(-10),
          jobTitle: jobTitle || '',
          jobDescription: jobDescription || '',
          resumeAnalysis: resumeAnalysis,
          candidateSkills: resumeAnalysis?.extractedInfo?.skills || candidateSkills
        }),
      });

      if (response.ok) {
        const data = await response.json();
        
        const assistantMessage: Message = {
          role: "assistant",
          content: data.response || "Thank you for your response. Can you tell me more?",
          timestamp: new Date(data.timestamp || new Date())
        };

        setMessages(prev => [...prev, assistantMessage]);
      } else {
        throw new Error('Failed to get response');
      }
    } catch (error) {
      console.error('Conversation error:', error);
      toast({
        title: "Error",
        description: "Failed to get AI response. Please try again.",
        variant: "destructive"
      });
      
      const fallbackMessage: Message = {
        role: "assistant",
        content: "I apologize, but I'm having trouble processing that. Could you rephrase your response?",
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, fallbackMessage]);
    } finally {
      setIsLoading(false);
      setIsTyping(false);
    }
  };

  // Store function in ref for use in useEffect
  useEffect(() => {
    handleSendFromVoiceRef.current = handleSendFromVoice;
  }, [messages, jobTitle, candidateSkills, isLoading]);

  const extractTextFromFile = async (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result as string;
        resolve(text);
      };
      reader.onerror = reject;
      
      if (file.type === 'application/pdf') {
        // For PDF, send to backend for parsing
        const formData = new FormData();
        formData.append('file', file);
        fetch('/api/interview/extract-text', {
          method: 'POST',
          body: formData
        })
        .then(res => res.json())
        .then(data => {
          if (data.success) {
            resolve(data.text);
          } else {
            reject(new Error(data.message || 'Failed to extract text from PDF'));
          }
        })
        .catch(reject);
      } else if (file.type === 'text/plain') {
        reader.readAsText(file);
      } else {
        reject(new Error('Unsupported file type. Please upload PDF or TXT.'));
      }
    });
  };

  const analyzeResume = async () => {
    if (!jobDescription.trim() || (!resumeText.trim() && !resumeFile)) {
      toast({
        title: "Missing Information",
        description: "Please provide both job description and resume.",
        variant: "destructive"
      });
      return null;
    }

    setIsAnalyzing(true);
    try {
      let resumeContent = resumeText;
      
      // If file is uploaded, extract text from it
      if (resumeFile) {
        resumeContent = await extractTextFromFile(resumeFile);
      }

      const response = await fetch('/api/interview/analyze-resume', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resumeText: resumeContent,
          jobDescription: jobDescription,
          jobTitle: jobTitle
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setResumeAnalysis(data.analysis);
        return data.analysis;
      } else {
        throw new Error('Failed to analyze resume');
      }
    } catch (error) {
      console.error('Resume analysis error:', error);
      toast({
        title: "Analysis Error",
        description: "Failed to analyze resume. Starting interview anyway.",
        variant: "destructive"
      });
      return null;
    } finally {
      setIsAnalyzing(false);
    }
  };

  const startInterview = async () => {
    if (!jobTitle.trim() || !jobDescription.trim()) {
      toast({
        title: "Missing Information",
        description: "Please provide job title and description.",
        variant: "destructive"
      });
      return;
    }

    // Analyze resume first
    const analysis = await analyzeResume();
    
    // Update initial message based on analysis
    let initialMessage = `Hello! I'm your AI Interview Assistant. I've reviewed your resume and the job description for the ${jobTitle} position. `;
    
    if (analysis) {
      initialMessage += `Based on my analysis, I can see you have ${analysis.extractedInfo?.experience || 0} years of experience with skills in ${analysis.extractedInfo?.skills?.slice(0, 3).join(', ') || 'various technologies'}. `;
      initialMessage += `Let's begin the interview. `;
    }
    
    initialMessage += `I'll ask you questions relevant to this position. Please answer as you would in a real interview.`;

    setMessages([{
      role: "assistant",
      content: initialMessage,
      timestamp: new Date(),
    }]);
    
    setShowSetup(false);
    setJobTitle(jobTitle);
  };
  
  const endSession = () => {
    // Stop any ongoing voice input/output
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    }
    if (synthesisRef.current) {
      synthesisRef.current.cancel();
      setIsSpeaking(false);
    }
    setShowReportCard(true);
  };
  
  const closeReportCard = () => {
    setShowReportCard(false);
    startNewSession();
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      role: "user",
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    
    // This should not happen in new flow, but keep for backward compatibility
    if (messages.length === 1 && !jobTitle) {
      setJobTitle(input.trim());
    }

    setIsLoading(true);
    setIsTyping(true);
    setInput("");

    try {
      // Get conversation history for context
      const conversationHistory = [...messages, userMessage].map(msg => ({
        role: msg.role,
        content: msg.content
      }));

      const response = await fetch('/api/interview/conversation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMessage.content,
          conversationHistory: conversationHistory.slice(-10), // Last 10 messages for context
          jobTitle,
          candidateSkills
        }),
      });

      if (response.ok) {
        const data = await response.json();
        
        const assistantMessage: Message = {
          role: "assistant",
          content: data.response || "Thank you for your response. Can you tell me more?",
          timestamp: new Date(data.timestamp || new Date())
        };

        setMessages(prev => [...prev, assistantMessage]);
      } else {
        throw new Error('Failed to get response');
      }
    } catch (error) {
      console.error('Conversation error:', error);
      toast({
        title: "Error",
        description: "Failed to get AI response. Please try again.",
        variant: "destructive"
      });
      
      // Fallback response
      const fallbackMessage: Message = {
        role: "assistant",
        content: "I apologize, but I'm having trouble processing that. Could you rephrase your response?",
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, fallbackMessage]);
    } finally {
      setIsLoading(false);
      setIsTyping(false);
      inputRef.current?.focus();
    }
  };


  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const startNewSession = () => {
    setMessages([{
      role: "assistant",
      content: "Hello! I'm your AI Interview Assistant. I can help you practice for your interview. What position are you interviewing for?",
      timestamp: new Date(),
    }]);
    setJobTitle("");
    setJobDescription("");
    setResumeText("");
    setResumeFile(null);
    setResumeAnalysis(null);
    setCandidateSkills([]);
    setShowSetup(true);
    setInputMode('voice'); // Reset to voice mode
    setShowReportCard(false);
    setSessionStats({ averageScore: 0, totalQuestions: 0, totalResponses: 0 });
    // Reset spoken messages tracking
    spokenMessagesRef.current.clear();
    isSpeakingRef.current = false;
    // Cancel any ongoing speech
    if (synthesisRef.current) {
      synthesisRef.current.cancel();
      setIsSpeaking(false);
    }
    inputRef.current?.focus();
  };

  return (
    <div className="h-screen flex flex-col animate-fade-in">
      <div className="flex items-center justify-between p-6 border-b border-border">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">AI Interview Assistant</h1>
          <p className="text-sm text-muted-foreground">Professional Interview Practice</p>
        </div>
        {messages.length > 1 && !showSetup && (
          <Button onClick={endSession} variant="destructive" size="sm" className="gap-2">
            <X className="w-4 h-4" />
            End Session
          </Button>
        )}
      </div>

      {/* Setup Modal */}
      {showSetup && messages.length === 1 && (
        <div className="flex-1 overflow-y-auto p-6">
          <Card className="p-6 glass border-white/10 max-w-3xl mx-auto">
          <h3 className="text-lg font-semibold mb-4">Interview Setup</h3>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Job Title / Position *</label>
              <Input
                value={jobTitle}
                onChange={(e) => setJobTitle(e.target.value)}
                placeholder="e.g., Senior Software Engineer"
                className="bg-card/50"
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Job Description *</label>
              <Textarea
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                placeholder="Paste the full job description here. Include requirements, responsibilities, and qualifications..."
                className="bg-card/50 min-h-[120px]"
                rows={5}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Your Resume *</label>
              <div className="space-y-2">
                <div className="flex gap-2">
                  <Input
                    type="file"
                    accept=".pdf,.txt"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        setResumeFile(file);
                        setResumeText("");
                      }
                    }}
                    className="bg-card/50"
                  />
                  <span className="text-xs text-muted-foreground self-center">OR</span>
                </div>
                <Textarea
                  value={resumeText}
                  onChange={(e) => {
                    setResumeText(e.target.value);
                    setResumeFile(null);
                  }}
                  placeholder="Paste your resume text here (or upload a file above)..."
                  className="bg-card/50 min-h-[150px]"
                  rows={6}
                />
                {resumeFile && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <FileText className="w-4 h-4" />
                    <span>{resumeFile.name}</span>
                  </div>
                )}
              </div>
            </div>
            <Button 
              onClick={startInterview}
              disabled={!jobTitle.trim() || !jobDescription.trim() || (!resumeText.trim() && !resumeFile) || isAnalyzing}
              className="gradient-primary shadow-glow w-full"
            >
              {isAnalyzing ? (
                <>
                  <Sparkles className="w-4 h-4 mr-2 animate-spin" />
                  Analyzing Resume...
                </>
              ) : (
                "Start Interview"
              )}
            </Button>
            {resumeAnalysis && (
              <div className="p-3 rounded-lg bg-card/30 border border-primary/20 text-sm">
                <p className="font-medium mb-1">Resume Analysis Complete</p>
                <p className="text-muted-foreground">
                  Match Score: {resumeAnalysis.score}/100 | 
                  Experience: {resumeAnalysis.extractedInfo?.experience || 0} years | 
                  Skills: {resumeAnalysis.extractedInfo?.skills?.slice(0, 5).join(', ') || 'N/A'}
                </p>
              </div>
            )}
          </div>
          </Card>
        </div>
      )}

      {showReportCard ? (
        <div className="flex-1 overflow-y-auto p-6">
          <Card className="max-w-4xl mx-auto p-8 glass border-white/10">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                  <Award className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold">Interview Report Card</h2>
                  <p className="text-sm text-muted-foreground">Session Performance Summary</p>
                </div>
              </div>
              <Button onClick={closeReportCard} variant="outline" size="sm">
                <X className="w-4 h-4" />
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <Card className="p-4 bg-card/50 border border-white/10">
                <div className="flex items-center gap-2 mb-2">
                  <MessageSquare className="w-5 h-5 text-primary" />
                  <span className="text-sm text-muted-foreground">Total Questions</span>
                </div>
                <p className="text-3xl font-bold">{sessionStats.totalQuestions}</p>
              </Card>
              <Card className="p-4 bg-card/50 border border-white/10">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="w-5 h-5 text-accent" />
                  <span className="text-sm text-muted-foreground">Duration</span>
                </div>
                <p className="text-3xl font-bold">
                  {Math.round((new Date().getTime() - sessionStartTime.getTime()) / 60000)} min
                </p>
              </Card>
              <Card className="p-4 bg-card/50 border border-white/10">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="w-5 h-5 text-green-500" />
                  <span className="text-sm text-muted-foreground">Responses</span>
                </div>
                <p className="text-3xl font-bold">{sessionStats.totalResponses}</p>
              </Card>
            </div>

            <Card className="p-6 bg-card/50 border border-white/10 mb-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-primary" />
                Interview Summary
              </h3>
              <div className="space-y-3">
                <div>
                  <p className="text-sm font-medium mb-1">Position Interviewed For</p>
                  <p className="text-muted-foreground">{jobTitle || 'Not specified'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium mb-1">Total Messages</p>
                  <p className="text-muted-foreground">{messages.length - 1} exchanges</p>
                </div>
                {resumeAnalysis && (
                  <div>
                    <p className="text-sm font-medium mb-1">Resume Match Score</p>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-gradient-to-r from-primary to-accent h-2 rounded-full"
                          style={{ width: `${resumeAnalysis.score || 0}%` }}
                        ></div>
                      </div>
                      <span className="text-sm font-semibold">{resumeAnalysis.score || 0}%</span>
                    </div>
                  </div>
                )}
              </div>
            </Card>

            <Card className="p-6 bg-card/50 border border-white/10">
              <h3 className="text-lg font-semibold mb-4">Interview Transcript</h3>
              <div className="space-y-4 max-h-[400px] overflow-y-auto">
                {messages.slice(1).map((message, index) => (
                  <div
                    key={index}
                    className={`p-3 rounded-lg ${
                      message.role === 'user'
                        ? 'bg-primary/10 border border-primary/20'
                        : 'bg-card/30 border border-white/10'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      {message.role === 'user' ? (
                        <User className="w-4 h-4 text-primary" />
                      ) : (
                        <Bot className="w-4 h-4 text-accent" />
                      )}
                      <span className="text-xs font-medium">
                        {message.role === 'user' ? 'You' : 'Interviewer'}
                      </span>
                      <span className="text-xs text-muted-foreground ml-auto">
                        {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                  </div>
                ))}
              </div>
            </Card>

            <div className="mt-6 flex justify-center gap-3">
              <Button onClick={closeReportCard} className="gradient-primary shadow-glow">
                Start New Session
              </Button>
            </div>
          </Card>
        </div>
      ) : !showSetup && (
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Main Chat Area - Full Screen */}
          <Card className="flex-1 m-6 glass border-white/10 flex flex-col min-h-0">
          {/* Session Stats Bar */}
          {sessionStats.totalResponses > 0 && (
            <div className="mb-4 p-3 rounded-lg bg-card/50 border border-white/5 flex items-center justify-between text-sm">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-primary" />
                  <span className="text-muted-foreground">Avg Score:</span>
                  <span className="font-semibold text-primary">{sessionStats.averageScore}%</span>
                </div>
                <div className="flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-accent" />
                  <span className="text-muted-foreground">Questions:</span>
                  <span className="font-semibold text-accent">{sessionStats.totalQuestions}</span>
                </div>
              </div>
              <Badge variant="outline" className="gap-1">
                <Clock className="w-3 h-3" />
                {Math.round((new Date().getTime() - messages[0].timestamp.getTime()) / 60000)} min
              </Badge>
            </div>
          )}

          {/* Messages */}
          <div className="flex-1 overflow-y-auto space-y-4 mb-4 pr-2 custom-scrollbar">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex ${message.role === "user" ? "justify-end" : "justify-start"} animate-fade-in`}
              >
                <div className={`flex items-start gap-3 max-w-[85%] ${message.role === "user" ? "flex-row-reverse" : ""}`}>
                  <div className={`p-2.5 rounded-full shrink-0 ${
                    message.role === "user" 
                      ? "bg-primary text-primary-foreground" 
                      : "bg-accent text-accent-foreground"
                  }`}>
                    {message.role === "user" ? (
                      <User className="w-4 h-4" />
                    ) : (
                      <Bot className="w-4 h-4" />
                    )}
                  </div>
                  <div className="flex flex-col gap-1">
                    <div
                      className={`p-4 rounded-2xl ${
                        message.role === "user"
                          ? "bg-primary text-primary-foreground rounded-tr-sm"
                          : "glass border border-white/10 rounded-tl-sm"
                      }`}
                    >
                      <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                      <p className="text-xs opacity-70 mt-2">
                        {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
            
            {/* Typing Indicator */}
            {isTyping && (
              <div className="flex justify-start animate-fade-in">
                <div className="flex items-start gap-3">
                  <div className="p-2.5 rounded-full bg-accent text-accent-foreground shrink-0">
                    <Bot className="w-4 h-4" />
                  </div>
                  <div className="p-4 rounded-2xl glass border border-white/10 rounded-tl-sm">
                    <div className="flex space-x-1.5">
                      <div className="w-2 h-2 bg-accent rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-accent rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-2 h-2 bg-accent rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Mode Toggle & Voice Controls */}
          <div className="mb-2 flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-2">
              {/* Input Mode Toggle */}
              <div className="flex items-center gap-1 p-1 rounded-lg bg-card/50 border border-white/10">
                <Button
                  onClick={() => {
                    setInputMode('voice');
                    if (isVoiceSupported && recognitionRef.current && !isListening && !isSpeaking) {
                      try {
                        recognitionRef.current.start();
                      } catch (error) {
                        console.log('Auto-start voice input skipped:', error);
                      }
                    }
                  }}
                  variant={inputMode === 'voice' ? "default" : "ghost"}
                  size="sm"
                  className="gap-2 h-8"
                  disabled={!isVoiceSupported}
                >
                  <Mic className="w-4 h-4" />
                  Voice
                </Button>
                <Button
                  onClick={() => {
                    setInputMode('text');
                    if (isListening && recognitionRef.current) {
                      recognitionRef.current.stop();
                      setIsListening(false);
                    }
                  }}
                  variant={inputMode === 'text' ? "default" : "ghost"}
                  size="sm"
                  className="gap-2 h-8"
                >
                  <FileText className="w-4 h-4" />
                  Type
                </Button>
              </div>
              
              {/* Voice Output Toggle */}
              {isVoiceSupported && (
                <Button
                  onClick={toggleVoiceOutput}
                  variant={isVoiceEnabled ? "default" : "outline"}
                  size="sm"
                  className="gap-2"
                >
                  {isVoiceEnabled ? (
                    <>
                      <Volume2 className="w-4 h-4" />
                      Voice On
                    </>
                  ) : (
                    <>
                      <VolumeX className="w-4 h-4" />
                      Voice Off
                    </>
                  )}
                </Button>
              )}
            </div>
            
            {/* Status Indicators */}
            <div className="flex items-center gap-3">
              {isListening && inputMode === 'voice' && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground animate-pulse">
                  <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                  <span>Listening...</span>
                </div>
              )}
              {isSpeaking && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
                  <span>AI Speaking...</span>
                </div>
              )}
            </div>
          </div>

          {/* Input Area */}
          {inputMode === 'text' ? (
            <div className="flex gap-2">
              <Textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type your response... (Press Enter to send, Shift+Enter for new line)"
                className="bg-card/50 min-h-[60px] max-h-[120px] resize-none"
                disabled={isLoading}
                rows={2}
              />
              <Button 
                onClick={handleSend} 
                disabled={isLoading || !input.trim()} 
                className="gradient-primary shadow-glow shrink-0 h-[60px] px-6"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
          ) : (
            <div className="flex items-center justify-center p-8 border-2 border-dashed border-primary/30 rounded-lg bg-card/20">
              <div className="text-center space-y-3">
                {isListening ? (
                  <>
                    <div className="w-16 h-16 mx-auto rounded-full bg-red-500/20 flex items-center justify-center animate-pulse">
                      <Mic className="w-8 h-8 text-red-500" />
                    </div>
                    <div>
                      <p className="text-lg font-semibold">Listening...</p>
                      <p className="text-sm text-muted-foreground">Speak your response</p>
                    </div>
                    <Button
                      onClick={stopVoiceInput}
                      variant="destructive"
                      size="sm"
                      className="gap-2"
                    >
                      <MicOff className="w-4 h-4" />
                      Stop Listening
                    </Button>
                  </>
                ) : (
                  <>
                    <div className="w-16 h-16 mx-auto rounded-full bg-primary/20 flex items-center justify-center">
                      <Mic className="w-8 h-8 text-primary" />
                    </div>
                    <div>
                      <p className="text-lg font-semibold">Voice Input Mode</p>
                      <p className="text-sm text-muted-foreground">Click the button below to start recording your response</p>
                    </div>
                    <Button
                      onClick={startVoiceInput}
                      variant="default"
                      size="lg"
                      className="gap-2"
                      disabled={isSpeaking || isLoading}
                    >
                      <Mic className="w-5 h-5" />
                      Start Speaking
                    </Button>
                  </>
                )}
              </div>
            </div>
          )}
          </Card>
        </div>
      )}
    </div>
  );
};

export default Interview;
