import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import multer from 'multer';
const pdfParse = require('pdf-parse');
import mammoth from 'mammoth';
import mongoose from 'mongoose';
import nodemailer from 'nodemailer';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5001;

// Middleware configured later in the file (single source of truth)

// Initialize Gemini AI (Standard SDK)
let genAI: any = null;
let model: any = null;
let MODEL_NAME = 'gemini-flash-latest'; // 'gemini-1.5-flash' not available for this key, using latest alias

try {
  const { GoogleGenerativeAI } = require('@google/generative-ai');
  genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
  model = genAI.getGenerativeModel({ model: MODEL_NAME });
  console.log(`🤖 Using Gemini model (Standard SDK): ${MODEL_NAME}`);
  console.log(`✅ Server initialized with stable configuration at ${new Date().toISOString()}`);
} catch (error) {
  console.log('⚠️  @google/generative-ai not available or failed to initialize');
}

// Import models safely - they won't cause issues if mongoose isn't connected
let User: any = null, Candidate: any = null, Job: any = null;
try {
  const userModel = require('./models/User');
  User = userModel.User;
  const candidateModel = require('./models/Candidate');
  Candidate = candidateModel.Candidate;
  const jobModel = require('./models/Job');
  Job = jobModel.Job;
} catch (error) {
  console.log('⚠️  Models not loaded (MongoDB connection optional)');
}

// Helper function to check if error is retryable
const isRetryableError = (error: any): boolean => {
  if (!error) return false;

  // Check for 503, 429, 500, 502 errors
  const errorCode = error?.code || error?.status || error?.error?.code || error?.error?.status;
  if (errorCode === 503 || errorCode === 429 || errorCode === 500 || errorCode === 502) {
    return true;
  }

  // Check error message for overload/rate limit
  const errorMessage = (error?.message || error?.error?.message || '').toLowerCase();
  if (errorMessage.includes('overloaded') || errorMessage.includes('rate limit') || errorMessage.includes('unavailable')) {
    return true;
  }

  return false;
};

// Retry wrapper with exponential backoff
const retryWithBackoff = async <T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000,
  context: string = ''
): Promise<T> => {
  let lastError: any;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error: any) {
      lastError = error;

      // If not retryable or last attempt, throw
      if (!isRetryableError(error) || attempt === maxRetries) {
        throw error;
      }

      // Calculate delay with exponential backoff
      const delay = baseDelay * Math.pow(2, attempt);
      if (context) {
        console.log(`${context} - Retry attempt ${attempt + 1}/${maxRetries} after ${delay}ms delay...`);
      } else {
        console.log(`Retry attempt ${attempt + 1}/${maxRetries} after ${delay}ms delay...`);
      }
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw lastError;
};

// helper to call text generation (using standard SDK)
const generateText = async (prompt: string): Promise<string> => {
  if (!model) return '';

  try {
    const result = await retryWithBackoff(async () => {
      return await model.generateContent(prompt);
    }, 3, 1000);

    const response = await result.response;
    return response.text();
  } catch (error: any) {
    if (error.message.includes('404')) {
      console.log('❌ GEMINI API ERROR: Model not found. Please check your API Key permissions or create a new key at aistudio.google.com');
    }
    console.log('generateText error:', error?.message || JSON.stringify(error));
    return '';
  }
};

// Helper to extract text from Gemini API response (comprehensive)
const extractTextFromResponse = (respAny: any): string => {
  if (!respAny) return '';

  // Try all possible response paths in order of likelihood
  const paths = [
    () => respAny?.output_text,
    () => respAny?.text,
    () => respAny?.response?.output_text,
    () => respAny?.response?.text,
    () => respAny?.candidates?.[0]?.content?.parts?.[0]?.output_text,
    () => respAny?.candidates?.[0]?.content?.parts?.[0]?.text,
    () => respAny?.candidates?.[0]?.output_text,
    () => respAny?.candidates?.[0]?.text,
    () => respAny?.content?.parts?.[0]?.output_text,
    () => respAny?.content?.parts?.[0]?.text,
  ];

  for (const getPath of paths) {
    try {
      const value = getPath();
      if (value && (typeof value === 'string' || typeof value === 'object')) {
        const text = typeof value === 'string' ? value : JSON.stringify(value);
        if (text && text.trim().length > 0) {
          return text;
        }
      }
    } catch { }
  }

  // If it's already a string
  if (typeof respAny === 'string' && respAny.trim().length > 0) {
    return respAny;
  }

  // If it's an object with expected fields, try to return it as JSON string
  if (respAny && typeof respAny === 'object') {
    try {
      // Check if it has the structure we expect
      if (respAny.score !== undefined || respAny.strengths !== undefined || respAny.strengths?.length >= 0) {
        return JSON.stringify(respAny);
      }
    } catch { }
  }

  return '';
};

// Enforce strict JSON using standard SDK
const generateJson = async (prompt: string, schema: any): Promise<any | null> => {
  if (!model) return null;

  const enhancedPrompt = `${prompt}\n\nCRITICAL: Return ONLY valid JSON.`;

  try {
    // Attempt with response_mime_type configuration if supported
    // For simpler path, we rely on text generation + parser since we have a robust parseJsonFromText

    // We can try to use the JSON mode if using 1.5 Pro/Flash
    const result = await retryWithBackoff(async () => {
      // Create a config object if possible, but the standard SDK usually takes it in the call
      // model.generateContent(request)
      return await model.generateContent({
        contents: [{ role: 'user', parts: [{ text: enhancedPrompt }] }],
        generationConfig: { responseMimeType: "application/json" }
      });
    }, 3, 1000);

    const response = await result.response;
    const text = response.text();
    return parseJsonFromText(text);

  } catch (error: any) {
    console.log('generateJson error:', error?.message);
    // Fallback to plain text generation
    try {
      const text = await generateText(enhancedPrompt);
      return parseJsonFromText(text);
    } catch (e) { return null; }
  }
};

// Resume Text Extraction Functions
const extractTextFromFile = async (filePath: string, mimetype: string): Promise<string> => {
  try {
    console.log(`Extracting text from file: ${filePath}, type: ${mimetype}`);

    if (mimetype === 'application/pdf') {
      const dataBuffer = fs.readFileSync(filePath);
      const data = await pdfParse(dataBuffer);
      console.log(`Extracted ${data.text.length} characters from PDF`);
      return data.text;
    } else if (mimetype === 'text/plain') {
      const text = fs.readFileSync(filePath, 'utf8');
      console.log(`Extracted ${text.length} characters from text file`);
      return text;
    } else if (mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      // DOCX using mammoth
      const { value } = await mammoth.extractRawText({ path: filePath });
      console.log(`Extracted ${value.length} characters from DOCX`);
      return value;
    } else if (mimetype === 'application/msword') {
      console.log('Legacy .doc detected - not supported. Please convert to PDF/DOCX/TXT');
      return 'Legacy .doc detected - not supported. Please convert to PDF/DOCX/TXT';
    } else {
      console.log(`Unsupported file type: ${mimetype}`);
      return 'Unsupported file type. Please upload PDF or text files.';
    }
  } catch (error) {
    console.error('Error extracting text from file:', error);
    return 'Error extracting text from file. Please ensure the file is not corrupted.';
  }
};

// Simple resume parser and scoring as fallback/local analysis
const extractCandidateInfoFromText = (text: string) => {
  const lower = text.toLowerCase();
  const emailMatch = text.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi);
  const phoneMatch = text.match(/(\+?\d[\d\s\-()]{8,}\d)/g);
  const expMatch = lower.match(/(\d{1,2})\s+years?/);
  const experience = expMatch ? Math.min(40, Math.max(0, parseInt(expMatch[1], 10))) : 0;

  const knownSkills = [
    'javascript', 'typescript', 'react', 'node', 'node.js', 'python', 'java', 'c++', 'c#', 'go', 'ruby', 'php', 'swift', 'kotlin', 'html', 'css', 'tailwind', 'next', 'angular', 'vue',
    'express', 'django', 'flask', 'spring', 'mongodb', 'postgres', 'mysql', 'sql', 'redis', 'graphql', 'aws', 'azure', 'gcp', 'docker', 'kubernetes', 'git', 'ci/cd', 'jest', 'pytest', 'junit'
  ];
  const skills = Array.from(new Set(knownSkills.filter(s => lower.includes(s)).map(s => s.replace('node.js', 'node'))));

  // Try name from first non-empty line
  const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  let name = 'Unknown Candidate';
  for (const line of lines.slice(0, 10)) {
    if (/^[A-Za-z][A-Za-z\s.'-]{4,}$/.test(line) && !line.toLowerCase().includes('resume')) { name = line; break; }
  }

  return {
    name,
    email: emailMatch?.[0] || 'Not found',
    phone: phoneMatch?.[0] || 'Not found',
    experience,
    skills,
    education: 'Not specified',
    location: 'Not specified',
  };
};

const computeMatchScore = (resumeText: string, jobDescription: string) => {
  const r = resumeText.toLowerCase();
  const j = jobDescription.toLowerCase();
  const jobTokens = Array.from(new Set(j.split(/[^a-z0-9+#.]+/).filter(w => w.length > 2)));
  const important = ['react', 'node', 'typescript', 'javascript', 'python', 'java', 'aws', 'docker', 'kubernetes', 'sql', 'mongodb'];
  let matches = 0; let weighted = 0;
  for (const t of jobTokens) {
    if (r.includes(t)) { matches++; if (important.includes(t)) weighted += 2; else weighted += 1; }
  }
  const base = Math.min(95, Math.round((matches / Math.max(10, jobTokens.length)) * 70) + Math.min(25, weighted));
  const strengths = jobTokens.filter(t => r.includes(t)).slice(0, 3).map(t => `Experience with ${t}`);
  const weaknesses = jobTokens.filter(t => !r.includes(t)).slice(0, 3).map(t => `Limited evidence of ${t}`);
  return { score: Math.max(50, base), strengths, weaknesses };
};

// Robust JSON extractor for LLM outputs that may include prose or code fences
const parseJsonFromText = (raw: string): any | null => {
  if (!raw || typeof raw !== 'string') {
    console.log('parseJsonFromText: Invalid input');
    return null;
  }

  // Clean the input
  let cleaned = raw.trim();

  // Remove markdown code fences (handle multiple formats)
  cleaned = cleaned.replace(/^```json\s*/gi, '').replace(/^```\s*/g, '').replace(/```\s*$/g, '').trim();

  // Remove leading/trailing whitespace and newlines
  cleaned = cleaned.replace(/^\s+|\s+$/g, '');

  // Remove any leading text before first { or [
  const firstBrace = cleaned.indexOf('{');
  const firstBracket = cleaned.indexOf('[');
  if (firstBrace !== -1 && (firstBracket === -1 || firstBrace < firstBracket)) {
    cleaned = cleaned.substring(firstBrace);
  } else if (firstBracket !== -1) {
    cleaned = cleaned.substring(firstBracket);
  }

  // Remove any trailing text after last } or ]
  const lastBrace = cleaned.lastIndexOf('}');
  const lastBracket = cleaned.lastIndexOf(']');
  if (lastBrace !== -1 && (lastBracket === -1 || lastBrace > lastBracket)) {
    cleaned = cleaned.substring(0, lastBrace + 1);
  } else if (lastBracket !== -1) {
    cleaned = cleaned.substring(0, lastBracket + 1);
  }

  // Try direct parse first
  try {
    const parsed = JSON.parse(cleaned);
    console.log('parseJsonFromText: Direct parse succeeded');
    return parsed;
  } catch (e: any) {
    console.log('parseJsonFromText: Direct parse failed, trying extraction');
  }

  // Extract JSON object (handles nested objects)
  const extractBalancedObject = (s: string): string | null => {
    let depth = 0;
    let startIdx = -1;
    let inString = false;
    let escapeNext = false;

    for (let i = 0; i < s.length; i++) {
      const ch = s[i];

      if (escapeNext) {
        escapeNext = false;
        continue;
      }

      if (ch === '\\') {
        escapeNext = true;
        continue;
      }

      if (ch === '"' && !escapeNext) {
        inString = !inString;
        continue;
      }

      if (!inString) {
        if (ch === '{') {
          if (depth === 0) startIdx = i;
          depth++;
        } else if (ch === '}') {
          depth--;
          if (depth === 0 && startIdx !== -1) {
            return s.slice(startIdx, i + 1);
          }
        }
      }
    }
    return null;
  };

  // Try to extract JSON object
  const extracted = extractBalancedObject(cleaned);
  if (extracted) {
    try {
      const parsed = JSON.parse(extracted);
      console.log('parseJsonFromText: Extracted object parse succeeded');
      return parsed;
    } catch (e: any) {
      console.log('parseJsonFromText: Extracted object parse failed:', e?.message || 'Unknown error');
    }
  }

  // Try to find JSON array
  const extractBalancedArray = (s: string): string | null => {
    let depth = 0;
    let startIdx = -1;
    let inString = false;
    let escapeNext = false;

    for (let i = 0; i < s.length; i++) {
      const ch = s[i];

      if (escapeNext) {
        escapeNext = false;
        continue;
      }

      if (ch === '\\') {
        escapeNext = true;
        continue;
      }

      if (ch === '"' && !escapeNext) {
        inString = !inString;
        continue;
      }

      if (!inString) {
        if (ch === '[') {
          if (depth === 0) startIdx = i;
          depth++;
        } else if (ch === ']') {
          depth--;
          if (depth === 0 && startIdx !== -1) {
            return s.slice(startIdx, i + 1);
          }
        }
      }
    }
    return null;
  };

  const extractedArray = extractBalancedArray(cleaned);
  if (extractedArray) {
    try {
      const parsed = JSON.parse(extractedArray);
      console.log('parseJsonFromText: Extracted array parse succeeded');
      return parsed;
    } catch (e: any) {
      console.log('parseJsonFromText: Extracted array parse failed:', e?.message || 'Unknown error');
    }
  }

  // Last resort: try to fix common JSON issues
  try {
    let fixed = cleaned;

    // Remove BOM if present
    if (fixed.charCodeAt(0) === 0xFEFF) {
      fixed = fixed.slice(1);
    }

    // Remove trailing commas before } or ]
    fixed = fixed.replace(/,(\s*[}\]])/g, '$1');

    // Remove comments (// and /* */) - but be careful with URLs
    fixed = fixed.replace(/\/\/[^\n]*/g, '').replace(/\/\*[\s\S]*?\*\//g, '');

    // Fix unquoted keys (if any) - be careful not to break strings
    // Only fix keys that are not already quoted
    fixed = fixed.replace(/([{,]\s*)([a-zA-Z_$][a-zA-Z0-9_$]*)\s*:/g, (match, prefix, key) => {
      // Check if the key is already quoted
      if (match.includes('"')) return match;
      return `${prefix}"${key}":`;
    });

    // Fix single quotes to double quotes (but preserve escaped quotes)
    // This is a simple approach - in production, use a proper JSON repair library
    fixed = fixed.replace(/([^\\])'/g, '$1"');

    // Fix NaN, Infinity, undefined to null (outside strings)
    fixed = fixed.replace(/\bNaN\b/g, 'null').replace(/\bInfinity\b/g, 'null').replace(/\bundefined\b/g, 'null');

    // Try to fix common issues with numbers
    fixed = fixed.replace(/:\s*([+-]?Infinity|NaN)\s*([,}])/g, ': null$2');

    const parsed = JSON.parse(fixed);
    console.log('parseJsonFromText: Fixed JSON parse succeeded');
    return parsed;
  } catch (e: any) {
    console.log('parseJsonFromText: All parsing attempts failed');
    console.log('Raw text (first 1000 chars):', cleaned.substring(0, 1000));
    console.log('Error:', e?.message);

    // Final attempt: try to extract just the JSON structure using regex
    try {
      // Try to find a JSON-like structure and extract it
      const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const extracted = jsonMatch[0];
        // Remove trailing commas
        const cleanedExtracted = extracted.replace(/,(\s*[}\]])/g, '$1');
        const parsed = JSON.parse(cleanedExtracted);
        console.log('parseJsonFromText: Regex extraction succeeded');
        return parsed;
      }
    } catch (finalError: any) {
      console.log('parseJsonFromText: Final regex extraction also failed');
    }
  }

  return null;
};

// AI Service Functions
const analyzeResume = async (resumeText: string, jobDescription: string): Promise<any> => {
  try {
    console.log('Starting AI analysis...');
    console.log('API Key configured:', !!process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'your-gemini-api-key-here');

    if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === 'your-gemini-api-key-here') {
      console.log('Using local parser (no API key)');
      const info = extractCandidateInfoFromText(resumeText);
      const scoring = computeMatchScore(resumeText, jobDescription);
      return {
        score: scoring.score,
        strengths: scoring.strengths,
        weaknesses: scoring.weaknesses,
        recommendations: [scoring.score >= 80 ? 'Strong fit' : scoring.score >= 65 ? 'Potential fit' : 'Consider for junior role'],
        aiSummary: `Estimated ${info.experience} years experience. Top skills: ${info.skills.slice(0, 5).join(', ')}`,
        extractedInfo: info,
      };
    }

    const prompt = `
    Analyze this resume against the job description and extract candidate information:

    Job Description: ${jobDescription}

    Resume Text: ${resumeText}

    Please provide:
    1. Match Score (0-100)
    2. Key Strengths (top 3)
    3. Areas for Improvement (top 3)
    4. Overall Recommendation
    5. Skills Analysis
    6. Experience Relevance
    7. Extracted candidate information
    8. Gap Analysis (missing skills/experience)
    9. Recommended Learning Path (3-5 steps with resources)

    Return ONLY a single valid JSON object. Do NOT add any text before or after it.
    Do NOT use markdown, code fences, comments, or trailing commas.
    JSON must strictly conform to this schema with correct types:
    {
      "score": number,
      "strengths": string[],
      "weaknesses": string[],
      "recommendations": string[],
      "aiSummary": string,
      "skillsAnalysis": string,
      "experienceRelevance": string,
      "extractedInfo": {
        "name": string,
        "email": string,
        "phone": string,
        "experience": number,
        "skills": string[],
        "education": string,
        "location": string
      },
      "gapAnalysis": {
        "missingSkills": string[],
        "experienceGaps": string[]
      },
      "learningPath": [{
        "title": string,
        "description": string,
        "resources": string[],
        "estimatedTime": string
      }]
    }
    `;

    console.log('Calling Gemini API...');
    const analysisSchema: any = {
      type: 'object',
      properties: {
        score: { type: 'number' },
        strengths: { type: 'array', items: { type: 'string' } },
        weaknesses: { type: 'array', items: { type: 'string' } },
        recommendations: { type: 'array', items: { type: 'string' } },
        aiSummary: { type: 'string' },
        skillsAnalysis: { type: 'string' },
        experienceRelevance: { type: 'string' },
        extractedInfo: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            email: { type: 'string' },
            phone: { type: 'string' },
            experience: { type: 'number' },
            skills: { type: 'array', items: { type: 'string' } },
            education: { type: 'string' },
            location: { type: 'string' },
          },
          required: ['name', 'email', 'experience', 'skills', 'education', 'location']
        },
        gapAnalysis: {
          type: 'object',
          properties: {
            missingSkills: { type: 'array', items: { type: 'string' } },
            experienceGaps: { type: 'array', items: { type: 'string' } }
          },
          required: ['missingSkills', 'experienceGaps']
        },
        learningPath: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              title: { type: 'string' },
              description: { type: 'string' },
              resources: { type: 'array', items: { type: 'string' } },
              estimatedTime: { type: 'string' }
            },
            required: ['title', 'description', 'resources', 'estimatedTime']
          }
        }
      },
      required: ['score', 'strengths', 'weaknesses', 'recommendations', 'aiSummary', 'skillsAnalysis', 'experienceRelevance', 'extractedInfo', 'gapAnalysis', 'learningPath']
    };

    const parsed = await generateJson(prompt, analysisSchema);
    console.log('Gemini API response received');
    if (parsed && typeof parsed === 'object') {
      // Validate the parsed object has required fields
      if (parsed.score !== undefined && parsed.strengths && parsed.weaknesses) {
        console.log('AI analysis completed successfully');
        console.log(`Score: ${parsed.score}, Strengths: ${parsed.strengths?.length || 0}, Weaknesses: ${parsed.weaknesses?.length || 0}`);
        return parsed;
      } else {
        console.log('JSON parsing succeeded but missing required fields, using fallback');
      }
    } else {
      console.log('JSON parsing failed, trying generateText as fallback');
    }

    // Fallback: try generateText and parse manually
    try {
      const rawText = await generateText(prompt);
      console.log('Raw AI response received, length:', rawText.length);
      console.log('Raw AI response (first 500 chars):', rawText.substring(0, 500));

      // Try to parse the raw text
      const manualParse = parseJsonFromText(rawText);
      if (manualParse && manualParse.score !== undefined) {
        console.log('Manual parsing from generateText succeeded');
        return manualParse;
      }

      // If still can't parse, use fallback with extracted info
      const localInfo = extractCandidateInfoFromText(resumeText);
      const scoring = computeMatchScore(resumeText, jobDescription);

      console.log('Using fallback analysis with local scoring');
      return {
        score: scoring.score,
        strengths: scoring.strengths.length > 0 ? scoring.strengths : ['Strong technical background', 'Relevant experience'],
        weaknesses: scoring.weaknesses.length > 0 ? scoring.weaknesses : ['Could improve in specific areas'],
        recommendations: scoring.score >= 80 ? ['Strong fit'] : scoring.score >= 65 ? ['Potential fit'] : ['Consider for role'],
        aiSummary: rawText ? (rawText.substring(0, 200) + (rawText.length > 200 ? '...' : '')) : `Estimated ${localInfo.experience} years experience. Top skills: ${localInfo.skills.slice(0, 5).join(', ')}`,
        skillsAnalysis: `Skills identified: ${localInfo.skills.slice(0, 10).join(', ')}`,
        experienceRelevance: `Experience level: ${localInfo.experience} years`,
        extractedInfo: localInfo,
        gapAnalysis: {
          missingSkills: ['Advanced skills analysis unavailable (Local Mode)', 'Cloud platforms'],
          experienceGaps: ['Detailed experience gap analysis requires AI']
        },
        learningPath: [
          {
            title: 'Complete AI Setup',
            description: 'To get personalized learning paths, please configure the Gemini API key in the backend.',
            resources: ['Google AI Studio'],
            estimatedTime: '5 minutes'
          }
        ]
      };
    } catch (fallbackError) {
      console.error('Fallback analysis error:', fallbackError);
      const localInfo = extractCandidateInfoFromText(resumeText);
      const scoring = computeMatchScore(resumeText, jobDescription);
      return {
        score: scoring.score,
        strengths: scoring.strengths,
        weaknesses: scoring.weaknesses,
        recommendations: [scoring.score >= 80 ? 'Strong fit' : scoring.score >= 65 ? 'Potential fit' : 'Consider for role'],
        aiSummary: `Estimated ${localInfo.experience} years experience. Top skills: ${localInfo.skills.slice(0, 5).join(', ')}`,
        skillsAnalysis: 'Skills analysis completed',
        experienceRelevance: 'Experience relevant to role',
        extractedInfo: localInfo,
        gapAnalysis: {
          missingSkills: ['Advanced skills analysis unavailable (Local Mode)'],
          experienceGaps: []
        },
        learningPath: [
          {
            title: 'Complete AI Setup',
            description: 'To get personalized learning paths, please configure the Gemini API key in the backend.',
            resources: ['Google AI Studio'],
            estimatedTime: '5 minutes'
          }
        ]
      };
    }
  } catch (error) {
    console.error('Gemini AI Error:', error);
    const info = extractCandidateInfoFromText(resumeText);
    const scoring = computeMatchScore(resumeText, jobDescription);
    return {
      score: scoring.score,
      strengths: scoring.strengths,
      weaknesses: scoring.weaknesses,
      recommendations: [scoring.score >= 80 ? 'Strong fit' : scoring.score >= 65 ? 'Potential fit' : 'Consider for junior role'],
      aiSummary: `Estimated ${info.experience} years experience. Top skills: ${info.skills.slice(0, 5).join(', ')}`,
      extractedInfo: info,
      gapAnalysis: {
        missingSkills: ['Advanced skills analysis unavailable (Local Mode)'],
        experienceGaps: []
      },
      learningPath: [
        {
          title: 'Complete AI Setup',
          description: 'To get personalized learning paths, please configure the Gemini API key in the backend.',
          resources: ['Google AI Studio'],
          estimatedTime: '5 minutes'
        }
      ]
    };
  }
};

const generateInterviewQuestions = async (jobTitle: string, candidateSkills: string[]): Promise<string[]> => {
  try {
    const prompt = `
    Generate 5 relevant interview questions for a ${jobTitle} position.
    The candidate has these skills: ${candidateSkills.join(', ')}
    
    Include:
    - Technical questions
    - Behavioral questions
    - Problem-solving scenarios
    
    Return as a JSON array of strings.
    `;

    const text = await generateText(prompt);

    try {
      return JSON.parse(text);
    } catch (parseError) {
      return [
        `Tell me about your experience with ${candidateSkills[0] || 'programming'}`,
        'Describe a challenging project you worked on',
        'How do you approach problem-solving?',
        'What are your career goals?',
        'Why are you interested in this position?'
      ];
    }
  } catch (error) {
    console.error('Gemini AI Error:', error);
    return [
      'Tell me about yourself',
      'What are your strengths?',
      'Why should we hire you?',
      'Describe a challenging project',
      'Where do you see yourself in 5 years?'
    ];
  }
};

const improveJobDescription = async (description: string): Promise<string> => {
  try {
    const prompt = `
    Improve this job description to make it more attractive and comprehensive:
    
    ${description}
    
    Make it:
    - More engaging and clear
    - Include specific requirements
    - Add growth opportunities
    - Improve structure
    
    Return only the improved description.
    `;

    const text = await generateText(prompt);
    return text || description;
  } catch (error) {
    console.error('Gemini AI Error:', error);
    return `${description}\n\nEnhanced with AI:\n- Clear technical requirements\n- Specific experience levels\n- Key responsibilities\n- Growth opportunities`;
  }
};

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = './uploads';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain' // Allow text files for testing
    ];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF, Word documents, and text files are allowed.'));
    }
  }
});

// In-memory data storage (replaces MongoDB)
interface Candidate {
  id: string;
  name?: string; // Added for flexibility
  firstName?: string; // Made optional if name is provided
  lastName?: string; // Made optional if name is provided
  email: string;
  phone?: string;
  location?: string;
  experience: number;
  skills: string[];
  education: Array<{
    degree: string;
    institution: string;
    year: number;
  }>;
  resumeFile?: { // Made optional
    filename: string;
    originalName: string;
    mimetype: string;
    size: number;
    path: string;
  };
  analysis?: { // Made optional
    score: number;
    strengths: string[];
    weaknesses: string[];
    recommendations: string[];
    aiSummary: string;
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
  };
  status: 'uploaded' | 'analyzed' | 'shortlisted' | 'rejected' | 'hired' | 'Phone Screened';
  jobId?: string;
  jobRole?: string; // Added
  interviewScore?: number; // Added
  interviewSummary?: string; // Added
  interviewDate?: Date; // Added
  atsScore?: number; // Added
  createdAt: Date;
  updatedAt: Date;
}

interface Job {
  id: string;
  title: string;
  description: string;
  requirements: string[];
  skills: string[];
  experience: {
    min: number;
    max: number;
  };
  location: string;
  salary: {
    min: number;
    max: number;
    currency: string;
  };
  type: 'full-time' | 'part-time' | 'contract' | 'internship';
  status: 'draft' | 'active' | 'paused' | 'closed';
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

interface User {
  id: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  company?: string;
  role: 'admin' | 'hr' | 'recruiter';
  isActive: boolean;
  lastLogin?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// In-memory data stores (empty - data will be stored in MongoDB when connected)
let candidates: Candidate[] = [];
let jobs: Job[] = [];
let users: User[] = [];

// OTP storage for email verification
interface OTPEntry {
  email: string;
  otp: string;
  expiresAt: Date;
  attempts: number;
  verified?: boolean;
  isPasswordReset?: boolean; // Flag to distinguish password reset OTPs
}

let otpStore: OTPEntry[] = [];

// Email transporter setup
const createTransporter = () => {
  if (!process.env.EMAIL_HOST || !process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.log('⚠️  Email configuration not found. OTP emails will not be sent.');
    return null;
  }

  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.EMAIL_PORT || '587'),
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
};

const transporter = createTransporter();

// Generate 6-digit OTP
const generateOTP = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Send OTP email
const sendOTPEmail = async (email: string, otp: string): Promise<boolean> => {
  if (!transporter) {
    console.log('⚠️  Email transporter not configured. OTP:', otp);
    return false;
  }

  try {
    const mailOptions = {
      from: `"AI Resume Screening" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Email Verification - AI Resume Screening',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0;">Email Verification</h1>
          </div>
          <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
            <p style="color: #333; font-size: 16px;">Thank you for signing up for AI Resume Screening!</p>
            <p style="color: #666; font-size: 14px;">Please use the following OTP to verify your email address:</p>
            <div style="background: white; border: 2px dashed #667eea; border-radius: 8px; padding: 20px; text-align: center; margin: 20px 0;">
              <h2 style="color: #667eea; font-size: 32px; letter-spacing: 5px; margin: 0;">${otp}</h2>
            </div>
            <p style="color: #666; font-size: 12px; margin-top: 20px;">This OTP will expire in 10 minutes.</p>
            <p style="color: #999; font-size: 12px; margin-top: 20px;">If you didn't request this verification, please ignore this email.</p>
          </div>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    console.log(`✅ OTP email sent to ${email}`);
    return true;
  } catch (error) {
    console.error('❌ Error sending OTP email:', error);
    return false;
  }
};

// Send Password Reset OTP email
const sendPasswordResetOTPEmail = async (email: string, otp: string): Promise<boolean> => {
  if (!transporter) {
    console.log('⚠️  Email transporter not configured. Password Reset OTP:', otp);
    return false;
  }

  try {
    const mailOptions = {
      from: `"AI Resume Screening" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Password Reset - AI Resume Screening',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0;">Password Reset</h1>
          </div>
          <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
            <p style="color: #333; font-size: 16px;">You requested to reset your password for AI Resume Screening.</p>
            <p style="color: #666; font-size: 14px;">Please use the following OTP to verify your identity and reset your password:</p>
            <div style="background: white; border: 2px dashed #f5576c; border-radius: 8px; padding: 20px; text-align: center; margin: 20px 0;">
              <h2 style="color: #f5576c; font-size: 32px; letter-spacing: 5px; margin: 0;">${otp}</h2>
            </div>
            <p style="color: #666; font-size: 12px; margin-top: 20px;">This OTP will expire in 10 minutes.</p>
            <p style="color: #999; font-size: 12px; margin-top: 20px;">If you didn't request this password reset, please ignore this email and your password will remain unchanged.</p>
          </div>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    console.log(`✅ Password reset OTP email sent to ${email}`);
    return true;
  } catch (error) {
    console.error('❌ Error sending password reset OTP email:', error);
    return false;
  }
};

// Helper functions for data operations
const generateId = (): string => {
  return Math.random().toString(36).substr(2, 9);
};

const findCandidateById = (id: string): Candidate | undefined => {
  return candidates.find(c => c.id === id);
};

const findJobById = (id: string): Job | undefined => {
  return jobs.find(j => j.id === id);
};

const findUserById = (id: string): User | undefined => {
  return users.find(u => u.id === id);
};

// Security middleware
app.use(helmet());
app.use(compression());

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'), // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
});
app.use('/api/', limiter);

// CORS configuration
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging middleware
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// Static files - serve the actual uploads directory at project root
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV,
  });
});

// List available Gemini models using your API key
app.get('/api/models', async (req, res) => {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(400).json({ success: false, message: 'GEMINI_API_KEY is not set' });
    }

    const version = (req.query.version as string) || 'v1'; // try v1 by default
    const url = `https://generativelanguage.googleapis.com/${version}/models?key=${apiKey}`;
    const response = await fetch(url);
    const data = (await response.json()) as unknown;

    // Normalize output
    const modelsArray = Array.isArray((data as any)?.models) ? (data as any).models : [];
    const models = modelsArray.map((m: any) => ({
      name: m.name,
      displayName: m.displayName,
      description: m.description,
      inputTokenLimit: m.inputTokenLimit,
      outputTokenLimit: m.outputTokenLimit,
      supportedGenerationMethods: m.supportedGenerationMethods,
    }));

    return res.json({ success: true, version, count: models.length, models });
  } catch (error) {
    console.error('List models error:', error);
    return res.status(500).json({ success: false, message: 'Failed to list models' });
  }
});

// Basic API routes for testing
app.get('/api/test', (req, res) => {
  res.json({
    success: true,
    message: 'Backend is working!',
    timestamp: new Date().toISOString(),
    database: 'In-Memory Storage',
    totalCandidates: candidates.length,
    totalJobs: jobs.length,
    totalUsers: users.length,
  });
});

// Dashboard analytics endpoint
app.get('/api/dashboard', (req, res) => {
  const totalResumes = candidates.length;
  const totalCandidates = candidates.length;
  const averageScore = candidates.length > 0
    ? Math.round(candidates.reduce((sum, c) => sum + (c.analysis?.score || 0), 0) / candidates.length)
    : 0;
  const shortlistedCount = candidates.filter(c => c.status === 'shortlisted').length;
  const hiredCount = candidates.filter(c => c.status === 'hired').length;

  // Calculate top skills with percentage
  const skillCounts: { [key: string]: number } = {};
  candidates.forEach(candidate => {
    if (candidate.skills && Array.isArray(candidate.skills)) {
      candidate.skills.forEach(skill => {
        skillCounts[skill] = (skillCounts[skill] || 0) + 1;
      });
    }
  });

  const totalCandidatesWithSkills = candidates.filter(c => c.skills && c.skills.length > 0).length;
  const topSkills = Object.entries(skillCounts)
    .map(([skill, count]) => ({
      skill,
      count: totalCandidatesWithSkills > 0
        ? Math.round((count / totalCandidatesWithSkills) * 100)
        : 0
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  // Calculate score distribution
  const scoreRanges = [
    { range: '90-100%', min: 90, max: 100 },
    { range: '80-89%', min: 80, max: 89 },
    { range: '70-79%', min: 70, max: 79 },
    { range: '60-69%', min: 60, max: 69 },
    { range: 'Below 60%', min: 0, max: 59 }
  ];
  const scoreDistribution = scoreRanges.map(range => ({
    range: range.range,
    count: candidates.filter(c => {
      const score = c.analysis?.score || 0;
      return score >= range.min && score <= range.max;
    }).length
  }));

  // Generate recent activity from actual candidates
  const recentActivity: any[] = [];

  // Get recent candidates (last 10, sorted by creation date)
  const recentCandidates = [...candidates]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  recentCandidates.forEach(candidate => {
    const timeDiff = Date.now() - new Date(candidate.createdAt).getTime();
    const minutes = Math.floor(timeDiff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    let timeAgo = '';
    if (minutes < 1) timeAgo = 'Just now';
    else if (minutes < 60) timeAgo = `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    else if (hours < 24) timeAgo = `${hours} hour${hours > 1 ? 's' : ''} ago`;
    else timeAgo = `${days} day${days > 1 ? 's' : ''} ago`;

    recentActivity.push({
      action: 'Resume uploaded',
      candidate: `${candidate.firstName} ${candidate.lastName}`,
      time: timeAgo
    });
  });

  // Add shortlisted activity
  const shortlistedCandidates = candidates.filter(c => c.status === 'shortlisted')
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, 2);

  shortlistedCandidates.forEach(candidate => {
    const timeDiff = Date.now() - new Date(candidate.updatedAt).getTime();
    const minutes = Math.floor(timeDiff / 60000);
    const hours = Math.floor(minutes / 60);

    let timeAgo = '';
    if (minutes < 60) timeAgo = `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    else timeAgo = `${hours} hour${hours > 1 ? 's' : ''} ago`;

    recentActivity.push({
      action: 'Candidate shortlisted',
      candidate: `${candidate.firstName} ${candidate.lastName}`,
      time: timeAgo
    });
  });

  // Sort by time (most recent first) and limit to 5
  recentActivity.sort((a, b) => {
    // Simple sort - in real app, parse time strings properly
    return 0;
  }).slice(0, 5);

  res.json({
    success: true,
    data: {
      overview: {
        totalResumes,
        totalCandidates,
        averageScore,
        shortlistedCount,
        hiredCount,
      },
      scoreDistribution,
      recentActivity: recentActivity.slice(0, 5),
    },
  });
});

// Analytics endpoint (detailed analytics)
app.get('/api/analytics', (req, res) => {
  const totalCandidates = candidates.length;
  const averageScore = candidates.length > 0
    ? Math.round(candidates.reduce((sum, c) => sum + (c.analysis?.score || 0), 0) / candidates.length)
    : 0;
  const positionsFilled = candidates.filter(c => c.status === 'hired').length;

  // Calculate score distribution for analytics page
  const scoreRanges = [
    { range: "90-100%", min: 90, max: 100, color: "bg-accent" },
    { range: "80-89%", min: 80, max: 89, color: "bg-primary" },
    { range: "70-79%", min: 70, max: 79, color: "bg-primary/60" },
    { range: "60-69%", min: 60, max: 69, color: "bg-muted" },
    { range: "Below 60%", min: 0, max: 59, color: "bg-muted/40" },
  ];

  const scoreDistribution = scoreRanges.map(range => {
    const count = candidates.filter(c => {
      const score = c.analysis?.score || 0;
      return score >= range.min && score <= range.max;
    }).length;
    return {
      range: range.range,
      count,
      color: range.color,
      percentage: totalCandidates > 0 ? Math.round((count / totalCandidates) * 100) : 0
    };
  });

  // Calculate top skills with counts
  const skillCounts: { [key: string]: number } = {};
  candidates.forEach(candidate => {
    if (candidate.skills && Array.isArray(candidate.skills)) {
      candidate.skills.forEach(skill => {
        skillCounts[skill] = (skillCounts[skill] || 0) + 1;
      });
    }
  });

  const topSkills = Object.entries(skillCounts)
    .map(([skill, count]) => ({ skill, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  res.json({
    success: true,
    data: {
      totalCandidates,
      averageScore,
      positionsFilled,
      scoreDistribution,
      topSkills,
    },
  });
});

// Shortlisted candidates endpoint
app.get('/api/candidates/shortlisted', (req, res) => {
  const shortlisted = candidates
    .filter(c => c.status === 'shortlisted')
    .map(c => ({
      id: c.id,
      name: `${c.firstName} ${c.lastName}`,
      score: c.analysis?.score || 0,
      experience: `${c.experience || 0} years`,
      email: c.email || 'No email',
      skills: c.skills || [],
      createdAt: c.createdAt,
    }))
    .sort((a, b) => b.score - a.score); // Sort by score descending

  res.json({
    success: true,
    data: shortlisted,
  });
});

// Candidates CRUD operations
app.get('/api/candidates', (req, res) => {
  const { page = 1, limit = 10, status, jobId } = req.query;
  let filteredCandidates = candidates;

  // Filter by status (supports comma-separated)
  if (status) {
    const statuses = (status as string).split(',');
    filteredCandidates = filteredCandidates.filter(c => statuses.includes(c.status));
  }

  // Filter by job ID
  if (jobId) {
    filteredCandidates = filteredCandidates.filter(c => c.jobId === jobId);
  }

  const startIndex = (Number(page) - 1) * Number(limit);
  const endIndex = startIndex + Number(limit);
  const paginatedCandidates = filteredCandidates.slice(startIndex, endIndex);

  res.json({
    success: true,
    data: paginatedCandidates,
    pagination: {
      current: Number(page),
      pages: Math.ceil(filteredCandidates.length / Number(limit)),
      total: filteredCandidates.length,
    },
  });
});

app.get('/api/candidates/:id', (req, res) => {
  const candidate = findCandidateById(req.params.id);
  if (!candidate) {
    return res.status(404).json({ success: false, message: 'Candidate not found' });
  }
  return res.json({ success: true, data: candidate });
});

app.post('/api/candidates', (req, res) => {
  const newCandidate: Candidate = {
    id: generateId(),
    ...req.body,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  candidates.push(newCandidate);
  res.status(201).json({ success: true, data: newCandidate });
});

app.put('/api/candidates/:id', (req, res) => {
  const candidateIndex = candidates.findIndex(c => c.id === req.params.id);
  if (candidateIndex === -1) {
    return res.status(404).json({ success: false, message: 'Candidate not found' });
  }

  candidates[candidateIndex] = {
    ...candidates[candidateIndex],
    ...req.body,
    updatedAt: new Date(),
  };

  return res.json({ success: true, data: candidates[candidateIndex] });
});

app.delete('/api/candidates/:id', (req, res) => {
  const candidateIndex = candidates.findIndex(c => c.id === req.params.id);
  if (candidateIndex === -1) {
    return res.status(404).json({ success: false, message: 'Candidate not found' });
  }

  candidates.splice(candidateIndex, 1);
  return res.json({ success: true, message: 'Candidate deleted successfully' });
});

// Jobs CRUD operations
app.get('/api/jobs', (req, res) => {
  const { page = 1, limit = 10, status } = req.query;
  let filteredJobs = jobs;

  // Filter by status
  if (status) {
    filteredJobs = filteredJobs.filter(j => j.status === status);
  }

  const startIndex = (Number(page) - 1) * Number(limit);
  const endIndex = startIndex + Number(limit);
  const paginatedJobs = filteredJobs.slice(startIndex, endIndex);

  res.json({
    success: true,
    data: paginatedJobs,
    pagination: {
      current: Number(page),
      pages: Math.ceil(filteredJobs.length / Number(limit)),
      total: filteredJobs.length,
    },
  });
});

app.get('/api/jobs/:id', (req, res) => {
  const job = findJobById(req.params.id);
  if (!job) {
    return res.status(404).json({ success: false, message: 'Job not found' });
  }
  return res.json({ success: true, data: job });
});

app.post('/api/jobs', (req, res) => {
  const newJob: Job = {
    id: generateId(),
    ...req.body,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  jobs.push(newJob);
  res.status(201).json({ success: true, data: newJob });
});

app.put('/api/jobs/:id', (req, res) => {
  const jobIndex = jobs.findIndex(j => j.id === req.params.id);
  if (jobIndex === -1) {
    return res.status(404).json({ success: false, message: 'Job not found' });
  }

  jobs[jobIndex] = {
    ...jobs[jobIndex],
    ...req.body,
    updatedAt: new Date(),
  };

  return res.json({ success: true, data: jobs[jobIndex] });
});

app.delete('/api/jobs/:id', (req, res) => {
  const jobIndex = jobs.findIndex(j => j.id === req.params.id);
  if (jobIndex === -1) {
    return res.status(404).json({ success: false, message: 'Job not found' });
  }

  jobs.splice(jobIndex, 1);
  return res.json({ success: true, message: 'Job deleted successfully' });
});

// File upload endpoint (without immediate analysis)
app.post('/api/upload/resumes', upload.array('resumes', 10), async (req, res) => {
  try {
    console.log('Upload request received');
    console.log('Files:', req.files);
    console.log('Body:', req.body);

    const files = req.files as Express.Multer.File[];

    if (!files || files.length === 0) {
      console.log('No files uploaded');
      return res.status(400).json({
        success: false,
        message: 'No files uploaded'
      });
    }

    console.log(`Uploading ${files.length} files`);

    // Store uploaded files without analysis
    const uploadedFiles = files.map(file => ({
      id: generateId(),
      filename: file.filename,
      originalName: file.originalname,
      mimetype: file.mimetype,
      size: file.size,
      path: file.path,
      uploadedAt: new Date()
    }));

    return res.json({
      success: true,
      message: `${files.length} resume(s) uploaded successfully. Ready for screening.`,
      files: uploadedFiles
    });
  } catch (error) {
    console.error('Upload error:', error);
    return res.status(500).json({
      success: false,
      message: 'Upload failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});



// Centralized error handler for upload/multer and other runtime errors
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction): void => {
  if (err) {
    const isMulterError = err.name === 'MulterError';
    const isInvalidType = typeof err.message === 'string' && err.message.toLowerCase().includes('invalid file type');
    const status = isMulterError || isInvalidType ? 400 : 500;
    res.status(status).json({
      success: false,
      message: err.message || 'Unexpected server error',
    });
    return;
  }
  next();
});

// Resume screening endpoint (with job description requirement)
app.post('/api/screen/resumes', async (req, res) => {
  try {
    const { jobDescription, jobTitle, uploadedFiles } = req.body;

    if (!jobDescription || !jobTitle) {
      return res.status(400).json({
        success: false,
        message: 'Job title and description are required for screening'
      });
    }

    if (!uploadedFiles || uploadedFiles.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No files to screen. Please upload resumes first.'
      });
    }

    console.log(`Starting screening process for ${uploadedFiles.length} files`);
    console.log('Job Title:', jobTitle);
    console.log('Job Description:', jobDescription);

    // Process uploaded files and create candidates with AI analysis
    const newCandidates = await Promise.all(uploadedFiles.map(async (fileInfo: any, index: number) => {
      const candidateId = generateId();

      console.log(`Processing file ${index + 1}/${uploadedFiles.length}: ${fileInfo.originalName}`);

      // Extract text from the actual uploaded file
      const resumeText = await extractTextFromFile(fileInfo.path, fileInfo.mimetype);

      console.log(`Extracted resume text (${resumeText.length} characters):`, resumeText.substring(0, 200) + '...');

      // Use AI to analyze the actual resume content
      const aiAnalysis = await analyzeResume(resumeText, jobDescription);

      console.log(`AI Analysis completed: Score ${aiAnalysis.score}`);

      // Extract candidate information from AI analysis or local parser
      const extractedInfo = aiAnalysis.extractedInfo || extractCandidateInfoFromText(resumeText);

      // Parse name into first and last name
      const nameParts = extractedInfo.name.split(' ');
      const firstName = nameParts[0] || 'Unknown';
      const lastName = nameParts.slice(1).join(' ') || 'Candidate';

      const newCandidate: Candidate = {
        id: candidateId,
        firstName,
        lastName,
        email: extractedInfo.email,
        phone: extractedInfo.phone,
        location: extractedInfo.location,
        experience: extractedInfo.experience,
        skills: extractedInfo.skills,
        education: [
          {
            degree: extractedInfo.education,
            institution: 'Not specified',
            year: new Date().getFullYear() - extractedInfo.experience - 4
          }
        ],
        resumeFile: {
          filename: fileInfo.filename,
          originalName: fileInfo.originalName,
          mimetype: fileInfo.mimetype,
          size: fileInfo.size,
          path: fileInfo.path
        },
        analysis: {
          score: aiAnalysis.score,
          strengths: aiAnalysis.strengths,
          weaknesses: aiAnalysis.weaknesses,
          recommendations: aiAnalysis.recommendations,
          aiSummary: aiAnalysis.aiSummary,
          gapAnalysis: aiAnalysis.gapAnalysis,
          learningPath: aiAnalysis.learningPath
        },
        status: 'analyzed',
        jobId: generateId(), // Associate with job
        createdAt: new Date(),
        updatedAt: new Date()
      };

      return newCandidate;
    }));

    // Add new candidates to the array
    candidates.push(...newCandidates);

    // Sort new candidates by score descending
    newCandidates.sort((a, b) => (b.analysis?.score || 0) - (a.analysis?.score || 0));

    console.log(`Successfully screened ${newCandidates.length} candidates`);

    return res.json({
      success: true,
      message: `${uploadedFiles.length} resume(s) screened successfully`,
      jobTitle,
      jobDescription,
      candidates: newCandidates.map(c => ({
        id: c.id,
        name: `${c.firstName} ${c.lastName}`,
        email: c.email,
        score: c.analysis?.score,
        experience: c.experience,
        skills: c.skills,
        aiSummary: c.analysis?.aiSummary,
        strengths: c.analysis?.strengths,
        weaknesses: c.analysis?.weaknesses,
        recommendations: c.analysis?.recommendations,
        summary: c.analysis?.aiSummary,
        gapAnalysis: c.analysis?.gapAnalysis,
        learningPath: c.analysis?.learningPath
      }))
    });
  } catch (error) {
    console.error('Screening error:', error);
    return res.status(500).json({
      success: false,
      message: 'Screening failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Job improvement endpoint with AI
app.post('/api/jobs/improve', async (req, res) => {
  const { description } = req.body;

  if (!description) {
    return res.status(400).json({ success: false, message: 'Description is required' });
  }

  try {
    const improvedDescription = await improveJobDescription(description);

    return res.json({
      success: true,
      improvedDescription,
    });
  } catch (error) {
    console.error('Job improvement error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to improve job description',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Candidate screening endpoint
app.post('/api/candidates/screen', (req, res) => {
  const { jobTitle, jobDescription } = req.body;

  if (!jobTitle || !jobDescription) {
    return res.status(400).json({ success: false, message: 'Job title and description are required' });
  }

  // Mock screening - return existing candidates with scores
  const screenedCandidates = candidates.map(candidate => ({
    id: candidate.id,
    name: `${candidate.firstName} ${candidate.lastName}`,
    email: candidate.email,
    score: candidate.analysis?.score,
    experience: candidate.experience,
    skills: candidate.skills,
    education: candidate.education.map(edu => `${edu.degree} from ${edu.institution}`).join(', '),
    summary: candidate.analysis?.aiSummary,
    strengths: candidate.analysis?.strengths,
    weaknesses: candidate.analysis?.weaknesses,
    recommendations: candidate.analysis?.recommendations,
  }));

  return res.json({
    success: true,
    candidates: screenedCandidates,
    jobTitle,
    jobDescription,
  });
});

// AI Interview endpoints
app.post('/api/interview/questions', async (req, res) => {
  const { jobTitle, candidateSkills } = req.body;

  if (!jobTitle) {
    return res.status(400).json({ success: false, message: 'Job title is required' });
  }

  try {
    const questions = await generateInterviewQuestions(jobTitle, candidateSkills || []);

    return res.json({
      success: true,
      questions,
    });
  } catch (error) {
    console.error('Interview questions error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to generate interview questions',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Extract text from uploaded file
app.post('/api/interview/extract-text', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    const text = await extractTextFromFile(req.file.path, req.file.mimetype);

    return res.json({
      success: true,
      text: text
    });
  } catch (error) {
    console.error('Text extraction error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to extract text from file',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Job Seeker Resume Analysis Endpoint
app.post('/api/analyze/resume', upload.single('resume'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No resume file uploaded'
      });
    }

    console.log('Job seeker resume analysis request received');
    console.log('File:', req.file.originalname);

    // Extract text from resume
    let resumeText = '';
    try {
      if (req.file.mimetype === 'application/pdf') {
        const dataBuffer = fs.readFileSync(req.file.path);
        const pdfData = await pdfParse(dataBuffer);
        resumeText = pdfData.text;
      } else if (req.file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
        req.file.mimetype === 'application/msword') {
        const result = await mammoth.extractRawText({ path: req.file.path });
        resumeText = result.value;
      } else {
        resumeText = fs.readFileSync(req.file.path, 'utf-8');
      }
    } catch (parseError) {
      console.error('Error parsing resume file:', parseError);
      return res.status(400).json({
        success: false,
        message: 'Failed to parse resume file. Please ensure it is a valid PDF or Word document.'
      });
    }

    if (!resumeText || resumeText.trim().length < 50) {
      return res.status(400).json({
        success: false,
        message: 'Resume file appears to be empty or invalid'
      });
    }

    // Get optional job description
    const jobDescription = req.body.jobDescription || '';

    // Analyze resume with AI (with fallback handling)
    let analysis;
    try {
      if (jobDescription.trim()) {
        // Full analysis with job matching
        analysis = await analyzeResume(resumeText, jobDescription);
      } else {
        // General resume analysis without job matching
        analysis = await analyzeResumeForJobSeeker(resumeText);
      }
    } catch (analysisError) {
      console.error('Analysis failed, using fallback:', analysisError);
      // Use local fallback if AI fails
      const info = extractCandidateInfoFromText(resumeText);
      analysis = {
        overallScore: 70,
        strengths: ['Resume uploaded successfully', 'Ready for review'],
        weaknesses: ['AI analysis unavailable'],
        recommendations: ['Review your resume manually'],
        summary: `Resume extracted. Found ${info.experience} years of experience.`,
        extractedInfo: info,
      };
    }

    // Format response for job seeker (ensure all fields exist)
    const response = {
      name: analysis?.extractedInfo?.name || 'Not found',
      email: analysis?.extractedInfo?.email || 'Not found',
      skills: analysis?.extractedInfo?.skills || [],
      experience: analysis?.extractedInfo?.experience || 0,
      education: analysis?.extractedInfo?.education || 'Not specified',
      summary: analysis?.aiSummary || analysis?.summary || 'Resume analysis completed',
      strengths: analysis?.strengths || ['Resume processed successfully'],
      weaknesses: analysis?.weaknesses || ['Could be improved'],
      recommendations: analysis?.recommendations || ['Continue building your skills'],
      overallScore: analysis?.overallScore || analysis?.score || 70,
      matchScore: jobDescription.trim() ? (analysis?.score || 0) : undefined,
      gapAnalysis: analysis?.gapAnalysis || { missingSkills: [], experienceGaps: [] },
      learningPath: analysis?.learningPath || []
    };

    // Clean up uploaded file
    try {
      fs.unlinkSync(req.file.path);
    } catch (unlinkError) {
      console.log('Could not delete temp file:', unlinkError);
    }

    console.log('Sending Job Seeker Analysis Response:');
    console.log('Learning Path:', JSON.stringify(response.learningPath, null, 2));

    return res.json({
      success: true,
      analysis: response
    });
  } catch (error) {
    console.error('Job seeker resume analysis error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to analyze resume',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Helper function for general resume analysis (without job description)
const analyzeResumeForJobSeeker = async (resumeText: string): Promise<any> => {
  // Always extract info first as fallback
  const info = extractCandidateInfoFromText(resumeText);

  // If no API key, use local analysis
  if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === 'your-gemini-api-key-here') {
    console.log('Using local parser for job seeker analysis (no API key)');
    return {
      overallScore: 75, // Default score for general analysis
      strengths: ['Well-structured resume', 'Clear experience presentation'],
      weaknesses: ['Could add more quantifiable achievements'],
      recommendations: ['Highlight key achievements', 'Include relevant certifications'],
      summary: `Resume shows ${info.experience} years of experience with skills in ${info.skills.slice(0, 5).join(', ')}`,
      extractedInfo: info,
      gapAnalysis: {
        missingSkills: ['Advanced skills analysis unavailable (Local Mode)'],
        experienceGaps: ['Detailed experience gap analysis requires AI']
      },
      learningPath: [
        {
          title: 'Complete AI Setup',
          description: 'To get personalized learning paths, please configure the Gemini API key in the backend.',
          resources: ['Google AI Studio'],
          estimatedTime: '5 minutes'
        }
      ]
    };
  }

  // Try AI analysis with proper error handling
  try {
    const prompt = `
    Analyze this resume and provide comprehensive feedback for the job seeker:

    Resume Text: ${resumeText.substring(0, 5000)}

    Please provide:
    1. Overall Resume Quality Score (0-100)
    2. Key Strengths (top 5)
    3. Areas for Improvement (top 5)
    4. Actionable Recommendations (top 5)
    5. Overall Summary
    5. Overall Summary
    6. Extracted candidate information
    7. Gap Analysis (missing skills and experience gaps)
    8. Recommended Learning Path (Array of objects with: title, description, resources, estimatedTime)

    Return ONLY a single valid JSON object. Do NOT add any text before or after it.
    JSON must strictly conform to this schema:
    {
      "overallScore": number,
      "strengths": string[],
      "weaknesses": string[],
      "recommendations": string[],
      "summary": string,
      "extractedInfo": {
        "name": string,
        "email": string,
        "phone": string,
        "experience": number,
        "skills": string[],
        "education": string,
        "location": string
        "education": string,
        "location": string
      },
      "gapAnalysis": {
        "missingSkills": string[],
        "experienceGaps": string[]
      },
      "learningPath": {
        "title": string,
        "description": string,
        "resources": string[],
        "estimatedTime": string
      }[]
    }
    `;

    const analysisSchema: any = {
      type: 'object',
      properties: {
        overallScore: { type: 'number' },
        strengths: { type: 'array', items: { type: 'string' } },
        weaknesses: { type: 'array', items: { type: 'string' } },
        recommendations: { type: 'array', items: { type: 'string' } },
        summary: { type: 'string' },
        extractedInfo: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            email: { type: 'string' },
            phone: { type: 'string' },
            experience: { type: 'number' },
            skills: { type: 'array', items: { type: 'string' } },
            education: { type: 'string' },
            location: { type: 'string' },
          },
        },
        gapAnalysis: {
          type: 'object',
          properties: {
            missingSkills: { type: 'array', items: { type: 'string' } },
            experienceGaps: { type: 'array', items: { type: 'string' } }
          },
          required: ['missingSkills', 'experienceGaps']
        },
        learningPath: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              title: { type: 'string' },
              description: { type: 'string' },
              resources: { type: 'array', items: { type: 'string' } },
              estimatedTime: { type: 'string' }
            },
            required: ['title', 'description', 'resources', 'estimatedTime']
          }
        }
      },
      required: ['overallScore', 'strengths', 'weaknesses', 'recommendations', 'summary', 'extractedInfo', 'gapAnalysis', 'learningPath']
    };

    try {
      const parsed = await generateJson(prompt, analysisSchema);
      if (parsed && typeof parsed === 'object' && parsed.overallScore !== undefined) {
        console.log('AI analysis successful for job seeker');
        return parsed;
      }
    } catch (jsonError) {
      console.log('generateJson failed, trying generateText fallback:', jsonError);
    }

    // Fallback to generateText
    try {
      const rawText = await generateText(prompt);
      if (rawText && rawText.trim()) {
        const manualParse = parseJsonFromText(rawText);
        if (manualParse && manualParse.overallScore !== undefined) {
          console.log('Manual parse from generateText successful');
          return manualParse;
        }
      }
    } catch (textError) {
      console.log('generateText also failed, using local fallback:', textError);
    }
  } catch (error) {
    console.error('AI analysis error (using fallback):', error);
  }

  // Final fallback - always return valid response
  console.log('Using local fallback analysis for job seeker');
  const skillList = info.skills.length > 0 ? info.skills.slice(0, 5).join(', ') : 'various technical skills';
  return {
    overallScore: 75,
    strengths: [
      'Well-structured resume',
      'Clear experience presentation',
      info.skills.length > 0 ? `Strong technical skills: ${skillList}` : 'Good professional background'
    ],
    weaknesses: [
      'Could add more quantifiable achievements',
      'Consider adding certifications',
      'Include metrics to demonstrate impact'
    ],
    recommendations: [
      'Highlight key achievements with metrics',
      'Include relevant certifications',
      'Add a professional summary section',
      'Quantify your accomplishments with numbers'
    ],
    summary: `Resume analysis completed. Found ${info.experience} years of experience${info.skills.length > 0 ? ` with skills in ${skillList}` : ''}.`,
    extractedInfo: info,
    gapAnalysis: {
      missingSkills: ['Advanced skills analysis unavailable (Local Mode)'],
      experienceGaps: ['Detailed experience gap analysis requires AI']
    },
    learningPath: [
      {
        title: 'Complete AI Setup',
        description: 'To get personalized learning paths, please configure the Gemini API key in the backend.',
        resources: ['Google AI Studio'],
        estimatedTime: '5 minutes'
      }
    ]
  };
};

// Resume analysis endpoint for interview
app.post('/api/interview/analyze-resume', async (req, res) => {
  const { resumeText, jobDescription, jobTitle } = req.body;

  if (!resumeText) {
    return res.status(400).json({
      success: false,
      message: 'Resume text is required'
    });
  }

  // Use provided JD or a default generic one
  const targetJobDescription = jobDescription || "General Professional Role requiring strong communication and technical skills.";

  try {
    const analysis = await analyzeResume(resumeText, targetJobDescription);

    return res.json({
      success: true,
      analysis: analysis
    });
  } catch (error) {
    console.error('Resume analysis error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to analyze resume',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Real-time interview conversation endpoint with context
app.post('/api/interview/conversation', async (req, res) => {
  const { message, conversationHistory, jobTitle, jobDescription, resumeAnalysis, candidateSkills } = req.body;

  if (!message) {
    return res.status(400).json({ success: false, message: 'Message is required' });
  }

  try {
    // Build conversation context
    const historyContext = conversationHistory && conversationHistory.length > 0
      ? conversationHistory.slice(-10).map((msg: any) =>
        `${msg.role === 'user' ? 'Candidate' : 'Interviewer'}: ${msg.content}`
      ).join('\n')
      : '';

    // Build resume analysis context
    let resumeContext = '';
    if (resumeAnalysis) {
      const info = resumeAnalysis.extractedInfo || {};
      resumeContext = `
RESUME ANALYSIS SUMMARY:
- Candidate Experience: ${info.experience || 0} years
- Key Skills: ${info.skills?.join(', ') || 'Not specified'}
- Match Score: ${resumeAnalysis.score || 0}/100
- Strengths: ${resumeAnalysis.strengths?.join(', ') || 'Not specified'}
- Areas to Explore: ${resumeAnalysis.weaknesses?.join(', ') || 'Not specified'}
- Summary: ${resumeAnalysis.aiSummary || 'No summary available'}
`;
    }

    const systemPrompt = `You are a professional, experienced interviewer conducting a formal job interview for a ${jobTitle || 'position'}.

JOB DESCRIPTION:
${jobDescription || 'Not provided'}

${resumeContext}

${candidateSkills && candidateSkills.length > 0 ? `CANDIDATE SKILLS: ${candidateSkills.join(', ')}` : ''}

YOUR ROLE AS INTERVIEWER:
- Act professionally and formally, like a real hiring manager
- Ask targeted questions based on the job description and candidate's resume
- Focus on areas where the candidate's experience aligns with job requirements
- Explore gaps or areas mentioned in the resume analysis
- Ask behavioral questions using STAR method (Situation, Task, Action, Result)
- Ask technical questions relevant to the position
- Be respectful but thorough in your questioning
- Keep questions clear and specific
- After candidate responds, ask follow-up questions or move to next topic
- Do NOT provide feedback or scores during the interview
- Maintain professional interview tone throughout

${historyContext ? `\nPREVIOUS CONVERSATION:\n${historyContext}\n` : ''}

CANDIDATE'S RESPONSE: ${message}

Respond as the professional interviewer. Ask your next question or follow up on their response. Keep your response to 1-2 sentences for questions, or 2-3 sentences if providing context before a question. Be professional and focused.`;

    const aiResponse = await generateText(systemPrompt);

    // Analyze the candidate's response in real-time
    let analysis = null;
    if (conversationHistory && conversationHistory.length > 0) {
      const lastQuestion = conversationHistory
        .filter((msg: any) => msg.role === 'assistant')
        .slice(-1)[0]?.content || '';

      if (lastQuestion) {
        try {
          const analysisPrompt = `
          Provide a quick real-time analysis of this interview response:
          
          Question: ${lastQuestion}
          Response: ${message}
          Job: ${jobTitle || 'General position'}
          
          Return JSON:
          {
            "score": number (0-100),
            "strengths": string[],
            "improvements": string[],
            "assessment": string (brief, 1-2 sentences)
          }`;

          const analysisText = await generateText(analysisPrompt);
          const parsed = parseJsonFromText(analysisText);
          if (parsed) analysis = parsed;
        } catch (err) {
          console.error('Real-time analysis error:', err);
        }
      }
    }

    return res.json({
      success: true,
      response: aiResponse || "Thank you for your response. Can you tell me more about that?",
      analysis: analysis,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Interview conversation error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to process conversation',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Real-time response analysis endpoint (faster, lighter)
app.post('/api/interview/analyze-realtime', async (req, res) => {
  const { response, question, jobTitle } = req.body;

  if (!response || !question) {
    return res.status(400).json({ success: false, message: 'Response and question are required' });
  }

  try {
    const prompt = `
    Quick analysis (be concise):
    Question: ${question}
    Response: ${response}
    Job: ${jobTitle || 'General'}
    
    JSON only:
    {
      "score": number,
      "strengths": string[],
      "improvements": string[],
      "assessment": string
    }`;

    const text = await generateText(prompt);
    const parsed = parseJsonFromText(text);

    if (parsed) {
      return res.json({
        success: true,
        analysis: parsed,
      });
    }

    // Fallback
    return res.json({
      success: true,
      analysis: {
        score: 75,
        strengths: ['Clear communication'],
        improvements: ['Could add more specific examples'],
        assessment: 'Good response, consider adding more detail.'
      }
    });
  } catch (error) {
    console.error('Real-time analysis error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to analyze response',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

app.post('/api/interview/analyze', async (req, res) => {
  const { candidateResponse, question, jobTitle } = req.body;

  if (!candidateResponse || !question) {
    return res.status(400).json({ success: false, message: 'Candidate response and question are required' });
  }

  try {
    const prompt = `
    Analyze this interview response for a ${jobTitle} position:
    
    Question: ${question}
    Candidate Response: ${candidateResponse}
    
    Provide:
    1. Score (0-100)
    2. Strengths in the response
    3. Areas for improvement
    4. Overall assessment
    
    Format as JSON:
    {
      "score": number,
      "strengths": string[],
      "improvements": string[],
      "assessment": string
    }
    `;

    const text = await generateText(prompt);

    try {
      const analysis = JSON.parse(text);
      return res.json({
        success: true,
        analysis,
      });
    } catch (parseError) {
      return res.json({
        success: true,
        analysis: {
          score: 75,
          strengths: ['Good communication', 'Relevant experience'],
          improvements: ['Could provide more specific examples'],
          assessment: text.substring(0, 200) + '...'
        }
      });
    }
  } catch (error) {
    console.error('Interview analysis error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to analyze interview response',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Send OTP endpoint
app.post('/api/auth/send-otp', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ success: false, message: 'Email is required' });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Check if user already exists
    let existingUser = null;
    if (mongoose.connection.readyState === 1 && User) {
      try {
        existingUser = await User.findOne({ email: normalizedEmail });
      } catch (err) {
        // Continue with in-memory check
      }
    }

    if (!existingUser) {
      existingUser = users.find(u => u.email === normalizedEmail);
    }

    if (existingUser) {
      return res.status(400).json({ success: false, message: 'User with this email already exists' });
    }

    // Remove old OTPs for this email
    otpStore = otpStore.filter(entry => entry.email !== normalizedEmail);

    // Generate new OTP
    const otp = generateOTP();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Store OTP
    otpStore.push({
      email: normalizedEmail,
      otp,
      expiresAt,
      attempts: 0,
    });

    // Send OTP email
    const emailSent = await sendOTPEmail(normalizedEmail, otp);

    if (!emailSent && transporter) {
      return res.status(500).json({
        success: false,
        message: 'Failed to send OTP email. Please check email configuration.'
      });
    }

    return res.json({
      success: true,
      message: emailSent
        ? 'OTP sent to your email address'
        : `OTP generated (email not configured): ${otp}`,
      // In development, return OTP if email not configured
      ...(process.env.NODE_ENV === 'development' && !emailSent ? { otp } : {}),
    });
  } catch (error: any) {
    console.error('Send OTP error:', error);
    return res.status(500).json({ success: false, message: 'Failed to send OTP' });
  }
});

// Verify OTP endpoint
app.post('/api/auth/verify-otp', async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ success: false, message: 'Email and OTP are required' });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const otpEntry = otpStore.find(entry => entry.email === normalizedEmail);

    if (!otpEntry) {
      return res.status(400).json({ success: false, message: 'OTP not found. Please request a new OTP.' });
    }

    // Check if OTP expired
    if (new Date() > otpEntry.expiresAt) {
      otpStore = otpStore.filter(entry => entry.email !== normalizedEmail);
      return res.status(400).json({ success: false, message: 'OTP has expired. Please request a new one.' });
    }

    // Check attempts (max 5 attempts)
    if (otpEntry.attempts >= 5) {
      otpStore = otpStore.filter(entry => entry.email !== normalizedEmail);
      return res.status(400).json({ success: false, message: 'Too many failed attempts. Please request a new OTP.' });
    }

    // Verify OTP
    if (otpEntry.otp !== otp) {
      otpEntry.attempts++;
      return res.status(400).json({
        success: false,
        message: `Invalid OTP. ${5 - otpEntry.attempts} attempts remaining.`
      });
    }

    // OTP verified - mark as verified
    otpEntry.verified = true;

    return res.json({
      success: true,
      message: 'Email verified successfully',
    });
  } catch (error: any) {
    console.error('Verify OTP error:', error);
    return res.status(500).json({ success: false, message: 'Failed to verify OTP' });
  }
});

// Forgot Password - Send OTP
app.post('/api/auth/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ success: false, message: 'Email is required' });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Check if user exists
    let user = null;
    if (mongoose.connection.readyState === 1 && User) {
      try {
        user = await User.findOne({ email: normalizedEmail });
      } catch (err) {
        // Continue with in-memory check
      }
    }

    if (!user) {
      user = users.find(u => u.email === normalizedEmail);
    }

    // Don't reveal if user exists or not (security best practice)
    // But we still need to check internally
    if (!user) {
      // Return success even if user doesn't exist (prevent email enumeration)
      return res.json({
        success: true,
        message: 'If an account exists with this email, an OTP has been sent.',
      });
    }

    // Remove old OTPs for this email
    otpStore = otpStore.filter(entry => entry.email !== normalizedEmail);

    // Generate new OTP
    const otp = generateOTP();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Store OTP with reset flag
    otpStore.push({
      email: normalizedEmail,
      otp,
      expiresAt,
      attempts: 0,
      isPasswordReset: true, // Flag to distinguish from signup OTP
    });

    // Send OTP email
    const emailSent = await sendPasswordResetOTPEmail(normalizedEmail, otp);

    if (!emailSent && transporter) {
      return res.status(500).json({
        success: false,
        message: 'Failed to send OTP email. Please check email configuration.'
      });
    }

    return res.json({
      success: true,
      message: 'If an account exists with this email, an OTP has been sent.',
      // In development, return OTP if email not configured
      ...(process.env.NODE_ENV === 'development' && !emailSent ? { otp } : {}),
    });
  } catch (error: any) {
    console.error('Forgot password error:', error);
    return res.status(500).json({ success: false, message: 'Failed to process request' });
  }
});

// Verify Reset OTP
app.post('/api/auth/verify-reset-otp', async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ success: false, message: 'Email and OTP are required' });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const otpEntry = otpStore.find(entry => entry.email === normalizedEmail && entry.isPasswordReset);

    if (!otpEntry) {
      return res.status(400).json({ success: false, message: 'OTP not found. Please request a new OTP.' });
    }

    // Check if OTP expired
    if (new Date() > otpEntry.expiresAt) {
      otpStore = otpStore.filter(entry => entry.email !== normalizedEmail || !entry.isPasswordReset);
      return res.status(400).json({ success: false, message: 'OTP has expired. Please request a new one.' });
    }

    // Check attempts (max 5 attempts)
    if (otpEntry.attempts >= 5) {
      otpStore = otpStore.filter(entry => entry.email !== normalizedEmail || !entry.isPasswordReset);
      return res.status(400).json({ success: false, message: 'Too many failed attempts. Please request a new OTP.' });
    }

    // Verify OTP
    if (otpEntry.otp !== otp) {
      otpEntry.attempts++;
      return res.status(400).json({
        success: false,
        message: `Invalid OTP. ${5 - otpEntry.attempts} attempts remaining.`
      });
    }

    // OTP verified - mark as verified
    otpEntry.verified = true;

    return res.json({
      success: true,
      message: 'OTP verified successfully. You can now reset your password.',
    });
  } catch (error: any) {
    console.error('Verify reset OTP error:', error);
    return res.status(500).json({ success: false, message: 'Failed to verify OTP' });
  }
});

// Reset Password
app.post('/api/auth/reset-password', async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;

    if (!email || !newPassword) {
      return res.status(400).json({ success: false, message: 'Email and new password are required' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters long' });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Verify OTP first
    const otpEntry = otpStore.find(entry => entry.email === normalizedEmail && entry.isPasswordReset);
    if (!otpEntry || !otpEntry.verified) {
      return res.status(400).json({
        success: false,
        message: 'Please verify your email with OTP first'
      });
    }

    // Check if OTP is still valid (not expired)
    if (new Date() > otpEntry.expiresAt) {
      otpStore = otpStore.filter(entry => entry.email !== normalizedEmail || !entry.isPasswordReset);
      return res.status(400).json({
        success: false,
        message: 'OTP has expired. Please request a new one and verify again.'
      });
    }

    // Find and update user
    let user: any = null;
    if (mongoose.connection.readyState === 1 && User) {
      try {
        user = await User.findOne({ email: normalizedEmail });
        if (user) {
          user.password = newPassword; // In production, hash this password
          await user.save();
        }
      } catch (err) {
        console.log('⚠️  MongoDB operation failed, using in-memory fallback');
      }
    }

    // Fallback to in-memory
    if (!user) {
      user = users.find(u => u.email === normalizedEmail);
      if (user) {
        user.password = newPassword; // In production, hash this password
        user.updatedAt = new Date();
      }
    }

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Remove OTP after successful password reset
    otpStore = otpStore.filter(entry => entry.email !== normalizedEmail || !entry.isPasswordReset);

    return res.json({
      success: true,
      message: 'Password has been reset successfully. You can now login with your new password.',
    });
  } catch (error: any) {
    console.error('Reset password error:', error);
    return res.status(500).json({ success: false, message: 'Failed to reset password' });
  }
});

// Authentication endpoints
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Try MongoDB first, fallback to in-memory
    let user: any = null;
    if (mongoose.connection.readyState === 1) {
      user = await User.findOne({ email: email.toLowerCase() });
      if (user && user.password === password) {
        // Update last login
        user.lastLogin = new Date();
        await user.save();
      } else {
        user = null;
      }
    } else {
      // Fallback to in-memory
      user = users.find(u => u.email === email && u.password === password);
      if (user) {
        user.lastLogin = new Date();
        user.updatedAt = new Date();
      }
    }

    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    return res.json({
      success: true,
      data: {
        user: {
          id: user._id?.toString() || user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          company: user.company,
        },
        token: 'mock-jwt-token', // In real app, generate JWT
      },
    });
  } catch (error: any) {
    console.error('Login error:', error);
    return res.status(500).json({ success: false, message: 'Login failed' });
  }
});

app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password, firstName, lastName, company, role, otp } = req.body;

    if (!email || !password || !firstName || !lastName) {
      return res.status(400).json({ success: false, message: 'All required fields must be provided' });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Verify OTP first
    const otpEntry = otpStore.find(entry => entry.email === normalizedEmail);
    if (!otpEntry || !otpEntry.verified) {
      return res.status(400).json({
        success: false,
        message: 'Please verify your email with OTP first'
      });
    }

    // Check if OTP is still valid (not expired)
    if (new Date() > otpEntry.expiresAt) {
      otpStore = otpStore.filter(entry => entry.email !== normalizedEmail);
      return res.status(400).json({
        success: false,
        message: 'OTP has expired. Please request a new one and verify again.'
      });
    }

    // Try MongoDB first, fallback to in-memory
    if (mongoose.connection.readyState === 1 && User) {
      try {
        // Check if user already exists
        const existingUser = await User.findOne({ email: normalizedEmail });
        if (existingUser) {
          return res.status(400).json({ success: false, message: 'User already exists' });
        }

        const newUser = new User({
          email: normalizedEmail,
          password, // In real app, hash this
          firstName,
          lastName,
          company,
          role: role || 'recruiter',
          isActive: true,
        });

        const savedUser = await newUser.save();

        // Remove OTP after successful registration
        otpStore = otpStore.filter(entry => entry.email !== normalizedEmail);

        return res.status(201).json({
          success: true,
          data: {
            user: {
              id: savedUser.id,
              email: savedUser.email,
              firstName: savedUser.firstName,
              lastName: savedUser.lastName,
              role: savedUser.role,
              company: savedUser.company,
            },
            token: 'mock-jwt-token',
          },
        });
      } catch (dbError: any) {
        console.log('⚠️  MongoDB operation failed, using in-memory fallback:', dbError.message);
        // Fall through to in-memory storage
      }
    }

    // Fallback to in-memory if MongoDB not available or operation failed
    if (users.find(u => u.email === normalizedEmail)) {
      return res.status(400).json({ success: false, message: 'User already exists' });
    }

    const newUser: any = {
      id: generateId(),
      email: normalizedEmail,
      password, // In real app, hash this
      firstName,
      lastName,
      company,
      role: role || 'recruiter',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    users.push(newUser);

    // Remove OTP after successful registration
    otpStore = otpStore.filter(entry => entry.email !== normalizedEmail);

    return res.status(201).json({
      success: true,
      data: {
        user: {
          id: newUser.id,
          email: newUser.email,
          firstName: newUser.firstName,
          lastName: newUser.lastName,
          role: newUser.role,
          company: newUser.company,
        },
        token: 'mock-jwt-token',
      },
    });
  } catch (error: any) {
    console.error('Registration error:', error);
    return res.status(500).json({ success: false, message: 'Registration failed' });
  }
});

// Database connection
const connectDB = async () => {
  try {
    const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/ai-resume-screening';

    if (!process.env.MONGODB_URI) {
      console.log('⚠️  MONGODB_URI not set, using default: mongodb://localhost:27017/ai-resume-screening');
      console.log('💡 Set MONGODB_URI in .env file to use a custom MongoDB connection');
    }

    const conn = await mongoose.connect(MONGODB_URI, {
      // Remove deprecated options - mongoose 6+ handles these automatically
    });

    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    console.log(`📊 Database: ${conn.connection.name}`);

    // Create default admin user if it doesn't exist
    const adminExists = await User.findOne({ email: 'admin@talentaura.com' });
    if (!adminExists) {
      const defaultAdmin = new User({
        email: 'admin@talentaura.com',
        password: 'admin123', // In production, hash this password
        firstName: 'Admin',
        lastName: 'User',
        company: 'Talent Aura',
        role: 'admin',
        isActive: true,
      });
      await defaultAdmin.save();
      console.log('👤 Default admin user created: admin@talentaura.com / admin123');
    }

    return conn;
  } catch (error: any) {
    console.error('❌ MongoDB connection error:', error.message);
    console.error('⚠️  Falling back to in-memory storage');
    return null;
  }
};

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully');
  if (mongoose.connection.readyState === 1) {
    await mongoose.connection.close();
    console.log('MongoDB connection closed');
  }
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT received, shutting down gracefully');
  if (mongoose.connection.readyState === 1) {
    await mongoose.connection.close();
    console.log('MongoDB connection closed');
  }
  process.exit(0);
});

// Interview Endpoint
app.post('/api/interview/process', async (req, res) => {
  try {
    const { history, candidateName, jobTitle, questionCount } = req.body;
    const count = parseInt(String(questionCount || 0), 10);
    console.log(`Interview Process: Count=${count} (received: ${questionCount})`);
    console.log('Interview History:', JSON.stringify(history, null, 2));

    // Check if interview is complete (3 questions asked)
    if (count >= 3) {
      const prompt = `
      You are an expert technical recruiter conducting a phone screen for a ${jobTitle} position.
      The candidate's name is ${candidateName}.
      
      Here is the transcript of the interview so far:
      ${JSON.stringify(history)}
      
      The interview is now over. Please provide a brief, professional summary of the candidate's responses and their potential fit for the role.
      Address the candidate directly in the summary as if you are closing the call.
      Keep it under 100 words.
      `;

      const summary = await generateText(prompt);

      return res.json({
        isComplete: true,
        summary: summary || "Thank you for your time. We will review your responses and get back to you shortly.",
        nextQuestion: null
      });
    }

    // Generate next question
    const prompt = `
    You are an expert technical recruiter conducting a phone screen for a ${jobTitle} position.
    The candidate's name is ${candidateName}.
    
    Here is the transcript of the interview so far:
    ${JSON.stringify(history)}
    
    Your goal is to screen the candidate for basic qualifications and communication skills.
    You have asked ${questionCount} questions so far.
    
    Please generate the NEXT question to ask. 
    - You must NOT repeat any question that has already been asked (check the transcript).
    - If this is the first question (history is empty or just intro), ask about their background.
    - If they just answered a question, acknowledge their answer briefly and ask a RELEVANT follow-up or move to a new topic (technical skills, availability, etc.).
    - Keep the question conversational, professional, and concise (under 2 sentences).
    - Do NOT include "Candidate:" or "Recruiter:" prefixes. Just the spoken text.
    `;

    const nextQuestion = await generateText(prompt);

    return res.json({
      isComplete: false,
      summary: null,
      nextQuestion: nextQuestion || "Could you tell me a bit about your background and experience relevant to this role?"
    });

  } catch (error) {
    console.error('Error in interview process:', error);
    return res.status(500).json({ error: 'Failed to process interview' });
  }
});

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
      "score": number,
      "summary": string, 
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

    // 2. Save/Update Candidate (Hybrid Approach: DB + In-Memory)
    let savedCandidate = null;

    // A. Mongoose Logic
    if (mongoose.connection.readyState === 1 && Candidate) {
      try {
        let candidate = await Candidate.findOne({ name: candidateName, jobRole: jobTitle });
        if (!candidate) {
          candidate = new Candidate({
            name: candidateName,
            email: `${candidateName.toLowerCase().replace(/\s+/g, '.')}@example.com`,
            phone: 'Not provided',
            jobRole: jobTitle,
            skills: [],
            experience: 0,
            location: 'Remote',
            atsScore: result.score,
            status: 'shortlisted',
            interviewScore: result.score,
            interviewSummary: result.summary,
            interviewDate: new Date()
          });
        } else {
          candidate.interviewScore = result.score;
          candidate.interviewSummary = result.summary;
          candidate.status = result.score > 60 ? 'shortlisted' : 'Phone Screened';
          candidate.interviewDate = new Date();
          if (result.score) candidate.atsScore = Math.max(candidate.atsScore || 0, result.score);
        }
        savedCandidate = await candidate.save();
      } catch (e) {
        console.error('Mongoose save failed:', e);
      }
    }

    // B. In-Memory Logic (for reliability if DB fails or using simple mode)
    // Find in array
    let memCandidateIndex = candidates.findIndex(c => c.name === candidateName && c.jobRole === jobTitle);
    if (memCandidateIndex === -1) {
      // Create new
      const newMemCandidate: any = {
        id: generateId(),
        name: candidateName,
        email: `${candidateName.toLowerCase().replace(/\s+/g, '.')}@example.com`,
        jobRole: jobTitle,
        experience: 0,
        skills: [],
        atsScore: result.score,
        status: result.score > 60 ? 'shortlisted' : 'Phone Screened',
        interviewScore: result.score,
        interviewSummary: result.summary,
        interviewDate: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
      };
      candidates.push(newMemCandidate);
      if (!savedCandidate) savedCandidate = newMemCandidate;
    } else {
      // Update existing
      candidates[memCandidateIndex] = {
        ...candidates[memCandidateIndex],
        interviewScore: result.score,
        interviewSummary: result.summary,
        status: result.score > 60 ? 'shortlisted' : 'Phone Screened',
        interviewDate: new Date(),
        updatedAt: new Date()
      };
      if (!savedCandidate) savedCandidate = candidates[memCandidateIndex];
    }

    console.log(`✅ Interview finalized for ${candidateName}. Score: ${result.score}`);

    return res.json({
      success: true,
      result: result,
      savedId: savedCandidate?._id || savedCandidate?.id
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

// Start server
const startServer = async () => {
  const dbConnection = await connectDB();
  app.listen(PORT, async () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📊 Environment: ${process.env.NODE_ENV}`);
    console.log(`🌐 Frontend URL: ${process.env.FRONTEND_URL}`);
    console.log(`🔗 Health check: http://localhost:${PORT}/health`);
    console.log(`🧪 Test endpoint: http://localhost:${PORT}/api/test`);
    console.log(`📊 Dashboard data: http://localhost:${PORT}/api/dashboard`);
    console.log(`👥 Candidates data: http://localhost:${PORT}/api/candidates`);
    console.log(`💼 Jobs data: http://localhost:${PORT}/api/jobs`);
    console.log(`📁 File upload: http://localhost:${PORT}/api/upload/resumes`);
    console.log(`🤖 AI Job improvement: http://localhost:${PORT}/api/jobs/improve`);
    console.log(`🎯 AI Interview questions: http://localhost:${PORT}/api/interview/questions`);
    console.log(`📝 AI Interview analysis: http://localhost:${PORT}/api/interview/analyze`);
    console.log(`🔐 Auth endpoints: http://localhost:${PORT}/api/auth/login`);
    console.log('');
    console.log('✅ Backend is ready with FULL AI functionality!');
    if (dbConnection && mongoose.connection.readyState === 1) {
      console.log('🗄️ Using MongoDB database');
      try {
        const candidateCount = await Candidate.countDocuments();
        const jobCount = await Job.countDocuments();
        const userCount = await User.countDocuments();
        console.log(`📊 Current data: ${candidateCount} candidates, ${jobCount} jobs, ${userCount} users`);
      } catch (err) {
        console.log('📊 Database connected, counting documents...');
      }
    } else {
      console.log('🗄️ Using in-memory storage (MongoDB not connected)');
      console.log(`📊 Current data: ${candidates.length} candidates, ${jobs.length} jobs, ${users.length} users`);
    }
    console.log('🤖 AI Features: Resume analysis, Job improvement, Interview questions & analysis');
    console.log(`🔑 Gemini API: ${process.env.GEMINI_API_KEY ? '✅ Configured' : '❌ Not configured'}`);
  });
};

startServer().catch((error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});

export default app;

