import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
const prisma = new PrismaClient();

async function main() {
  console.log('Seeding Cero Amor Survey Database...');

  // Create Admin User
  const adminEmail = 'admin@amoragape.com';
  const existingAdmin = await prisma.user.findUnique({ where: { email: adminEmail } });
  if (!existingAdmin) {
    const hashedPassword = await bcrypt.hash('admin123', 10);
    await prisma.user.create({
      data: {
        email: adminEmail,
        name: 'Administrador Principal',
        password: hashedPassword,
        role: 'ADMIN',
      }
    });
    console.log('Admin user created.');
  } else {
    console.log('Admin user already exists.');
  }

  // Check if survey already exists
  const existingSurvey = await prisma.survey.findFirst({
    where: { name: 'Autoviolentómetro: Cero Amor' }
  });

  if (!existingSurvey) {
    const survey = await prisma.survey.create({
      data: {
        name: 'Autoviolentómetro: Cero Amor',
        description: 'Mide la conducta dañina autoinfligida agrupada en tres grandes dimensiones para comprobar el comportamiento algorítmico.',
        adaptiveRules: {
          condition: {
            domain: 1,
            questions: ['Q01', 'Q02', 'Q03', 'Q04', 'Q05', 'Q06', 'Q07', 'Q08'],
            operator: '<',
            value: 3
          },
          action: {
            type: 'skip_domain',
            targetDomainToSkip: 2,
            jumpToDomain: 3,
            description: 'Si la suma de Dom 1 es < 3, salta a Dom 3'
          }
        },
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
    }
    });
    console.log(`Survey created: ${survey.name} with its levels and rules.`);
  } else {
    console.log('Survey already exists, skipping creation.');
  }

  // Seeding Cero Amor Paternal
  const existingPaternalSurvey = await prisma.survey.findFirst({
    where: { name: 'Cero Amor Paternal (Violentómetro Vicario)' }
  });

  if (!existingPaternalSurvey) {
    const survey = await prisma.survey.create({
      data: {
        id: 'cero-amor-paternal',
        name: 'Cero Amor Paternal (Violentómetro Vicario)',
        description: 'Herramienta diagnóstica de datos compilatorios sobre la violencia vicaria ejercida por el padre hacia la madre a través de sus hijos.',
        adaptiveRules: {
          condition: {
            domain: 1,
            questions: ['RV01', 'RV02', 'RV03', 'RV04', 'RV05', 'RV06', 'RV07', 'RV08', 'RV09', 'RV10'],
            operator: '<',
            value: 3
          },
          action: {
            type: 'skip_domain',
            targetDomainToSkip: 2,
            jumpToDomain: 3,
            description: 'Si la suma de Dom 1 es < 3, salta a Dom 3'
          }
        },
        levels: {
          create: [
            {
              name: 'Zona 1: ¡Alerta!',
              minScore: 0,
              maxScore: 30,
              description: '¡Presta atención! La violencia vicaria inicia sutilmente con descalificaciones de la madre y manipulación inicial.',
              clinicalApproach: 'Establece límites firmes y busca asesoría temprana.'
            },
            {
              name: 'Zona 2: ¡Psicológica y Emocional!',
              minScore: 31,
              maxScore: 60,
              description: '¡Reacciona! Hay campañas de alienación activas, amenazas sobre la custodia y sabotajes en la comunicación.',
              clinicalApproach: 'Es crucial contar con terapia de apoyo para tus hijos.'
            },
            {
              name: 'Zona 3: ¡Violencia institucional / económica!',
              minScore: 61,
              maxScore: 90,
              description: '¡Protégete legalmente! Uso abusivo del sistema de justicia, retención de documentos o condicionamiento de pensiones.',
              clinicalApproach: 'Consigue un abogado especializado de inmediato.'
            },
            {
              name: 'Zona 4: ¡Violencia grave!',
              minScore: 91,
              maxScore: 120,
              description: '¡Peligro severo! Sustracción, amenazas de daño e instrumentación física de los menores.',
              clinicalApproach: 'Es urgente solicitar medidas de protección legales inmediatas.'
            },
            {
              name: 'Zona 5: ¡Violencia extrema!',
              minScore: 121,
              maxScore: 150,
              description: '¡Emergencia Crítica! Secuestro parental, agresiones físicas severas, tortura o riesgo inminente de homicidio.',
              clinicalApproach: 'Comunícate al 911 de inmediato.'
            }
          ]
        }
      }
    });
    console.log(`Survey created: ${survey.name} with its levels and rules.`);
  } else {
    console.log('Paternal survey already exists, skipping creation.');
  }

  // Seeding Cero Amor Maternal
  const existingMaternalSurvey = await prisma.survey.findFirst({
    where: { name: 'Cero Amor Maternal (Violentómetro Vicario)' }
  });

  if (!existingMaternalSurvey) {
    const survey = await prisma.survey.create({
      data: {
        id: 'cero-amor-maternal',
        name: 'Cero Amor Maternal (Violentómetro Vicario)',
        description: 'Herramienta diagnóstica de datos compilatorios sobre la violencia vicaria ejercida por la madre hacia el padre a través de sus hijos.',
        adaptiveRules: {
          condition: {
            domain: 1,
            questions: ['RM01', 'RM02', 'RM03', 'RM04', 'RM05', 'RM06', 'RM07', 'RM08', 'RM09', 'RM10', 'RM11', 'RM12'],
            operator: '<',
            value: 3
          },
          action: {
            type: 'skip_domain',
            targetDomainToSkip: 2,
            jumpToDomain: 3,
            description: 'Si la suma de Dom 1 es < 3, salta a Dom 3'
          }
        },
        levels: {
          create: [
            {
              name: 'Zona 1: ¡Alerta tempranas!',
              minScore: 0,
              maxScore: 18,
              description: '¡Presta atención! El violentómetro vicario materno inicia sutilmente con descalificaciones de la figura paterna.',
              clinicalApproach: 'Establece límites de comunicación firmes y claros.'
            },
            {
              name: 'Zona 2: ¡Manipulación Emocional!',
              minScore: 19,
              maxScore: 36,
              description: '¡Reacciona! Hay manipulación emocional activa para hacer sentir culpa a los hijos y presentarse como única figura de afecto.',
              clinicalApproach: 'Es de suma importancia contar con terapia de apoyo para tus hijos.'
            },
            {
              name: 'Zona 3: ¡Alineación familiar!',
              minScore: 37,
              maxScore: 54,
              description: '¡Actúa legalmente! Campañas de alienación extendidas y bloqueos sistemáticos de visitas.',
              clinicalApproach: 'Consigue la asesoría de un abogado especializado.'
            },
            {
              name: 'Zona 4: ¡Violencia Psicólogica grave!',
              minScore: 55,
              maxScore: 72,
              description: '¡Peligro! Impedimento de contacto por largos períodos, denuncias falsas y el uso de los hijos para enviar amenazas.',
              clinicalApproach: 'Lleva una bitácora detallada de incidencias y denuncia.'
            },
            {
              name: 'Zona 5: ¡Riesgo alto niñez!',
              minScore: 73,
              maxScore: 90,
              description: '¡Riesgo severo! Sustracción de los hijos, cambio ilegal de domicilio y manipulación de testimonios de menores.',
              clinicalApproach: 'Es indispensable solicitar medidas de protección urgentes.'
            },
            {
              name: 'Zona 6: ¡Violencia extrema!',
              minScore: 91,
              maxScore: 108,
              description: '¡Emergencia Letal! Amenazas de desaparición, fabricación de delitos graves, y exposición física de los niños.',
              clinicalApproach: 'Comunícate de inmediato al 911.'
            }
          ]
        }
      }
    });
    console.log(`Survey created: ${survey.name} with its levels and rules.`);
  } else {
    console.log('Maternal survey already exists, skipping creation.');
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
