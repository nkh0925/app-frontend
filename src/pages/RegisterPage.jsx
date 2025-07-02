import { useState } from 'react';
import { Form, Input, Button, Toast, NavBar, Radio, Space, TextArea } from 'antd-mobile';
import { useNavigate, Link } from 'react-router-dom';
import api from '../services/api'; 

const RegisterPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  // 表单提交处理函数
  const onFinish = async (values) => {
    // 检查两次输入的密码是否一致
    if (values.password !== values.confirm_password) {
      Toast.show({
        icon: 'fail',
        content: '两次输入的密码不一致！',
      });
      return; // 提前退出
    }
    
    setLoading(true);

    try {
      // 我记得后端注册接口需要 name, gender, address, phone_number, password
      const response = await api.post('/auth/register', {
        name: values.name,
        gender: values.gender,
        address: values.address,
        phone_number: values.phone_number,
        password: values.password,
      });

      if (response.data.success) {
        Toast.show({
          icon: 'success',
          content: '注册成功！请使用新账户登录。',
          duration: 2000,
        });
        
        // 注册成功后，自动跳转到登录页面
        setTimeout(() => {
          navigate('/login');
        }, 1500); // 延迟跳转，让用户能看到成功提示

      } else {
        // 显示后端返回的业务错误信息，例如手机号已被注册
        Toast.show({
          icon: 'fail',
          content: response.data.message || '注册失败，请稍后重试',
        });
      }
    } catch (error) {
      // 网络错误或服务器500错误
      Toast.show({
        icon: 'fail',
        content: error.response?.data?.message || '网络繁忙，请稍后重试',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {/* 适老化设计：清晰的导航栏标题，并提供返回功能 */}
      <NavBar onBack={() => navigate(-1)}>新用户注册</NavBar>
      
      <div style={{ padding: '24px', backgroundColor: '#ffffff', minHeight: 'calc(100vh - 45px)' }}>
        <Form
          layout="vertical"
          onFinish={onFinish}
          footer={
            <Button block type="submit" color="primary" size="large" loading={loading}>
              同意协议并注册
            </Button>
          }
        >
          {/* 适老化设计：所有标签清晰明了，输入框已通过全局CSS放大 */}
          <Form.Item
            name="name"
            label="您的姓名"
            rules={[{ required: true, message: '姓名不能为空' }]}
          >
            <Input placeholder="请输入您的真实姓名" />
          </Form.Item>

          <Form.Item
            name="gender"
            label="性别"
            rules={[{ required: true, message: '请选择您的性别' }]}
          >
            {/* 使用Radio组件对老年用户更友好，避免输入错误 */}
            <Radio.Group>
              <Space>
                <Radio value="男">男</Radio>
                <Radio value="女">女</Radio>
              </Space>
            </Radio.Group>
          </Form.Item>

          <Form.Item
            name="address"
            label="联系地址"
            rules={[{ required: true, message: '联系地址不能为空' }]}
          >
            {/* 使用TextArea允许多行输入，更适合地址格式 */}
            <TextArea
              placeholder="请输入您的详细联系地址"
              autoSize={{ minRows: 2, maxRows: 4 }}
            />
          </Form.Item>

          <Form.Item
            name="phone_number"
            label="手机号码"
            rules={[{ required: true, message: '手机号码是登录的唯一凭证' }]}
          >
            <Input placeholder="请输入您的手机号码" />
          </Form.Item>

          <Form.Item
            name="password"
            label="设置密码"
            rules={[{ required: true, message: '密码不能为空' }, { min: 6, message: '密码长度不能少于6位'}]}
          >
            <Input placeholder="请设置至少6位数的密码" type="password" />
          </Form.Item>

          <Form.Item
            name="confirm_password"
            label="确认密码"
            rules={[{ required: true, message: '请再次输入密码' }]}
          >
            <Input placeholder="请再次输入您的密码" type="password" />
          </Form.Item>
        </Form>
        
        {/* 提供返回登录页的入口 */}
        <div style={{ textAlign: 'center', marginTop: '20px', color: '#888' }}>
          已有账户？ <Link to="/login" style={{ color: '#005a9c', fontWeight: 'bold' }}>立即登录</Link>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
