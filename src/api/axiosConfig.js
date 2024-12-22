import axios from "axios";

const axiosInstance = axios.create({
  baseURL: "http://localhost:8080", // Địa chỉ backend
  headers: {
    "Content-Type": "application/json",
  },
});

export default axiosInstance;
