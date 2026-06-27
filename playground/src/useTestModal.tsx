import { useContext } from 'react';
import { generateSingleDialogHook } from '../../src';
import { Form, Input, InputNumber, Modal } from 'antd';
import { AppContext } from './AppContext';

const name = 'TestModal' as const;

interface Payload {
  visible: boolean;
  success: (formValues: Record<string, any>) => void;
}

export const useTestModal = generateSingleDialogHook<typeof name, Payload>(
  name,
  ({ payload, setPayload }) => {
    const { visible } = payload;
    const { name, age } = useContext(AppContext);
    const [form] = Form.useForm();

    const handleOk = async () => {
      const values = await form.validateFields();
      payload.success?.(values);
      setPayload({ visible: false });
    };

    const handleCancel = () => {
      setPayload({ visible: false });
    };

    return (
      <Modal title="Test Modal" open={visible} width={500} onOk={handleOk} onCancel={handleCancel}>
        <Form form={form} initialValues={{ name, age }} labelCol={{ span: 4 }}>
          <Form.Item label="Name" name="name" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item label="Age" name="age" rules={[{ required: true }]}>
            <InputNumber min={1} max={120} style={{ width: '100%' }} />
          </Form.Item>
        </Form>
      </Modal>
    );
  },
);
