import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function OAuthSuccess() {
  const [searchParams] = useSearchParams();
  const { setTokenFromOAuth } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const token = searchParams.get("token");
    const refreshToken = searchParams.get("refresh");
    if (!token) {
      navigate("/login");
      return;
    }
    setTokenFromOAuth(token, refreshToken).then(() => navigate("/dashboard"));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="flex min-h-screen items-center justify-center bg-paper font-body">
      <p className="text-sm text-ink/60">Signing you in…</p>
    </div>
  );
}
