import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Form, Input, Button, Toast, NavBar, ImageUploader, SpinLoading, Selector } from 'antd-mobile';
import api from '../services/api';

const ApplicationPage = () => {
  const navigate = useNavigate();
  const params = useParams(); // 获取URL中的ID，例如 /apply/123 -> { id: '123' }
  const location = useLocation(); // 获取路由状态，用于接收HomePage传来的数据

  const [form] = Form.useForm();
  const [pageLoading, setPageLoading] = useState(true);
  const [submitLoading, setSubmitLoading] = useState(false);

  // 使用state来管理图片上传组件的文件列表
  const [idFrontFileList, setIdFrontFileList] = useState([]);
  const [idBackFileList, setIdBackFileList] = useState([]);

  // 判断当前是“新建”还是“修改”模式
  const mode = params.id ? 'update' : 'create';
  const applicationId = params.id;

  // Effect Hook: 在组件加载时执行一次，用于数据初始化
  useEffect(() => {
    const initializePage = async () => {
      if (mode === 'create') {
        // 新建模式：获取当前登录用户的个人资料以预填表单
        try {
          const res = await api.get('/auth/profile');
          if (res.data.success) {
            // 使用 form.setFieldsValue 预填信息
            form.setFieldsValue({
              name: res.data.data.name,
              id_number: res.data.data.id_number,
              id_type: res.data.data.id_type,
            });
          }
        } catch (error) {
          Toast.show({ icon: 'fail', content: error.response?.data?.message||'无法获取用户信息' });
        }
      } else {
        // 修改模式：从 location.state 中获取已有的申请数据
        const existingData = location.state?.applicationData;
        if (existingData) {
          form.setFieldsValue(existingData);
          // 将已有的图片URL设置到ImageUploader中
          if (existingData.id_front_photo_url) {
            setIdFrontFileList([{ url: existingData.id_front_photo_url }]);
          }
          if (existingData.id_back_photo_url) {
            setIdBackFileList([{ url: existingData.id_back_photo_url }]);
          }
        } else {
            // 如果用户直接通过URL访问修改页，没有数据，则提示并返回
            Toast.show({icon: 'fail', content: '缺少申请数据，请返回主页重试'});
            navigate('/', {replace: true});
            return;
        }
      }
      setPageLoading(false);
    };

    initializePage();
  }, [mode, form, navigate, location.state]);

  // 自定义图片上传逻辑
  const customUpload = async (file) => {
    const formData = new FormData();
    formData.append('file', file);

    Toast.show({ icon: 'loading', content: '上传中...', duration: 0 });

    try {
      const res = await api.post('/file/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      Toast.clear();

      if (res.data.success) {
        Toast.show({ icon: 'success', content: '上传成功' });
        // ImageUploader 需要返回一个包含url属性的对象
        return { url: res.data.data.url };
      } else {
        throw new Error('上传失败');
      }
    } catch (error) {
      Toast.clear();
      Toast.show({ icon: 'fail', content: error.response?.data?.message || '上传失败' });
      throw error;
    }
  };

  // 表单提交
  const onFinish = async (values) => {
    if (idFrontFileList.length === 0 || idBackFileList.length === 0) {
      Toast.show({ content: '请务必上传身份证正反面照片' });
      return;
    }
    
    setSubmitLoading(true);
    
    const payload = {
        id_front_photo_url: idFrontFileList[0].url,
        id_back_photo_url: idBackFileList[0].url,
    };

    try {
        let response;
        if (mode === 'create') {
            // 新建模式，调用 submit 接口
            payload.id_type = values.id_type;
            payload.id_number = values.id_number;
            response = await api.post('/application/submit', payload);
        } else {
            // 修改模式，调用 update 接口
            payload.application_id = parseInt(applicationId, 10);
            response = await api.post('/application/update', payload);
        }

        if (response.data.success) {
            Toast.show({ icon: 'success', content: mode === 'create' ? '申请提交成功！' : '申请修改成功！' });
            // 操作成功后，返回主页
            setTimeout(() => navigate('/', { replace: true }), 1500);
        } else {
            Toast.show({ icon: 'fail', content: response.data.message });
            setSubmitLoading(false);
        }
    } catch (error) {
        Toast.show({ icon: 'fail', content: error.response?.data?.message || '操作失败' });
        setSubmitLoading(false);
    }
  };

  if (pageLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <SpinLoading color='primary' />
      </div>
    );
  }

  return (
    <div style={{ backgroundColor: '#f5f5f5', minHeight: '100vh' }}>
      <NavBar onBack={() => navigate(-1)}>
        {mode === 'create' ? '填写申请信息' : '修改申请信息'}
      </NavBar>
      
      <Form
        form={form}
        layout='vertical'
        onFinish={onFinish}
        footer={
          <Button block type='submit' color='primary' size='large' loading={submitLoading}>
            {mode === 'create' ? '确认提交' : '确认修改'}
          </Button>
        }
      >
        <Form.Header>个人信息</Form.Header>
        <Form.Item name="name" label="申请人姓名" disabled>
          <Input placeholder='将自动填充' />
        </Form.Item>
        <Form.Item name="id_type" label="证件类型" rules={[{ required: true }]} disabled={mode === 'update'}>
             <Selector
                options={[{label: '居民身份证', value: '居民身份证'}, {label: '港澳台居民居住证', value: '港澳台居民居住证'}]}
             />
        </Form.Item>
        <Form.Item name="id_number" label="证件号码" rules={[{ required: true }]} disabled={mode === 'update'}>
          <Input placeholder='将自动填充' />
        </Form.Item>

        <Form.Header>证件照片上传 (请上传清晰的原始照片)</Form.Header>
        <Form.Item label="身份证明文件正面" rules={[{ required: true }]} extra="即有头像的一面">
          <ImageUploader
            value={idFrontFileList}
            onChange={setIdFrontFileList}
            upload={customUpload}
            maxCount={1}
          />
        </Form.Item>
        <Form.Item label="身份证明文件反面" rules={[{ required: true }]} extra="即有国徽的一面">
          <ImageUploader
            value={idBackFileList}
            onChange={setIdBackFileList}
            upload={customUpload}
            maxCount={1}
          />
        </Form.Item>
      </Form>
    </div>
  );
};

export default ApplicationPage;
