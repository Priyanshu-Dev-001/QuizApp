import { useEffect, useState } from "react";
import { Download } from "lucide-react";
import { showToast } from "../utils/toast";

export default function PwaInstallButton() {
  const [installPrompt, setInstallPrompt] = useState(null);

  useEffect(() => {
    const onBeforeInstallPrompt = (event) => {
      event.preventDefault();
      setInstallPrompt(event);
    };

    const onInstalled = () => {
      setInstallPrompt(null);
      showToast("QuizApp installed successfully", "success");
    };

    window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt);
    window.addEventListener("appinstalled", onInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  const installApp = async () => {
    if (!installPrompt) {
      showToast("Install option will appear when the browser allows it", "info");
      return;
    }

    installPrompt.prompt();
    const choice = await installPrompt.userChoice;

    if (choice.outcome === "accepted") {
      setInstallPrompt(null);
    }
  };

  return (
    <button className="q-install-btn" onClick={installApp} type="button">
      <Download size={18} />
      <span>Install</span>
    </button>
  );
}
