import { BrowserRouter as Router, Routes, Route } from'react-router-dom';

// 页面组件
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import HomePage from './pages/HomePage';
import ApplicationPage from './pages/ApplicationPage';

// 受保护的路由组件
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
          <Route path="/" element={<ProtectedRoute />}>
            {/* 当访问根路径'/'时，默认显示 HomePage */}
            <Route index element={<HomePage />} /> 
            
            {/* 提交新申请的页面 */}
            <Route path="/apply" element={<ApplicationPage />} /> 
            
            {/* 修改申请的页面 */}
            <Route path="/apply/:id" element={<ApplicationPage />} /> 
          </Route>
        </Routes>
      </div>
    </Router>
  );
}

export default App;
