import { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Form, Input, Button, Toast, NavBar, ImageUploader, SpinLoading, Selector, DatePicker, NoticeBar } from 'antd-mobile';
import api from '../services/api';

const formatDate = (date) => {
  if (!date) return null;
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const getEditableFieldsFromComments = (comments) => {
    const editable = {
        name: false,
        gender: false,
        birthday: false,
        phone_number: false,
        address: false,
        id_number: false, // 证件号和类型通常不允许修改，但以防万一
        id_type: false,
        photos: false 
    };

    if (!comments) return editable; // 如果没有评论，则所有都不可编辑

    // 根据关键词判断
    if (comments.includes('姓名') || comments.includes('名字')) {
        editable.name = true;
    }
    if (comments.includes('性别')) {
        editable.gender = true;
    }
    if (comments.includes('出生日期') || comments.includes('生日') || comments.includes('年龄')) {
        editable.birthday = true;
    }
    if (comments.includes('手机号码') || comments.includes('电话') || comments.includes('联系方式')) {
        editable.phone_number = true;
    }
    if (comments.includes('联系地址') || comments.includes('住址')) {
        editable.address = true;
    }
    if (comments.includes('证件号码')) {
        editable.id_number = true;
    }
    if (comments.includes('照片')) {
        editable.photos = true;     
    }
    return editable;
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

  // 控制字段可编辑性 和 存储审核意见
  const [editableFields, setEditableFields] = useState({});
  const [rejectionComments, setRejectionComments] = useState('');

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
              birthday: profileData.birthday ? new Date(profileData.birthday) : null,
              phone_number: profileData.phone_number,
              address: profileData.address,
             id_type: '居民身份证',
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
          if (existingData.status === 'REJECTED' && existingData.comments) {
              setRejectionComments(existingData.comments);
              const fieldsToEdit = getEditableFieldsFromComments(existingData.comments);
              setEditableFields(fieldsToEdit);

              if (fieldsToEdit.photos) {
              setIdFrontFileList([]);
              setIdBackFileList([]);
            } else {
              if (existingData.id_front_photo_url) setIdFrontFileList([{ url: existingData.id_front_photo_url }]);
              if (existingData.id_back_photo_url) setIdBackFileList([{ url: existingData.id_back_photo_url }]);        
            }
          }
          const dataWithDateObject = {
            ...existingData,
            birthday: existingData.birthday ? new Date(existingData.birthday) : null,
          };
          form.setFieldsValue(dataWithDateObject);

          } else {
            Toast.show({icon: 'fail', content: '缺少申请数据，请返回主页重试'});
            navigate('/', {replace: true});
            return;
        }
      }
      setPageLoading(false);
    };
      // 使用 setTimeout 解决 antd-mobile form 的时序警告
      const timer = setTimeout(() => initializePage(), 0);
      return () => clearTimeout(timer);
  }, [mode, form, navigate, location.state]);
  
  // 自定义图片上传逻辑
  const customUpload = async (file) => {
    const formData = new FormData();
    formData.append('file', file);

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
      // 在更新模式下，只提交可编辑的字段
    if (mode === 'update') {
        if (!editableFields.photos && 
            (idFrontFileList[0]?.url !== location.state?.applicationData?.id_front_photo_url || 
             idBackFileList[0]?.url !== location.state?.applicationData?.id_back_photo_url)) {
            Toast.show({ content: '不允许修改身份证照片' });
            return;
        }
        
        // Only require photos when they are editable
        if (editableFields.photos && (idFrontFileList.length === 0 || idBackFileList.length === 0)) {
            Toast.show({ content: '请务必重新上传身份证正反面照片' });
            return;
        }
    } else { // create 模式
        if (idFrontFileList.length === 0 || idBackFileList.length === 0) {
            Toast.show({ content: '请务必上传身份证正反面照片' });
            return;
        }
    }
      setSubmitLoading(true);

      try {
          let response;
          if (mode === 'create') {
              const payload = { ...values, gender: values.gender[0], birthday: formatDate(values.birthday), id_front_photo_url: idFrontFileList[0].url, id_back_photo_url: idBackFileList[0].url };
              response = await api.post('/application/submit', payload);
          } else { // 'update' 模式
              // 动态构建只包含已修改字段的 payload
              const updatePayload = { application_id: parseInt(applicationId, 10) };
              for (const key in editableFields) {
                  if (editableFields[key] === true) {
                      if (key === 'photos') {
                          updatePayload.id_front_photo_url = idFrontFileList[0]?.url;
                          updatePayload.id_back_photo_url = idBackFileList[0]?.url;
                      } else if (key === 'birthday') {
                          updatePayload.birthday = formatDate(values.birthday);
                      } else {
                          updatePayload[key] = values[key];
                      }
                  }
              }
              response = await api.post('/application/update', updatePayload);
          }

          if (response.data.success) {
              Toast.show({ icon: 'success', content: mode === 'create' ? '申请提交成功！' : '申请修改成功！' });
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
// 判断某个字段是否应被禁用
  const isFieldDisabled = (fieldName) => {
      if (mode !== 'update') return false; // create 模式下都可编辑
      // 在 update 模式下，如果 editableFields 未定义或字段值为 false，则禁用
      return !editableFields[fieldName];
  };

    return (
        <div style={{ backgroundColor: '#f5f5f5', minHeight: '100vh' }}>
            <NavBar onBack={() => navigate(-1)}>
                {mode === 'create' ? '填写申请信息' : '修改申请信息'}
            </NavBar>

            {/* 在修改模式下显示审核意见 */}
            {mode === 'update' && rejectionComments && (
                <NoticeBar
                    content={rejectionComments}
                    color="warning"
                    style={{ margin: '10px' }}
                >
                    修改说明
                </NoticeBar>
            )}

            <Form form={form} layout='vertical' onFinish={onFinish}
            footer={ 
            <Button block type='submit' color='primary' size='large' 
            loading={submitLoading}>
            {mode === 'create' ? '确认提交' : '确认修改'}
            </Button> 
            }
            >
                <Form.Header>个人信息</Form.Header>
                <Form.Item name="name" label="申请人姓名" rules={[{ required: true }]} disabled={isFieldDisabled('name')}>
                    <Input placeholder='请输入姓名' />
                </Form.Item>

                <Form.Item name="gender" label="性别" rules={[{ required: true }]} disabled={isFieldDisabled('gender')}>
                    <Selector options={[{label: '男', value: '男'}, {label: '女', value: '女'}]} />
                </Form.Item>

                <Form.Item name="birthday" label="出生日期" rules={[{ required: true }]} disabled={isFieldDisabled('birthday')} onClick={isFieldDisabled('birthday') ? null : (e, ref) => ref.current?.open()}>
                    <DatePicker max={new Date()}min={new Date('1900-01-01')} 
                    onConfirm={(value) => {form.setFieldsValue({ birthday: value });}}>{value => value ? formatDate(value) : '请选择出生日期'}</DatePicker>
                </Form.Item>

                <Form.Item name="phone_number" label="手机号码" rules={[{ required: true }]} disabled={isFieldDisabled('phone_number')}>
                    <Input placeholder='请输入手机号码' />
                </Form.Item>
                
                <Form.Item name="address" label="联系地址" rules={[{ required: true }]} disabled={isFieldDisabled('address')}>
                    <Input placeholder='请输入联系地址' />
                </Form.Item>
                
                <Form.Header>证件信息</Form.Header>
                <Form.Item name="id_type" label="证件类型" rules={[{ required: true }]} disabled={isFieldDisabled('id_type')}>
                    <Selector options={[{label: '居民身份证', value: '居民身份证'}, {label: '港澳台居民居住证', value: '港澳台居民居住证'}]} />
                </Form.Item>
                
                <Form.Item name="id_number" label="证件号码" rules={[{ required: true }]} disabled={isFieldDisabled('id_number')}>
                    <Input placeholder='请输入证件号码' />
                </Form.Item>

                <Form.Header>证件照片上传</Form.Header>
                <Form.Item label="身份证明文件正面" rules={[{ required: true }]} extra="头像面">
                    <ImageUploader value={idFrontFileList} onChange={setIdFrontFileList} upload={customUpload} maxCount={1} disabled={isFieldDisabled('photos')} />
                </Form.Item>
                <Form.Item label="身份证明文件反面" rules={[{ required: true }]} extra="国徽面">
                    <ImageUploader value={idBackFileList} onChange={setIdBackFileList} upload={customUpload} maxCount={1} disabled={isFieldDisabled('photos')} />
                </Form.Item>
            </Form>
        </div>
    );
};

export default ApplicationPage;
