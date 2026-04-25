import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const seedFilePath = path.join(__dirname, 'seed.json');
  
  if (!fs.existsSync(seedFilePath)) {
    console.error(`Seed file not found at ${seedFilePath}`);
    process.exit(1);
  }

  const data = JSON.parse(fs.readFileSync(seedFilePath, 'utf-8'));

  console.log('Cleaning database...');
  await prisma.reviewHistory.deleteMany();
  await prisma.healthData.deleteMany();
  await prisma.educationData.deleteMany();
  await prisma.socialData.deleteMany();
  await prisma.child.deleteMany();
  await prisma.user.deleteMany();
  console.log('Database cleaned.');

  console.log('Creating default user...');
  const hashedPassword = await bcrypt.hash('painel@2024', 10);
  await prisma.user.create({
    data: {
      email: 'tecnico@prefeitura.rio',
      password: hashedPassword,
      name: 'Técnico de Campo'
    }
  });
  console.log('Default user created.');

  console.log(`Starting seed with ${data.length} records...`);

  for (const child of data) {
    const numAlertasSaude = child.saude?.alertas?.length || 0;
    const numAlertasEduc = child.educacao?.alertas?.length || 0;
    const numAlertasSocial = child.assistencia_social?.alertas?.length || 0;

    await prisma.child.create({
      data: {
        originalId: child.id,
        nome: child.nome,
        data_nascimento: new Date(child.data_nascimento),
        bairro: child.bairro,
        responsavel: child.responsavel,
        revisado: child.revisado || false,
        revisado_por: child.revisado_por || null,
        revisado_em: child.revisado_em ? new Date(child.revisado_em) : null,
        saude: child.saude ? {
          create: {
            ultima_consulta: child.saude.ultima_consulta ? new Date(child.saude.ultima_consulta) : null,
            vacinas_em_dia: child.saude.vacinas_em_dia,
            alertas: child.saude.alertas || [],
          }
        } : undefined,
        educacao: child.educacao ? {
          create: {
            escola: child.educacao.escola,
            frequencia_percent: child.educacao.frequencia_percent,
            alertas: child.educacao.alertas || [],
          }
        } : undefined,
        assistencia_social: child.assistencia_social ? {
          create: {
            cad_unico: child.assistencia_social.cad_unico,
            beneficio_ativo: child.assistencia_social.beneficio_ativo,
            alertas: child.assistencia_social.alertas || [],
          }
        } : undefined,
        reviews: child.revisado ? {
          create: {
            anotacao: "Atualização de cadastro e acompanhamento (Carga Inicial)",
            revisado_por: child.revisado_por || 'tecnico@prefeitura.rio',
            createdAt: child.revisado_em ? new Date(child.revisado_em) : new Date(),
            frequencia_nova: child.educacao?.frequencia_percent || null,
            num_alertas_saude_novo: numAlertasSaude,
            num_alertas_educ_novo: numAlertasEduc,
            num_alertas_social_novo: numAlertasSocial
          }
        } : undefined
      }
    });
    console.log(`Created child: ${child.nome}`);
  }

  console.log('Seed finished.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
