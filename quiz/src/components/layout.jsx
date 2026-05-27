import { useEffect } from "react";
import Navbar from "./nav";
import Sidebar from "./Sidebar";
import "./layout.css";

export default function Layout({ children, logout }) {
  useEffect(() => {
    const savedSettings = JSON.parse(localStorage.getItem("quizSettings"));
    document.body.dataset.theme = savedSettings?.theme || "light";
  }, []);

  return (
    <div className="layout">
      <Sidebar />

      <div className="main">
        <Navbar logout={logout} />
        <main className="content">{children}</main>
      </div>
    </div>
  );
}
