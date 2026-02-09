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
    <>
      {missingFields.length > 0 && (
        <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-50 animate-in fade-in slide-in-from-top-4 duration-500 max-w-md w-full px-4">
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg px-6 py-4 shadow-xl backdrop-blur-sm">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 mt-0.5">
                <svg className="w-5 h-5 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="text-amber-300 font-semibold text-sm mb-1">
                  Complete Your Profile
                </h3>
                <p className="text-amber-200/80 text-xs leading-relaxed mb-2">
                  Your existing information has been auto-filled. Please provide the following missing fields:
                </p>
                <ul className="text-amber-200/90 text-xs space-y-1 ml-4 list-disc">
                  {missingFields.map((field) => (
                    <li key={field}>{field}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}
      <MultiStepRegister existingUserData={existingUserData} missingFields={missingFields} />
    </>
  )
}

export default Register
