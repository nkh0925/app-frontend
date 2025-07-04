import { useState, useEffect, useCallback } from 'react';
import { useNavigate} from 'react-router-dom';
import { NavBar, List, Button, Toast, Empty, Tag, Dialog, SpinLoading } from 'antd-mobile';
import { AddOutline} from 'antd-mobile-icons';
import api from '../services/api';

const HomePage = () => {
  const navigate = useNavigate();
  
  // 从 localStorage 获取用户信息，用于显示欢迎语
  const [user, setUser] = useState(null);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);

  // 退出登录函数
  const handleLogout = () => {
    Dialog.confirm({
      content: '您确定要退出登录吗？',
      onConfirm: () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/login', { replace: true });
        Toast.show({ content: '您已成功退出', position: 'bottom' });
      },
    });
  };

  // 根据申请状态返回不同颜色的标签，增强可读性
  const renderStatusTag = (status) => {
    switch (status) {
      case 'PENDING':
        return <Tag color='warning'>审核中</Tag>;
      case 'APPROVED':
        return <Tag color='success'>已通过</Tag>;
      case 'REJECTED':
        return <Tag color='danger'>已驳回</Tag>;
      case 'CANCELLED':
        return <Tag color='default'>已取消</Tag>;
      default:
        return <Tag color='default'>{status}</Tag>;
    }
  };

  // 获取申请列表的数据函数
  const fetchApplications = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.post('/application/query');
      if (response.data.success) {
        setApplications(response.data.data);
      }
    } catch (error) {
      // 后端对“无记录”返回404，axios会视作错误
      // 我们在此处优雅地处理它，而不是弹出一个错误提示
      if (error.response && error.response.status === 404) {
        setApplications([]); // 确保列表为空
      } else {
        Toast.show({
          icon: 'fail',
          content: error.response?.data?.message || '加载申请列表失败',
        });
      }
    } finally {
      setLoading(false);
    }
  }, []);


  // 使用 useEffect 在组件首次加载时执行
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    fetchApplications();
  }, [fetchApplications]);

  // 处理取消申请的函数
  const handleCancel = (applicationId) => {
    Dialog.confirm({
      title: '确认操作',
      content: '您确定要取消这份申请吗？此操作不可撤销。',
      onConfirm: async () => {
        try {
          const response = await api.post('/application/cancel', { application_id: applicationId });
          if (response.data.success) {
            Toast.show({ icon: 'success', content: '申请已取消' });
            fetchApplications(); // 重新加载列表以更新状态
          } else {
            Toast.show({ icon: 'fail', content: response.data.message });
          }
        } catch (error) {
          Toast.show({ icon: 'fail', content: error.response?.data?.message || '操作失败' });
        }
      }
    });
  };

  // 渲染主体内容
  const renderContent = () => {
    if (loading) {
      return <div style={{ padding: '64px', display: 'flex', justifyContent: 'center' }}><SpinLoading color='primary' /></div>;
    }
    if (applications.length === 0) {
      return <Empty description='您还没有任何申请记录' />;
    }
    return (
      <List>
        {applications.map((app) => (
          <List.Item
            key={app.id}
            prefix={renderStatusTag(app.status)}
            description={`申请编号: ${app.id} `}
            extra={
              // 根据状态显示不同的操作按钮
              <>
                {app.status === 'REJECTED' && (
                <Button 
                    size='small' 
                    color='primary' 
                    fill='outline' 
                    onClick={() => navigate(`/apply/${app.id}`, { state: { applicationData: app } })}
                >
                    修改
                </Button>
                )}
                {(app.status === 'PENDING' || app.status === 'REJECTED') && (
                  <Button
                    size='small'
                    color={app.status === 'REJECTED' ? 'danger' : 'warning'}
                    fill='outline'
                    onClick={() => handleCancel(app.id)}
                  >
                    取消申请
                  </Button>
                )}
              </>
            }
          >
            安心卡申请 - {app.name}
          </List.Item>
        ))}
      </List>
    );
  };

  return (
    <div style={{ backgroundColor: '#f5f5f5', minHeight: '100vh' }}>
      <NavBar
        right={<span style={{ fontSize: 16 }} onClick={handleLogout}>退出</span>}
        back={null}
      >
        我的申请
      </NavBar>
      
      <div style={{ padding: '12px', backgroundColor: 'white', borderBottom: '1px solid #eee' }}>
        <h3 style={{ margin: '0 0 12px 0' }}>{user ? `欢迎您, ${user.name}` : '欢迎'}</h3>
        <Button block color='primary' size='large' onClick={() => navigate('/apply')}>
          <AddOutline />
          <span>申请安心卡</span>
        </Button>
      </div>

      <div style={{ marginTop: '12px' }}>
        {renderContent()}
      </div>
    </div>
  );
};

export default HomePage;
