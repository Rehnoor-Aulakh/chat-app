import { createContext, useEffect, useState, useCallback } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { io } from "socket.io-client";

const backendUrl = import.meta.env.VITE_BACKEND_URL;
axios.defaults.baseURL = backendUrl;
//first create the context to avoid prop drilling
export const AuthContext = createContext();

//Provide value to the children by creating provider
export const AuthProvider = ({ children }) => {
  //get the token from the localStorage
  const [token, setToken] = useState(localStorage.getItem("token"));
  const [authUser, setAuthUser] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [socket, setSocket] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  //connect socket function to handle socket connection and online users updates
  const connectSocket = useCallback(
    function (userData) {
      if (!userData || socket?.connected) return;
      const newSocket = io(backendUrl, { query: { userId: userData._id } });
      newSocket.connect();
      setSocket(newSocket);
      newSocket.on("getOnlineUsers", (userIds) => {
        setOnlineUsers(userIds);
      });
    },
    [socket]
  );

  //Login function to handle user authentication and socket connection
  const login = async (state, credentials) => {
    try {
      const { data } = await axios.post(`/api/auth/${state}`, credentials);
      if (data.success) {
        setAuthUser(data.userData);
        connectSocket(data.userData);
        axios.defaults.headers.common["token"] = data.token;
        setToken(data.token);
        // store the token in the localStorage
        localStorage.setItem("token", data.token);
        toast.success(data.message);
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.message);
    }
  };

  //logout funtion to handle user logout and socket disconnection
  const logout = async () => {
    localStorage.removeItem("token");
    setToken(null);
    setAuthUser(null);
    setOnlineUsers([]);
    axios.defaults.headers.common["token"] = null;
    toast.success("Logged out successfully");
    if (socket) {
      socket.disconnect();
    }
  };

  //update profile function to handle profile updates
  const updateProfile = async (body) => {
    try {
      const { data } = await axios.put("/api/auth/update-profile", body);
      if (data.success) {
        setAuthUser(data.user);
        toast.success("Profile Updated Successfully");
      }
    } catch (error) {
      toast.error(error.message);
    }
  };

  useEffect(() => {
    //check if the user is authenticated, and if so, set the user data and connect the socket
    async function checkAuth() {
      try {
        setIsLoading(true);
        const { data } = await axios.get("/api/auth/check");
        if (data.success) {
          setAuthUser(data.user);
          connectSocket(data.user);
        }
      } catch (error) {
        console.log("Auth check failed:", error.message);
        // Don't show toast error on initial load if user is not authenticated
        setAuthUser(null);
      } finally {
        setIsLoading(false);
      }
    }

    //if there is a token, then add to the header the token for every axios request
    if (token) {
      axios.defaults.headers.common["token"] = token;
      checkAuth();
    } else {
      setIsLoading(false);
    }
  }, [token, connectSocket]);

  const value = {
    axios,
    authUser,
    onlineUsers,
    socket,
    login,
    logout,
    updateProfile,
    isLoading,
  };
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
