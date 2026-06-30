import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 3001;
const prisma = new PrismaClient();

// Middleware
app.use(cors());
app.use(express.json());

// Servir archivos estáticos del frontend en producción
app.use(express.static(path.join(__dirname, '../dist')));

// Basic health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date() });
});

// --- AUTHENTICATION ---

const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-amor-agape-key-123';

const verifyToken = (req: any, res: any, next: any) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: 'Acceso denegado' });
  
  const token = authHeader.split(' ')[1];
  try {
    const verified = jwt.verify(token, JWT_SECRET);
    req.user = verified;
    next();
  } catch (error) {
    res.status(400).json({ error: 'Token inválido' });
  }
};

app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !user.password) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }
    
    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    const token = jwt.sign({ userId: user.id, role: user.role }, JWT_SECRET, { expiresIn: '24h' });
    res.json({ token, user: { id: user.id, email: user.email, name: user.name, role: user.role } });
  } catch (error) {
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// --- SURVEYS API ---

// Get all surveys
app.get('/api/surveys', async (req, res) => {
  try {
    const surveys = await prisma.survey.findMany({
      include: {
        levels: true
      }
    });
    res.json(surveys);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch surveys' });
  }
});

// Get single survey with questions and levels
app.get('/api/surveys/:id', async (req, res) => {
  try {
    const survey = await prisma.survey.findUnique({
      where: { id: req.params.id },
      include: {
        questions: true,
        levels: true,
      },
    });
    if (!survey) return res.status(404).json({ error: 'Survey not found' });
    res.json(survey);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch survey' });
  }
});

// Create survey with default structure
app.post('/api/surveys', verifyToken, async (req, res) => {
  try {
    const { name, description } = req.body;
    const survey = await prisma.survey.create({
      data: { 
        name, 
        description,
        adaptiveRules: "Si Dom 1 < 3 pts → Saltar Dom 2 y pasar a Dom 3",
        levels: {
          create: [
            {
              name: 'ZONA VERDE',
              minScore: 0,
              maxScore: 30,
              description: 'Posees una base sólida de respeto. Requiere un enfoque de consolidación y nutrición de tu Amor Ágape.',
              clinicalApproach: 'Consolidación del amor propio incondicional y prevención primaria.'
            },
            {
              name: 'ZONA AMARILLA',
              minScore: 31,
              maxScore: 75,
              description: 'Alerta preventiva. Hay presencia de conductas de descuido emocional y rigidez cognitiva autopunitiva.',
              clinicalApproach: 'Intervención temprana cognitivo-conductual y psicoeducación de autocompasión.'
            },
            {
              name: 'ZONA ROJA',
              minScore: 76,
              maxScore: 130,
              description: 'Riesgo a tu integridad psicofísica. Ejerces niveles elevados de castigo y coacción interna.',
              clinicalApproach: 'Reestructuración cognitiva profunda, terapia de aceptación y compromiso (ACT), acompañamiento psicoterapéutico.'
            },
            {
              name: 'ZONA CRÍTICA',
              minScore: 131,
              maxScore: 186,
              description: 'Tu seguridad y bienestar psicológico están en una fase extremadamente vulnerable.',
              clinicalApproach: 'Protocolo de prevención de conducta de riesgo inminente, desactivación de crisis agudas.'
            }
          ]
        }
      },
      include: {
        levels: true
      }
    });
    res.json(survey);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to create survey' });
  }
});

// --- USERS API ---

app.get('/api/users', verifyToken, async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      select: { id: true, email: true, name: true, role: true, createdAt: true },
    });
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

app.post('/api/users', verifyToken, async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    
    // Check if user exists
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return res.status(400).json({ error: 'El correo ya está registrado.' });
    }

    let hashedPassword = null;
    if (role === 'ADMIN' && password) {
      hashedPassword = await bcrypt.hash(password, 10);
    }

    const newUser = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: role === 'ADMIN' ? 'ADMIN' : 'CLIENT'
      }
    });

    res.json({ id: newUser.id, name: newUser.name, email: newUser.email, role: newUser.role, createdAt: newUser.createdAt });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to create user' });
  }
});

// --- RESULTS API ---

app.get('/api/results', verifyToken, async (req, res) => {
  try {
    const results = await prisma.surveyResult.findMany({
      include: {
        user: { select: { name: true, email: true } },
        survey: { select: { name: true } },
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json(results);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch results' });
  }
});

app.post('/api/results', async (req, res) => {
  try {
    const { surveyId, score, zone, answers, patient } = req.body;
    
    // UPSERT USER
    let user = await prisma.user.findUnique({ where: { email: patient.email } });
    if (!user) {
      user = await prisma.user.create({
        data: {
          email: patient.email,
          name: patient.name,
          role: 'CLIENT'
        }
      });
    }

    const result = await prisma.surveyResult.create({
      data: {
        userId: user.id,
        surveyId,
        score,
        zone,
        answers
      }
    });

    res.json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to save result' });
  }
});

// --- STATS API ---

app.get('/api/stats', verifyToken, async (req, res) => {
  try {
    const totalPatients = await prisma.user.count({ where: { role: 'CLIENT' } });
    const totalSurveys = await prisma.surveyResult.count();
    
    const results = await prisma.surveyResult.findMany({
      select: { score: true, zone: true }
    });
    
    const avgScore = totalSurveys > 0 ? (results.reduce((acc, curr) => acc + curr.score, 0) / totalSurveys).toFixed(1) : '0.0';
    const sosCount = results.filter(r => r.zone?.toLowerCase().includes('crítica') || r.zone?.toLowerCase().includes('roja')).length;

    res.json({
      patients: totalPatients,
      completedSurveys: totalSurveys,
      averageScore: avgScore,
      sosAlerts: sosCount
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

// React Router SPA Fallback - Redirigir todo lo que no sea API a index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../dist/index.html'));
});

// Start server
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
