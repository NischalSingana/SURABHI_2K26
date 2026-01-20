import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    console.log('Deleting all visitor passes...')

    const result = await prisma.pass.deleteMany({
        where: {
            passType: 'VISITOR'
        }
    })

    console.log(`✅ Deleted ${result.count} visitor passes`)
}

main()
    .catch((e) => {
        console.error('Error:', e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
