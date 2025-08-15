const handleRegisterSubmit = async (e) => {
  e.preventDefault();
  const form = e.target;
  const name = form[0].value.trim();
  const email = form[1].value.trim();
  const password = form[2].value;
  const repeatPassword = form[3].value;
  const agreeTerms = form[4].checked;

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
      setCurrentView("dashboard"); // Redirect to dashboard
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
