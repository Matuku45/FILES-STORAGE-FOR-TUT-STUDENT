import React, { useState } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import "./App.css";
import { v4 as uuidv4 } from "uuid";

function App() {
  const [currentView, setCurrentView] = useState("dashboard");
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [fetchId, setFetchId] = useState("");
  const [fetchedFile, setFetchedFile] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  // -------- Upload files to Flask -> S3 --------
  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files);
    const uploaded = [];

    for (let file of files) {
      const id = uuidv4();
      const formData = new FormData();
      formData.append("file", file);
      formData.append("id", id);

      try {
        const res = await fetch("http://127.0.0.1:5000/s3/upload", {
          method: "POST",
          body: formData,
        });
        const data = await res.json();
        if (res.ok) uploaded.push({ file, id });
        else alert(`Error uploading ${file.name}: ${data.error}`);
      } catch (err) {
        console.error(err);
        alert(`Server error while uploading ${file.name}`);
      }
    }

    setUploadedFiles((prev) => [...prev, ...uploaded]);
    alert("Files uploaded to S3! Copy your IDs to retrieve later.");
  };

  // -------- Fetch file from Flask -> S3 --------
  const handleFetchFile = async () => {
    if (!fetchId) return alert("Enter a file ID");
    setIsLoading(true);
    try {
      const res = await fetch(`http://127.0.0.1:5000/s3/download/${fetchId}`, { method: "POST" });
      if (!res.ok) throw new Error("File not found");
      const blob = await res.blob();
      const file = new File([blob], fetchId);
      setFetchedFile(file);
    } catch (err) {
      alert(err.message);
      setFetchedFile(null);
    } finally {
      setIsLoading(false);
    }
  };

  // -------- Download file locally --------
  const handleDownload = (file) => {
    const url = URL.createObjectURL(file);
    const a = document.createElement("a");
    a.href = url;
    a.download = file.name;
    a.click();
    URL.revokeObjectURL(url);
  };

  // -------- Register user -> DynamoDB --------
const handleRegisterSubmit = async (e) => {
  e.preventDefault();
  const form = e.target;
  const name = form[0].value;
  const password = form[2].value;
  setIsLoading(true);

  try {
    // Change the fetch URL to your desired endpoint
    const res = await fetch("https://thirty-black-feather-1498.fly.dev/dynamodb/items", {
      method: "POST",  // Keeping POST method as you're adding or updating an item
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: password, name }),
    });

    const data = await res.json();
    
    // Checking if the response is okay
    if (res.ok) {
      alert("Registered and saved to DynamoDB!");
      setCurrentView("dashboard");
      form.reset();
    } else {
      alert("Error: " + data.error || "An error occurred");
    }
  } catch (err) {
    console.error(err);
    alert("Could not connect to server!");
  } finally {
    setIsLoading(false);
  }
};

return (
  <div className="d-flex vh-100 overflow-hidden">
    {/* Sidebar */}
    <div className="bg-dark text-white p-3 sidebar d-flex flex-column">
      <h3 className="text-center mb-4">Cloud Dashboard</h3>
      <ul className="nav flex-column flex-grow-1">
        <li className="nav-item mb-2">
          <button className={`btn w-100 ${currentView === "dashboard" ? "btn-primary" : "btn-outline-light"}`} onClick={() => setCurrentView("dashboard")}>Dashboard</button>
        </li>
        <li className="nav-item mb-2">
          <button className="btn btn-outline-info w-100" onClick={() => window.open("https://geminiapi-c01h.onrender.com/", "_blank")}>Gemini API</button>
        </li>
        <li className="nav-item mb-2">
          <button className="btn btn-outline-warning w-100" onClick={() => window.open("https://console.aws.amazon.com/", "_blank")}>AWS Console</button>
        </li>
        <li className="nav-item mb-2">
          <button className="btn btn-outline-light w-100" onClick={() => setCurrentView("uploads")}>View Uploaded Items</button>
        </li>
        <li className="nav-item mb-2">
          <button className="btn btn-outline-secondary w-100" onClick={() => setCurrentView("converter")}>PDF Converter</button>
        </li>
        <li className="nav-item mt-4">
          <button className="btn btn-outline-light w-100" onClick={() => setCurrentView("login")}>Login</button>
        </li>
        <li className="nav-item mt-2">
          <button className="btn btn-outline-light w-100" onClick={() => setCurrentView("register")}>Register</button>
        </li>
      </ul>
    </div>

    {/* Main Content */}
    <div className="flex-grow-1 d-flex flex-column">
      <nav className="navbar navbar-dark bg-dark sticky-top shadow-sm px-4">
        <span className="navbar-brand mb-0 h1">Cloud Dashboard</span>
        {/* Search Bar */}
        <form className="d-flex ms-auto" onSubmit={handleSearch}>
          <input
            className="form-control me-2"
            type="search"
            placeholder="Search files (music, pdf, video...)"
            aria-label="Search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <button className="btn btn-outline-success" type="submit">Search</button>
        </form>
      </nav>

      <div className="flex-grow-1 overflow-auto p-5 bg-light">
        {currentView === "dashboard" && (
          <div>
            <h1 className="mb-4 text-center">Welcome to Cloud Dashboard</h1>
            <p className="text-center mb-5">Upload files and access them anywhere using unique IDs!</p>

            {/* Upload Section */}
            <div className="card shadow-lg p-4 mb-4">
              <h5 className="mb-3">Upload Files</h5>
              <input type="file" multiple className="form-control mb-3" onChange={handleFileUpload} />
              {uploadedFiles.length > 0 && (
                <ul className="list-group">
                  {uploadedFiles.map(({ file, id }, idx) => (
                    <li key={idx} className="list-group-item d-flex justify-content-between align-items-center">
                      {file.name} <span className="badge bg-primary">{id}</span>
                      <button className="btn btn-sm btn-success ms-2" onClick={() => handleDownload(file)}>Download</button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Retrieve Section */}
            <div className="card shadow-lg p-4 mb-4">
              <h5 className="mb-3">Retrieve File by ID</h5>
              <div className="d-flex mb-3">
                <input type="text" placeholder="Enter file ID" className="form-control me-2" value={fetchId} onChange={(e) => setFetchId(e.target.value)} />
                <button className="btn btn-success" onClick={handleFetchFile}>{isLoading ? "Loading..." : "Fetch"}</button>
              </div>
              {fetchedFile && (
                <div>
                  <h6>File Found: {fetchedFile.name}</h6>
                  <p>Size: {fetchedFile.size} bytes</p>
                  <button className="btn btn-primary" onClick={() => handleDownload(fetchedFile)}>Download</button>
                </div>
              )}
            </div>
          </div>
        )}

        {currentView === "uploads" && (
          <div>
            <h2 className="mb-4">Uploaded Items</h2>
            {uploadedFiles.length === 0 ? (
              <p>No files uploaded yet.</p>
            ) : (
              <ul className="list-group">
                {uploadedFiles.map(({ file, id }, idx) => (
                  <li key={idx} className="list-group-item d-flex justify-content-between align-items-center">
                    {file.name} <span className="badge bg-secondary">{id}</span>
                    <button className="btn btn-sm btn-outline-primary" onClick={() => handleDownload(file)}>Download</button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {currentView === "converter" && (
          <div>
            <h2 className="mb-4">PDF Converter Tool</h2>
            <p>Convert your documents to PDF or vice versa.</p>
            <button className="btn btn-outline-success" onClick={() => window.open("https://www.ilovepdf.com/", "_blank")}>
              Open PDF Converter
            </button>
          </div>
        )}

        {currentView === "register" && (
          <div>
            <h2 className="mb-4">Register</h2>
            <form onSubmit={handleRegisterSubmit}>
              <input type="text" placeholder="Name" className="form-control mb-3" required />
              <input type="email" placeholder="Email" className="form-control mb-3" required />
              <input type="password" placeholder="Password" className="form-control mb-3" required />
              <input type="password" placeholder="Repeat Password" className="form-control mb-3" required />
              <div className="form-check mb-3">
                <input type="checkbox" className="form-check-input" required />
                <label className="form-check-label">I agree to Terms of Service</label>
              </div>
              <button className="btn btn-success me-2" type="submit" disabled={isLoading}>
                {isLoading && <span className="spinner-border spinner-border-sm me-2"></span>}
                Register
              </button>
              <button className="btn btn-secondary" type="button" onClick={() => setCurrentView("dashboard")}>Back</button>
            </form>
          </div>
        )}
      </div>

      <footer className="bg-dark text-white text-center py-3 shadow-sm sticky-bottom">
        Cloud Dashboard &copy; 2025
      </footer>
    </div>
  </div>
);

}

export default App;
