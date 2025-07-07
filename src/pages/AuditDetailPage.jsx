import { NavBar } from 'antd-mobile';
import { useNavigate } from 'react-router-dom';

const AuditDetailPage = () => {
  const navigate = useNavigate();

  return (
    <div>
      <NavBar onBack={() => navigate(-1)}>申请详情</NavBar>
      <p style={{ textAlign: 'center', padding: '16px' }}>这里将显示单个申请的详细信息。</p>
    </div>
  );
};

export default AuditDetailPage;
