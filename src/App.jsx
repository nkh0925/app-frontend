import React from 'react';
import { BrowserRouter as Router, Routes, Route } from'react-router-dom';

// 引入我们创建的页面组件
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import HomePage from './pages/HomePage';
import ApplicationPage from './pages/ApplicationPage';
import NotFoundPage from './pages/NotFoundPage';

// 引入我们创建的受保护的路由组件
import ProtectedRoute from './components/ProtectedRoute';

function
App() {
  return (
    <Router>
      <div className="app-container">
        <Routes>
          {/* ===公共路由：任何人都可以访问 === */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* === 受保护的路由：必须登录才能访问 === */}
          {/* 我们用 ProtectedRoute 组件包裹所有需要保护的路由 */}
          <Route path="/" element={<ProtectedRoute />}>
            {/* 当访问根路径'/'时，默认显示 HomePage */}
            <Route index element={<HomePage />} /> 
            
            {/* 提交新申请的页面 */}
            <Route path="/apply" element={<ApplicationPage />} /> 
            
            {/* 修改申请的页面 (带一个 id 参数) */}
            <Route path="/apply/:id" element={<ApplicationPage />} /> 
          </Route>

          {/* === 404 路由：当以上路径都未匹配时显示 === */}          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
