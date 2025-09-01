import { PrismaClient, UserRole } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting database seed...')

  // Create default super admin user
  const hashedPassword = await bcrypt.hash('admin123', 12)
  
  const superAdmin = await prisma.user.upsert({
    where: { email: 'admin@jobboard.com' },
    update: {},
    create: {
      email: 'admin@jobboard.com',
      name: 'Super Admin',
      password: hashedPassword,
      role: UserRole.SUPER_ADMIN,
      status: 'ACTIVE',
      emailVerified: true,
    },
  })

  // Create admin profile
  await prisma.admin.upsert({
    where: { userId: superAdmin.id },
    update: {},
    create: {
      userId: superAdmin.id,
      permissions: JSON.stringify(['*']), // All permissions
    },
  })

  // Create default workspace
  const workspace = await prisma.workspace.upsert({
    where: { id: 'default-workspace' },
    update: {},
    create: {
      id: 'default-workspace',
      name: 'Default Workspace',
      settings: JSON.stringify({
        theme: 'light',
        notifications: true,
      }),
    },
  })

  // Create test recruiter user
  const recruiterPassword = await bcrypt.hash('recruiter123', 12)
  const recruiter = await prisma.user.upsert({
    where: { email: 'recruiter@test.com' },
    update: {},
    create: {
      email: 'recruiter@test.com',
      name: 'Test Recruiter',
      password: recruiterPassword,
      role: UserRole.RECRUITER,
      status: 'ACTIVE',
      emailVerified: true,
      workspaceId: workspace.id,
    },
  })

  await prisma.recruiter.upsert({
    where: { userId: recruiter.id },
    update: {},
    create: {
      userId: recruiter.id,
    },
  })

  // Create test candidate user
  const candidatePassword = await bcrypt.hash('candidate123', 12)
  const candidate = await prisma.user.upsert({
    where: { email: 'candidate@test.com' },
    update: {},
    create: {
      email: 'candidate@test.com',
      name: 'Test Candidate',
      password: candidatePassword,
      role: UserRole.CANDIDATE,
      status: 'ACTIVE',
      emailVerified: true,
      workspaceId: workspace.id,
    },
  })

  await prisma.candidate.upsert({
    where: { userId: candidate.id },
    update: {},
    create: {
      userId: candidate.id,
      profileCompleteness: 0,
    },
  })

  // Create sample locations
  const locations = [
    'New York', 'San Francisco', 'London', 'Berlin', 'Tokyo', 'Mumbai', 'Bangalore',
    'Remote', 'Hybrid', 'On-site'
  ]

  for (const location of locations) {
    await prisma.location.upsert({
      where: { name: location },
      update: {},
      create: { name: location },
    })
  }

  // Create sample skills
  const skills = [
    'JavaScript', 'TypeScript', 'React', 'Node.js', 'Python', 'Java', 'C++',
    'SQL', 'MongoDB', 'AWS', 'Docker', 'Kubernetes', 'Git', 'Agile',
    'UI/UX Design', 'Figma', 'Adobe Creative Suite', 'SEO', 'Google Analytics',
    'Salesforce', 'HubSpot', 'Project Management', 'Leadership'
  ]

  for (const skill of skills) {
    await prisma.skill.upsert({
      where: { name: skill },
      update: {},
      create: { name: skill },
    })
  }

  console.log('✅ Database seeded successfully!')
  console.log('\n📋 Default Login Credentials:')
  console.log('Super Admin: admin@jobboard.com / admin123')
  console.log('Recruiter: recruiter@test.com / recruiter123')
  console.log('Candidate: candidate@test.com / candidate123')
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
