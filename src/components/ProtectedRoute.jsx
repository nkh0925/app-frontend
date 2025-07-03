import { Navigate, Outlet } from'react-router-dom';

const ProtectedRoute = () => {
  // 检查 token 是否存在，双感叹号将其转换为布尔值true/false
  const isAuthenticated = !!localStorage.getItem('token'); 

  // 如果已认证，则渲染其包裹的子路由 (通过<Outlet />)
  // 否则，重定向到 /login 页面
  return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace />;};

export default ProtectedRoute;
