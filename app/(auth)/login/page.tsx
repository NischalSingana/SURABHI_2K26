import ReturnButton from "@/components/ui/ReturnButton";
import LoginFlow from "@/components/ui/LoginFlow";

const Login = () => {
  return (
    <div className="min-h-screen w-full bg-linear-to-br from-zinc-950 via-zinc-900 to-black flex flex-col">
      <div className="w-full px-6 py-6"></div>

      <div className="flex-1 flex flex-col items-center justify-center px-6 pb-16">
        <LoginFlow />
      </div>
    </div>
  );
};

export default Login;
