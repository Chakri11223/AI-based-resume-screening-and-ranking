
// Finalize interview and save results
app.post('/api/interview/finalize', async (req, res) => {
    const { history, candidateName, jobTitle } = req.body;

    if (!history || !Array.isArray(history) || history.length === 0) {
        return res.status(400).json({ success: false, message: 'Interview history content is required' });
    }

    try {
        // 1. AI Grading
        const conversationText = history.map((msg: any) =>
            `${msg.role === 'ai' ? 'Interviewer' : 'Candidate'}: ${msg.text || msg.content}`
        ).join('\n');

        const gradingPrompt = `
    You are an expert hiring manager. Grade this interview for the role of "${jobTitle}".
    
    TRANSCRIPT:
    ${conversationText}
    
    INSTRUCTIONS:
    - Assess communication skills, technical relevance, and professionalism.
    - Assign a score 0-100.
    - Provide a short summary.
    
    RETURN JSON:
    {
      "score": number, // 0-100
      "summary": string, // 2-3 sentences max
      "status": "Recommended" | "Consider" | "Rejected",
      "strengths": string[],
      "improvements": string[]
    }
    `;

        const gradingText = await generateText(gradingPrompt);
        const result = parseJsonFromText(gradingText) || {
            score: 70,
            summary: "Interview completed (AI parsing failed, using default).",
            status: "Consider",
            strengths: [],
            improvements: []
        };

        // 2. Save to DB
        let savedCandidate = null;

        // Ensure Candidate model is loaded
        if (Candidate) {
            // Try to find candidate by name (and ideally email, but for now just name in this demo flow)
            // Ideally we would ask for email in VoiceScreener setup, but for now we search or create.
            // We'll create a new one if not found to ensure data isn't lost.

            let candidate = await Candidate.findOne({ name: candidateName, jobRole: jobTitle });

            if (!candidate) {
                candidate = new Candidate({
                    name: candidateName,
                    email: `${candidateName.toLowerCase().replace(/\s+/g, '.')}@example.com`, // Placeholder email
                    phone: 'Not provided',
                    jobRole: jobTitle,
                    skills: [], // Extracted later or irrelevant here
                    experience: 0,
                    location: 'Remote',
                    atsScore: result.score, // Use interview score as proxy for ATS score in this context
                    status: 'Phone Screened', // New status
                    interviewScore: result.score,
                    interviewSummary: result.summary,
                    interviewDate: new Date()
                });
            } else {
                // Update existing
                candidate.interviewScore = result.score;
                candidate.interviewSummary = result.summary;
                candidate.status = 'Phone Screened';
                candidate.interviewDate = new Date();
            }

            savedCandidate = await candidate.save();
            console.log(`✅ Interview saved for ${candidateName}. Score: ${result.score}`);
        } else {
            console.log('⚠️ Candidate model not available, returning result only.');
        }

        return res.json({
            success: true,
            result: result,
            savedId: savedCandidate?._id
        });

    } catch (error) {
        console.error('Finalize interview error:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to finalize interview',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
