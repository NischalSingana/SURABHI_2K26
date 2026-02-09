import MultiStepRegister from "@/components/ui/MultiStepRegister"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { prisma } from "@/lib/prisma"
import { getMissingFields } from "@/lib/registration-check"

const Register = async () => {
  const headersList = await headers();
  const session = await auth.api.getSession({
    headers: headersList,
  });

  let missingFields: string[] = [];
  let existingUserData = null;

  if (session?.user) {
    // Fetch existing user data
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        name: true,
        email: true,
        phone: true,
        collage: true,
        collageId: true,
        branch: true,
        year: true,
        gender: true,
        country: true,
        state: true,
        city: true,
        isApproved: true,
        isInternational: true,
      },
    });

    if (user) {
      existingUserData = user;
      missingFields = getMissingFields(user);
    }
  }

  return (
    <MultiStepRegister existingUserData={existingUserData} missingFields={missingFields} />
  )
}

export default Register
