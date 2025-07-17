import React, { useContext } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import HomePage from "./pages/HomePage";
import LoginPage from "./pages/LoginPage";
import ProfilePage from "./pages/ProfilePage";
import { Toaster } from "react-hot-toast";
import { AuthContext } from "../context/AuthContext";
export default function App() {
  //consume the context
  const { authUser, isLoading } = useContext(AuthContext);

  // Show loading screen while checking authentication
  if (isLoading) {
    return (
      <div className="bg-[url('./assets/bgImage.svg')] bg-contain min-h-screen flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="bg-[url('./assets/bgImage.svg')] bg-contain">
      <Toaster />
      <Routes>
        <Route
          path="/"
          element={authUser ? <HomePage></HomePage> : <Navigate to="/login" />}
        />
        <Route
          path="/login"
          element={!authUser ? <LoginPage></LoginPage> : <Navigate to="/" />}
        />
        <Route
          path="/profile"
          element={
            authUser ? <ProfilePage></ProfilePage> : <Navigate to="/login" />
          }
        />
      </Routes>
    </div>
  );
}
