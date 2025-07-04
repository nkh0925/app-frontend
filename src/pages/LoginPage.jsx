import { useState } from 'react';
import { Form, Input, Button, Toast, NavBar, Space } from 'antd-mobile';
import { useNavigate, Link } from 'react-router-dom';
import api from '../services/api'; // 引入我们配置好的axios实例

const LoginPage = () => {
  const navigate = useNavigate();
  // 用于控制登录按钮的加载状态，防止用户重复点击
  const [loading, setLoading] = useState(false);

  // antd-mobile的Form组件在提交时会调用这个函数
  const onFinish = async (values) => {
    // 开始登录，显示加载状态
    setLoading(true);

    try {
      // 调用后端登录接口 /api/auth/login
      // phone_number 和 password
      const response = await api.post('/auth/login', {
        phone_number: values.phone_number,
        password: values.password,
      });

      // 根据后端返回的 success 字段判断是否成功
      if (response.data.success) {
        Toast.show({
          icon: 'success',
          content: '登录成功',
        });

        // 将token和用户信息存入localStorage
        // user 对象用于在主页显示欢迎信息
        localStorage.setItem('token', response.data.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.data.user));
        
        // 使用 navigate 跳转到主页 ('/')
        // replace: true 的作用是让登录页在浏览器历史中被替换，用户无法通过“后退”按钮回到登录页
        navigate('/', { replace: true });

      } else {
        // 后端返回的业务错误（例如，密码错误）
        Toast.show({
          icon: 'fail',
          content: response.data.message || '登录失败，请检查您的凭证',
        });
      }
    } catch (error) {
      // 网络错误或服务器500错误
      Toast.show({
        icon: 'fail',
        content: error.response?.data?.message || '网络繁忙，请稍后重试',
      });
    } finally {
      // 无论成功或失败，都结束加载状态
      setLoading(false);
    }
  };

  return (
    <div>
      <NavBar back={null}>欢迎登录</NavBar>
      <div style={{ padding: '24px', backgroundColor: '#ffffff', height: 'calc(100vh - 45px)' }}>
        <Form
          layout="vertical"
          onFinish={onFinish}
          footer={
            <Button block type="submit" color="primary" size="large" loading={loading}>
              登 录
            </Button>
          }
        >
          <Form.Item
            name="phone_number"
            label="手机号码"
            rules={[{ required: true, message: '手机号码不能为空!' }]}
          >
            <Input placeholder="请输入您的手机号码" clearable />
          </Form.Item>
          
          <Form.Item
            name="password"
            label="密码"
            rules={[{ required: true, message: '密码不能为空!' }]}
          >
            <Input placeholder="请输入您的密码" type="password" clearable />
          </Form.Item>
        </Form>
        
        {/* 提供注册页面的入口 */}
        <Space direction="vertical" style={{ marginTop: '24px', width: '100%' }}>
            <div style={{ textAlign: 'center', color: '#666' }}>
                没有账户？ <Link to="/register" style={{ color: '#005a9c' }}>立即注册</Link>
            </div>
        </Space>
      </div>
    </div>
  );
};

export default LoginPage;
