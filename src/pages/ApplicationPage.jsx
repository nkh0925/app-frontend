import { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Form, Input, Button, Toast, NavBar, ImageUploader, SpinLoading, Selector, DatePicker } from 'antd-mobile';
import api from '../services/api';

const formatDate = (date) => {
  if (!date) return null;
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

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
      setPageLoading(true); 
      if (mode === 'create') {
        // 新建模式：获取当前登录用户的个人资料以预填表单
        try {
          const res = await api.get('/auth/profile');
          if (res.data.success) {
            const profileData = res.data.data;
            // 准备要填充到表单的数据
            const formValues = {
              name: profileData.name,
              gender: profileData.gender,
              phone_number: profileData.phone_number,
              address: profileData.address,
             id_type: '居民身份证',
              birthday: profileData.birthday ? new Date(profileData.birthday) : null,
            };
            // 使用 form.setFieldsValue 预填所有信息
            form.setFieldsValue(formValues);
          }
        } catch (error) {
          Toast.show({ icon: 'fail', content: error.response?.data?.message||'无法获取用户信息' });
        }
      } else {
        const existingData = location.state?.applicationData;
        if (existingData) {
          const dataWithDateObject = {
            ...existingData,
            birthday: existingData.birthday ? new Date(existingData.birthday) : null,
          };
          form.setFieldsValue(dataWithDateObject);
          if (existingData.id_front_photo_url) setIdFrontFileList([{ url: existingData.id_front_photo_url }]);
          if (existingData.id_back_photo_url) setIdBackFileList([{ url: existingData.id_back_photo_url }]);        } else {
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
        ...values,
        birthday: formatDate(values.birthday),
        id_front_photo_url: idFrontFileList[0].url,
        id_back_photo_url: idBackFileList[0].url,
    };

    try {
        let response;
        if (mode === 'create') {
            // 新建模式，调用 submit 接口
            response = await api.post('/application/submit', payload);
        } else {
            // 修改模式，调用 update 接口
        const updatePayload = {
            application_id: parseInt(applicationId, 10),
            name: payload.name,
            gender: payload.gender,
            phone_number: payload.phone_number,
            address: payload.address,
            id_type: payload.id_type,
            id_number: payload.id_number,
            birthday: payload.birthday,
            id_front_photo_url: payload.id_front_photo_url,
            id_back_photo_url: payload.id_back_photo_url,
        }
        response = await api.post('/application/update', updatePayload);
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
        <Form.Item name="name" label="申请人姓名" rules={[{ required: true }]}>
          <Input placeholder='请输入姓名' />
        </Form.Item>

        <Form.Item name="gender" label="性别" rules={[{ required: true }]}>
             <Selector options={[{label: '男', value: '男'}, {label: '女', value: '女'}]} />
        </Form.Item>

        <Form.Item
          name="birthday"
          label="出生日期"
          trigger="onConfirm"
          onClick={(e, datePickerRef) => {
            datePickerRef.current?.open();
          }}
          rules={[{ required: true, message: '请选择您的出生日期' }]}
          disabled={mode === 'update'}
        >
          <DatePicker max={new Date()}>
            {value => value ? formatDate(value) : '请选择出生日期'}
          </DatePicker>
        </Form.Item>

        <Form.Item name="phone_number" label="手机号码" rules={[{ required: true }]}>
            <Input placeholder='请输入手机号码' />
        </Form.Item>
        
        <Form.Item name="address" label="联系地址" rules={[{ required: true }]}>
            <Input placeholder='请输入联系地址' />
        </Form.Item>
        
        <Form.Header>证件信息</Form.Header>

        <Form.Item name="id_type" label="证件类型" rules={[{ required: true }]} disabled={mode === 'update'}>
             <Selector options={[{label: '居民身份证', value: '居民身份证'}, {label: '港澳台居民居住证', value: '港澳台居民居住证'}]} />
        </Form.Item>
        
        <Form.Item name="id_number" label="证件号码" rules={[{ required: true }]} disabled={mode === 'update'}>
          <Input placeholder='请输入证件号码' />
        </Form.Item>

        <Form.Header>证件照片上传</Form.Header>
        <Form.Item label="身份证明文件正面" rules={[{ required: true }]} extra="即有头像的一面">
          <ImageUploader value={idFrontFileList} onChange={setIdFrontFileList} upload={customUpload} maxCount={1} />
        </Form.Item>
        <Form.Item label="身份证明文件反面" rules={[{ required: true }]} extra="即有国徽的一面">
          <ImageUploader value={idBackFileList} onChange={setIdBackFileList} upload={customUpload} maxCount={1} />
        </Form.Item>
      </Form>    </div>
  );
};

export default ApplicationPage;
