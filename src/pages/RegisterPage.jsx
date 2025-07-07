import { useState } from 'react';
import { Form, Input, Button, Toast, NavBar, Selector, TextArea, DatePicker } from 'antd-mobile';
import { useNavigate, Link } from 'react-router-dom';
import api from '../services/api';

const formatDate = (date) => {
  if (!date) return null;
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

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
      return;
    }
    
    setLoading(true);

    try {
      // 构建发送到后端的 payload，包含所有必填字段
      const payload = {
        name: values.name,
        gender: values.gender[0],
        birthday: formatDate(values.birthday),
        address: values.address,
        phone_number: values.phone_number,
        password: values.password,
      };

      const response = await api.post('/auth/register', payload);

      if (response.data.success) {
        Toast.show({
          icon: 'success',
          content: '注册成功！请使用新账户登录。',
          duration: 2000,
        });
        
        setTimeout(() => {
          navigate('/login');
        }, 1500);

      } else {
        Toast.show({
          icon: 'fail',
          content: response.data.message || '注册失败，请稍后重试',
        });
      }
    } catch (error) {
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
      <NavBar onBack={() => navigate(-1)}>新用户注册</NavBar>
      
      <div style={{ padding: '24px', backgroundColor: '#ffffff', minHeight: 'calc(100vh - 45px)' }}>
        <Form
          layout="vertical"
          onFinish={onFinish}
          footer={
            <Button block type="submit" color="primary" size="large" loading={loading}>
              <span>同意协议并注册</span>
            </Button>
          }
        >
          <Form.Item name="name" label="您的姓名" rules={[{ required: true, message: '姓名不能为空' }]}>
            <Input placeholder="请输入您的真实姓名" />
          </Form.Item>

          <Form.Item name="gender" label="性别" rules={[{ required: true, message: '请选择您的性别' }]}>
             <Selector options={[{label: '男', value: '男'}, {label: '女', value: '女'}]} />
          </Form.Item>
          
          <Form.Item
            name="birthday"
            label="出生日期"
            trigger="onConfirm"
            onClick={(datePickerRef) => {
              datePickerRef.current?.open();
            }}
            rules={[{ required: true, message: '请选择您的出生日期' }]}
          >
            <DatePicker max={new Date()} min={new Date('1900-01-01')}>
              {value => value ? formatDate(value) : '请选择出生日期'}
            </DatePicker>
          </Form.Item>

          <Form.Item name="address" label="联系地址" rules={[{ required: true, message: '联系地址不能为空' }]}>
            <TextArea placeholder="请输入您的详细联系地址" autoSize={{ minRows: 2, maxRows: 4 }} />
          </Form.Item>

          <Form.Item name="phone_number" label="手机号码" rules={[{ required: true, message: '手机号码是登录的唯一凭证' }]}>
            <Input placeholder="请输入您的手机号码" />
          </Form.Item>

          <Form.Item name="password" label="设置密码" rules={[{ required: true, message: '密码不能为空' }, { min: 6, message: '密码长度不能少于6位'}]}>
            <Input placeholder="请设置至少6位数的密码" type="password" />
          </Form.Item>

          <Form.Item name="confirm_password" label="确认密码" rules={[{ required: true, message: '请再次输入密码' }]}>
            <Input placeholder="请再次输入您的密码" type="password" />
          </Form.Item>
        </Form>
        
        <div style={{ textAlign: 'center', marginTop: '20px', color: '#888' }}>
          已有账户？ <Link to="/login" style={{ color: '#005a9c', fontWeight: 'bold' }}>立即登录</Link>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
