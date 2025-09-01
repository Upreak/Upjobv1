import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database...')

  // Create Super Admin
  const superAdminPassword = await bcrypt.hash('Admin123!', 12)
  const superAdmin = await prisma.user.upsert({
    where: { email: 'superadmin@upjob.com' },
    update: {},
    create: {
      email: 'superadmin@upjob.com',
      password: superAdminPassword,
      name: 'Super Admin',
      phone: '+1234567890',
      role: 'SUPER_ADMIN',
      status: 'ACTIVE',
    },
  })

  // Create Admin
  const adminPassword = await bcrypt.hash('Admin123!', 12)
  const admin = await prisma.user.upsert({
    where: { email: 'admin@upjob.com' },
    update: {},
    create: {
      email: 'admin@upjob.com',
      password: adminPassword,
      name: 'Admin User',
      phone: '+1234567891',
      role: 'ADMIN',
      status: 'ACTIVE',
    },
  })

  // Create Recruiter
  const recruiterPassword = await bcrypt.hash('Recruiter123!', 12)
  const recruiter = await prisma.user.upsert({
    where: { email: 'recruiter@upjob.com' },
    update: {},
    create: {
      email: 'recruiter@upjob.com',
      password: recruiterPassword,
      name: 'John Recruiter',
      phone: '+1234567892',
      role: 'RECRUITER',
      status: 'ACTIVE',
    },
  })

  // Create Recruiter profile first
  const recruiterProfile = await prisma.recruiter.upsert({
    where: { userId: recruiter.id },
    update: {},
    create: {
      userId: recruiter.id,
      company: 'TechCorp Inc.',
      department: 'HR',
      designation: 'Senior Recruiter',
    },
  })

  // Create Candidate
  const candidatePassword = await bcrypt.hash('Candidate123!', 12)
  const candidate = await prisma.user.upsert({
    where: { email: 'candidate@upjob.com' },
    update: {},
    create: {
      email: 'candidate@upjob.com',
      password: candidatePassword,
      name: 'Jane Candidate',
      phone: '+1234567893',
      role: 'JOBSEEKER',
      status: 'ACTIVE',
    },
  })

  // Create Candidate profile
  await prisma.candidate.upsert({
    where: { userId: candidate.id },
    update: {},
    create: {
      userId: candidate.id,
      skills: JSON.stringify(['JavaScript', 'React', 'Node.js', 'TypeScript']),
      experience: JSON.stringify([
        {
          company: 'Previous Company',
          position: 'Software Engineer',
          duration: '2 years',
          description: 'Full-stack development'
        }
      ]),
      education: JSON.stringify([
        {
          institution: 'University Name',
          degree: 'Bachelor of Computer Science',
          year: '2020'
        }
      ]),
      currentCtc: 75000,
      expectedCtc: 90000,
      noticePeriod: 30,
      location: 'San Francisco, CA',
      relocate: true,
      summary: 'Experienced software engineer with expertise in full-stack development.',
    },
  })

  // Create sample workspace
  const workspace = await prisma.workspace.upsert({
    where: { id: 'default-workspace' },
    update: {},
    create: {
      id: 'default-workspace',
      name: 'Default Workspace',
      description: 'Default workspace for demo purposes',
      settings: JSON.stringify({
        maxUsers: 100,
        features: ['job_posting', 'candidate_management', 'analytics']
      }),
    },
  })

  // Update users to use the workspace
  await prisma.user.updateMany({
    where: {
      id: {
        in: [superAdmin.id, admin.id, recruiter.id]
      }
    },
    data: {
      workspaceId: workspace.id
    }
  })

  // Create sample project for recruiter (after recruiter profile is created)
  const project = await prisma.project.create({
    data: {
      title: 'Senior Software Engineer',
      company: 'TechCorp Inc.',
      description: 'We are looking for a senior software engineer with experience in React and Node.js to join our growing team.',
      skills: JSON.stringify(['React', 'Node.js', 'TypeScript', 'MongoDB', 'AWS']),
      minExperience: 3,
      maxExperience: 7,
      minSalary: 80000,
      maxSalary: 120000,
      currency: 'USD',
      location: JSON.stringify(['San Francisco, CA', 'Remote']),
      remote: true,
      employmentType: 'FULL_TIME',
      noticePeriod: 30,
      status: 'ACTIVE',
      criteria: JSON.stringify({
        mandatory: ['React', 'Node.js', 'TypeScript'],
        negotiable: ['MongoDB', 'AWS', 'Docker']
      }),
      customQuestions: JSON.stringify([
        {
          id: 'q1',
          question: 'Why are you interested in this position?',
          required: true,
          type: 'text'
        },
        {
          id: 'q2',
          question: 'What is your expected salary range?',
          required: true,
          type: 'text'
        },
        {
          id: 'q3',
          question: 'When can you start?',
          required: false,
          type: 'text'
        }
      ]),
      recruiterId: recruiterProfile.id, // Use recruiter profile ID, not user ID
    },
  })

  console.log('✅ Database seeded successfully!')
  console.log('')
  console.log('🔑 Admin Credentials:')
  console.log('Super Admin: superadmin@upjob.com / Admin123!')
  console.log('Admin: admin@upjob.com / Admin123!')
  console.log('Recruiter: recruiter@upjob.com / Recruiter123!')
  console.log('Candidate: candidate@upjob.com / Candidate123!')
  console.log('')
  console.log('📊 Sample Data Created:')
  console.log('- 4 Users with different roles')
  console.log('- 1 Workspace')
  console.log('- 1 Sample Job Project')
  console.log('- Recruiter and Candidate profiles')
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })