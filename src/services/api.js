import axios from 'axios';

const api = axios.create({
baseURL: 'http://localhost:3001/api', 
  timeout: 10000, //请求超时时间
});

// 添加请求拦截器 (Request Interceptor)
// 这个函数会在我们应用中每一次发送请求之前被自动调用
api.interceptors.request.use(
  (config) => {
    // 从浏览器的 localStorage 中获取登录时存储的 token
    const token = localStorage.getItem('token');
    if (token) {
      // 如果 token 存在，则在每个请求的 Header中添加 'Authorization'
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    // 对请求错误做些什么
    return Promise.reject(error);
  }
);

// 响应拦截器
api.interceptors.response.use(
  response => response,
  error => {
    // 对全局的错误进行处理
    if (error.response && error.response.status === 401) {
      console.error("认证失败或Token已过期，请重新登录。");
      // 清除可能已过期的本地存储
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      // 跳转到登录页，并刷新页面以确保状态重置
      window.location.href = '/login'; 
    }
    return Promise.reject(error);
  }
);

export default api;
