import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

async function main() {
  const seedFilePath = path.join(__dirname, 'seed.json');
  
  if (!fs.existsSync(seedFilePath)) {
    console.error(`Seed file not found at ${seedFilePath}`);
    process.exit(1);
  }

  const data = JSON.parse(fs.readFileSync(seedFilePath, 'utf-8'));

  console.log(`Starting seed with ${data.length} records...`);

  for (const child of data) {
    const existingChild = await prisma.child.findUnique({
      where: { originalId: child.id }
    });

    if (!existingChild) {
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
              ultima_consulta: new Date(child.saude.ultima_consulta),
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
        }
      });
      console.log(`Created child: ${child.nome}`);
    } else {
      console.log(`Child already exists: ${child.nome}`);
    }
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
