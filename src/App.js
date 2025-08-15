import React, { useState } from "react";

function App() {
  const [isLoading, setIsLoading] = useState(false);
  const [currentView, setCurrentView] = useState("register");

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    const form = e.target;
    const name = form.name.value.trim();
    const email = form.email.value.trim();
    const password = form.password.value;
    const repeatPassword = form.repeatPassword.value;
    const agreeTerms = form.agreeTerms.checked;

    if (!agreeTerms) return alert("You must agree to the Terms of Service.");
    if (password !== repeatPassword) return alert("Passwords do not match.");

    setIsLoading(true);
    try {
      const res = await fetch("https://phillipine.onrender.com/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, agreed_to_terms: agreeTerms }),
      });

      const data = await res.json();
      if (res.ok) {
        alert("Registration successful!");
        form.reset();
        setCurrentView("dashboard");
      } else {
        alert("Error: " + (data.error || "An error occurred"));
      }
    } catch (err) {
      console.error(err);
      alert("Could not connect to server!");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      {currentView === "register" && (
        <form onSubmit={handleRegisterSubmit}>
          <input type="text" name="name" placeholder="Name" required />
          <input type="email" name="email" placeholder="Email" required />
          <input type="password" name="password" placeholder="Password" required />
          <input type="password" name="repeatPassword" placeholder="Repeat Password" required />
          <label>
            <input type="checkbox" name="agreeTerms" /> I agree to Terms of Service
          </label>
          <button type="submit" disabled={isLoading}>
            {isLoading ? "Registering..." : "Register"}
          </button>
        </form>
      )}

      {currentView === "dashboard" && <h1>Welcome to your dashboard!</h1>}
    </div>
  );
}

export default App;
