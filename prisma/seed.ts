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

  // Create the main survey with adaptive rules
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
            name: 'Zona Verde',
            minScore: 0,
            maxScore: 30,
            description: 'Posees una base sólida de respeto. Requiere un enfoque de consolidación y nutrición de tu Amor Ágape.',
            clinicalApproach: 'Consolidación del amor propio incondicional y prevención primaria.'
          },
          {
            name: 'Zona Amarilla',
            minScore: 31,
            maxScore: 75,
            description: 'Alerta preventiva. Hay presencia de conductas de descuido emocional y rigidez cognitiva autopunitiva.',
            clinicalApproach: 'Intervención temprana cognitivo-conductual y psicoeducación de autocompasión.'
          },
          {
            name: 'Zona Roja',
            minScore: 76,
            maxScore: 130,
            description: 'Riesgo a tu integridad psicofísica. Ejerces niveles elevados de castigo y coacción interna.',
            clinicalApproach: 'Reestructuración cognitiva profunda, terapia de aceptación y compromiso (ACT), acompañamiento psicoterapéutico.'
          },
          {
            name: 'Zona Crítica',
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
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
