import { CategoryCode, ExamStatus, UserRole } from "@prisma/client"
import { hashPassword } from "../lib/auth"
import { CATEGORY_META, EXAM_DURATION_MINUTES, EXAM_BLUEPRINT } from "../lib/constants"
import { prisma } from "../lib/prisma"

function shouldSeedDummyQuestions() {
  return process.env.SEED_DUMMY_QUESTIONS === "true"
}

async function seedCategories() {
  for (const [code, meta] of Object.entries(CATEGORY_META)) {
    await prisma.category.upsert({
      where: { code: code as CategoryCode },
      update: {
        name: meta.name,
        passingGrade: meta.passingGrade,
      },
      create: {
        code: code as CategoryCode,
        name: meta.name,
        passingGrade: meta.passingGrade,
      },
    })
  }
}

async function seedUsers() {
  const adminEmail = process.env.ADMIN_EMAIL ?? "admin@cpns.local"
  const adminPassword = process.env.ADMIN_PASSWORD ?? "Admin12345!"

  await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      name: "Admin CPNS",
      email: adminEmail,
      passwordHash: await hashPassword(adminPassword),
      role: UserRole.ADMIN,
    },
  })

  await prisma.user.upsert({
    where: { email: "peserta@cpns.local" },
    update: {},
    create: {
      name: "Peserta Demo",
      email: "peserta@cpns.local",
      passwordHash: await hashPassword("Peserta12345!"),
      role: UserRole.PARTICIPANT,
    },
  })
}

async function seedExam() {
  await prisma.exam.upsert({
    where: { id: "default-exam" },
    update: {
      title: "Paket CPNS Default",
      description: "Paket simulasi standar 110 soal",
      durationMinutes: EXAM_DURATION_MINUTES,
      twkCount: EXAM_BLUEPRINT.TWK,
      tiuCount: EXAM_BLUEPRINT.TIU,
      tkpCount: EXAM_BLUEPRINT.TKP,
      status: ExamStatus.PUBLISHED,
    },
    create: {
      id: "default-exam",
      title: "Paket CPNS Default",
      description: "Paket simulasi standar 110 soal",
      durationMinutes: EXAM_DURATION_MINUTES,
      twkCount: EXAM_BLUEPRINT.TWK,
      tiuCount: EXAM_BLUEPRINT.TIU,
      tkpCount: EXAM_BLUEPRINT.TKP,
      status: ExamStatus.PUBLISHED,
    },
  })
}

function buildDummyQuestion(index: number, code: CategoryCode) {
  const title =
    code === CategoryCode.TWK
      ? `Dasar negara dan konstitusi nomor ${index}`
      : code === CategoryCode.TIU
      ? `Logika numerik dan verbal nomor ${index}`
      : `Sikap kerja profesional nomor ${index}`

  return {
    body: `Soal ${code} ${index}: ${title}. Pilih jawaban yang paling tepat.`,
    subtopic: "Dummy",
    explanation: `Pembahasan ${code} ${index}: opsi A dirancang sebagai jawaban benar untuk data dummy seed.`,
    options: ["Pilihan A", "Pilihan B", "Pilihan C", "Pilihan D", "Pilihan E"].map(
      (option, optionIndex) => ({
        label: String.fromCharCode(65 + optionIndex),
        content: `${option} untuk ${code} ${index}`,
        isCorrect: optionIndex === 0,
        sortOrder: optionIndex,
      }),
    ),
  }
}

async function seedQuestions() {
  if (!shouldSeedDummyQuestions()) {
    return
  }

  const categories = await prisma.category.findMany()
  const byCode = new Map(categories.map((category) => [category.code, category.id]))

  const minimumByCategory = {
    [CategoryCode.TWK]: 40,
    [CategoryCode.TIU]: 45,
    [CategoryCode.TKP]: 55,
  }

  for (const [code, minimum] of Object.entries(minimumByCategory) as Array<
    [CategoryCode, number]
  >) {
    const count = await prisma.question.count({
      where: { categoryId: byCode.get(code) },
    })

    if (count >= minimum) {
      continue
    }

    for (let index = count + 1; index <= minimum; index += 1) {
      const dummy = buildDummyQuestion(index, code)
      await prisma.question.create({
        data: {
          categoryId: byCode.get(code) ?? "",
          body: dummy.body,
          subtopic: dummy.subtopic,
          explanation: dummy.explanation,
          options: {
            create: dummy.options,
          },
        },
      })
    }
  }
}

async function main() {
  await seedCategories()
  await seedUsers()
  await seedExam()
  await seedQuestions()
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (error) => {
    console.error(error)
    await prisma.$disconnect()
    process.exit(1)
  })
